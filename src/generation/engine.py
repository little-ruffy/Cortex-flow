import openai
import ollama
from sentence_transformers import SentenceTransformer, util, CrossEncoder
from rank_bm25 import BM25Okapi
import numpy as np
from typing import Dict, List, Optional
import logging
import base64
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GenerationEngine:
    def __init__(self, 
                 openai_api_key: Optional[str] = None, 
                 embedding_model: str = 'all-MiniLM-L6-v2',
                 reranker_model: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2'):
        self.openai_api_key = openai_api_key
        self.embedding_model_name = embedding_model
        
        trust_remote = False
        if 'qwen' in embedding_model.lower():
            trust_remote = True
        self.embedder = SentenceTransformer(embedding_model, trust_remote_code=trust_remote)
        
        trust_remote_rerank = False
        if 'qwen' in reranker_model.lower():
            trust_remote_rerank = True
        self.cross_encoder = CrossEncoder(reranker_model, trust_remote_code=trust_remote_rerank)
        
        self.langchain_embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={'trust_remote_code': trust_remote}
        )
        
        self.generic_corpus = [
            "This is a standard post.", "Today was a good day.", "Check out this update.",
            "I am happy to share this news.", "Work is going well.", "Here is a photo."
        ]
        self.generic_embedding = self.embedder.encode(self.generic_corpus).mean(axis=0)

    def analyze_image(self, image_bytes: bytes, model_name: str) -> str:
        if "gpt" in model_name.lower():
            return self._analyze_image_openai(image_bytes, model_name)
        else:
            return self._analyze_image_ollama(image_bytes, model_name)

    def _analyze_image_openai(self, image_bytes: bytes, model: str) -> str:
        if not self.openai_api_key:
            return "Error: OpenAI API Key not provided for image analysis."
        
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        client = openai.OpenAI(api_key=self.openai_api_key)
        
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe this image in detail, focusing on the mood, aesthetic, and key elements. Keep it concise."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"OpenAI Vision Error: {e}"

    def _analyze_image_ollama(self, image_bytes: bytes, model: str) -> str:
        try:
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            response = ollama.chat(model='llava:13b', messages=[
                {
                    'role': 'user', 
                    'content': 'Describe this image in detail, focusing on the mood, aesthetic, and key elements.',
                    'images': [base64_image]
                },
            ])
            return response['message']['content']
        except Exception as e:
            return f"Ollama Vision Error (ensure 'llava' is pulled): {e}"

    def generate_hooks(self, topic: str, style_profile: Dict, model_name: str) -> List[str]:
        prompt = f"""
        You are a social media expert. Write on language that is used in topic. Generate 5 distinct "Hooks" (opening lines) for a post about: "{topic}".
        
        Style Context:
        - Tone: {style_profile.get('tone', 'Neutral')}
        - Keywords: {', '.join(style_profile.get('top_keywords', [])[:5])}
        
        Use these 5 frameworks:
        1. The Contrarian (Go against common belief)
        2. The Storyteller (Start with "I remember when...")
        3. The Data Drop (Start with a surprising stat)
        4. The Question (Ask a provocative question)
        5. The Statement (Short, punchy fact)
        
        Output ONLY the 5 hooks as a numbered list. Do not include the framework names in the final output.
        """
        
        if "gpt-5" in model_name.lower():
            response = self._generate_openai(prompt, model_name)
        else:
            response = self._generate_ollama(prompt, model_name)
            
        hooks = []
        for line in response.split('\n'):
            clean_line = line.strip()
            if clean_line and (clean_line[0].isdigit() and clean_line[1] in ['.', ')']):
                hooks.append(clean_line.split(' ', 1)[1].strip())
        
        return hooks[:5]

    def _sliced_wasserstein(self, X: np.ndarray, Y: np.ndarray, num_projections: int = 50) -> float:
        dim = X.shape[1]
        projections = np.random.randn(dim, num_projections)
        projections /= np.linalg.norm(projections, axis=0)

        X_proj = X @ projections
        Y_proj = Y @ projections

        X_proj.sort(axis=0)
        Y_proj.sort(axis=0)

        if X_proj.shape[0] != Y_proj.shape[0]:
            new_Y = np.zeros_like(X_proj)
            for i in range(num_projections):
                new_Y[:, i] = np.interp(
                    np.linspace(0, 1, X_proj.shape[0]),
                    np.linspace(0, 1, Y_proj.shape[0]),
                    Y_proj[:, i]
                )
            Y_proj = new_Y

        return np.mean(np.abs(X_proj - Y_proj))

    def generate_post(self, 
                      style_profile: Dict, 
                      topic: str, 
                      model_name: str, 
                      strategy: str, 
                      user_posts: List[str] = [],
                      image_description: Optional[str] = None,
                      enable_rag: bool = False,
                      additional_context: str = "",
                      platforms: List[str] = ["Default"],
                      enable_critic: bool = False) -> Dict[str, str]:
        
        results = {}
        
        user_embeddings = None
        if user_posts and (strategy == "Wasserstein Style Copy" or enable_critic):
            user_embeddings = self.embedder.encode(user_posts)

        rag_context = []
        if enable_rag and user_posts:
            rag_context = self._chroma_rag_retrieval(topic, user_posts, k=3)

        for platform in platforms:
            prompt = self._construct_prompt(
                style_profile, topic, strategy, user_posts, image_description, 
                enable_rag, additional_context, platform, user_embeddings, rag_context
            )
            
            if enable_critic and user_posts:
                generated_text = self._wasserstein_critic_loop(prompt, model_name, style_profile, user_embeddings)
            else:
                if "gpt-5" in model_name.lower():
                    generated_text = self._generate_openai(prompt, model_name)
                else:
                    generated_text = self._generate_ollama(prompt, model_name)
            
            results[platform] = generated_text
            
        return results

    def _chroma_rag_retrieval(self, query: str, documents: List[str], k: int = 3) -> List[str]:
        try:
            db = Chroma.from_texts(
                texts=documents,
                embedding=self.langchain_embeddings,
                collection_name="temp_user_context"
            )
            retriever = db.as_retriever(search_kwargs={"k": k})
            docs = retriever.invoke(query)
            
            results = [doc.page_content for doc in docs]
            
            db.delete_collection()
            return results
        except Exception as e:
            logger.error(f"ChromaDB RAG Error: {e}")
            return self._hybrid_search_rerank(query, documents, top_k=k)

    def _wasserstein_critic_loop(self, prompt: str, model_name: str, style_profile: Dict, user_embeddings: Optional[np.ndarray] = None) -> str:
        from src.analysis.style import StyleAnalyzer
        analyzer = StyleAnalyzer()
        
        if "gpt-5" in model_name.lower():
            draft = self._generate_openai(prompt, model_name)
        else:
            draft = self._generate_ollama(prompt, model_name)
            
        draft_metrics = analyzer.extract_metrics(draft)
        user_metrics = style_profile.get('metrics_distribution', {})
        
        critiques = []
        
        if 'length' in user_metrics and user_metrics['length']:
            w_dist = analyzer.calculate_wasserstein_distance([draft_metrics['length']], user_metrics['length'])
            avg_len = np.mean(user_metrics['length'])
            if w_dist > 20:
                if draft_metrics['length'] > avg_len:
                    critiques.append(f"The post is too long ({draft_metrics['length']} words). Aim for closer to {int(avg_len)} words.")
                else:
                    critiques.append(f"The post is too short ({draft_metrics['length']} words). Expand to around {int(avg_len)} words.")

        if 'readability' in user_metrics and user_metrics['readability']:
             w_dist_read = analyzer.calculate_wasserstein_distance([draft_metrics['readability']], user_metrics['readability'])
             avg_read = np.mean(user_metrics['readability'])
             if w_dist_read > 15:
                 if draft_metrics['readability'] > avg_read:
                     critiques.append("The tone is too simple. Make it more complex/professional.")
                 else:
                     critiques.append("The tone is too complex. Make it simpler and more accessible.")

        if user_embeddings is not None:
            draft_emb = self.embedder.encode([draft])
            swd = self._sliced_wasserstein(draft_emb, user_embeddings)
            
            if swd > 0.5:
                 critiques.append("The semantic style deviates from your usual topics/vibe. Align closer to your past themes.")

        if critiques:
            critique_prompt = f"""
            Original Draft:
            {draft}
            
            CRITIQUE:
            {' '.join(critiques)}
            
            Rewrite the post to address the critique while keeping the original message.
            """
            logger.info(f"Triggering Wasserstein Critic: {critiques}")
            if "gpt-5" in model_name.lower():
                return self._generate_openai(critique_prompt, model_name)
            else:
                return self._generate_ollama(critique_prompt, model_name)
        
        return draft

    def _construct_prompt(self, style: Dict, topic: str, strategy: str, user_posts: List[str], 
                          image_desc: Optional[str], enable_rag: bool, additional_context: str, platform: str,
                          user_embeddings: Optional[np.ndarray] = None, rag_context: List[str] = []) -> str:
        
        base_prompt = f"""
        You are a social media manager. Write on language that is used in topic. Write a post for {platform} about: "{topic}".
        
        Style Guidelines:
        - Tone: {style.get('tone', 'Neutral')}
        - Average Length: {style.get('avg_length', 20)} words
        - Emoji Usage: {'High' if style.get('emoji_density', 0) > 2 else 'Low'}
        - Structure: {', '.join(style.get('structure_features', []))}
        """

        if image_desc:
            base_prompt += f"\n\nContext from Image: {image_desc}\nIncorporate this visual context into the post naturally."
            
        if additional_context:
            base_prompt += f"\n\nAdditional Context: {additional_context}"

        if enable_rag and rag_context:
             base_prompt += "\n\nRetrieved Context (RAG):\n" + "\n".join([f"- {ctx}" for ctx in rag_context])

        if strategy == "Prompt Engineering":
             base_prompt += f"\nKey Vocabulary: {', '.join(style.get('top_keywords', []))}"

        elif strategy == "RAG Style Transfer":
            if user_posts:
                examples = self._hybrid_search_rerank(topic, user_posts, top_k=3)
                base_prompt += "\n\nHere are some examples of my past posts to mimic:\n"
                for ex in examples:
                    base_prompt += f"- {ex}\n"

        elif strategy == "Wasserstein Style Copy":
            if user_posts and user_embeddings is not None:
                
                mean_emb = np.mean(user_embeddings, axis=0)
                dists = np.linalg.norm(user_embeddings - mean_emb, axis=1)
                
                sorted_indices = np.argsort(dists)
                
                idx1 = sorted_indices[0]
                idx2 = sorted_indices[-1]
                idx3 = sorted_indices[len(sorted_indices)//2]
                
                best_indices = [idx1, idx2, idx3]
                best_examples = [user_posts[i] for i in best_indices]
                
                base_prompt += "\n\nStyle Reference (Distribution Matched):\n"
                for ex in best_examples:
                    base_prompt += f"- {ex}\n"

        elif strategy == "Latent Space Disentanglement":
            if user_posts:
                user_emb = self.embedder.encode(user_posts).mean(axis=0)
                style_vector = user_emb - self.generic_embedding
                
                keywords = style.get('top_keywords', [])
                if keywords:
                    kw_embs = self.embedder.encode(keywords)
                    sims = util.cos_sim(style_vector, kw_embs)[0]
                    top_style_indices = np.argsort(sims)[-3:]
                    style_tokens = [keywords[i] for i in top_style_indices]
                    
                    base_prompt += f"\n\nCRITICAL: You must infuse the following 'signature' concepts/words into the text to capture the unique latent style: {', '.join(style_tokens)}."

        elif strategy == "Chain of Thought (CoT)":
            base_prompt += """
            \nBefore writing the post, think step-by-step:
            1. Analyze the requested tone and structure.
            2. Brainstorm 3 different hooks that match the user's style.
            3. Select the best hook.
            4. Draft the content ensuring vocabulary matches the 'Key Vocabulary'.
            5. Review against the Style Guidelines.
            
            Output your reasoning first, then the final post.
            """
            base_prompt += f"\nKey Vocabulary: {', '.join(style.get('top_keywords', []))}"

        elif strategy == "Contrastive Prompting":
            base_prompt += f"""
            \nCONTRASTIVE INSTRUCTION:
            Do NOT write like a generic corporate bot.
            Do NOT use these generic phrases: "Thrilled to announce", "Game changer", "In today's fast-paced world".
            
            Instead, write EXACTLY like the user who uses these words: {', '.join(style.get('top_keywords', []))}.
            The tone must be strictly {style.get('tone', 'Neutral')}.
            """

        return base_prompt

    def _hybrid_search_rerank(self, query: str, documents: List[str], top_k: int = 3) -> List[str]:
        if not documents:
            return []
            
        tokenized_docs = [doc.split() for doc in documents]
        bm25 = BM25Okapi(tokenized_docs)
        tokenized_query = query.split()
        bm25_scores = bm25.get_scores(tokenized_query)
        
        query_emb = self.embedder.encode(query)
        doc_embs = self.embedder.encode(documents)
        semantic_scores = util.cos_sim(query_emb, doc_embs)[0].numpy()
        
        min_len = min(len(bm25_scores), len(semantic_scores))
        combined_scores = 0.3 * bm25_scores[:min_len] + 0.7 * semantic_scores[:min_len]
        
        top_indices = np.argsort(combined_scores)[-min(10, len(documents)):]
        candidates = [documents[i] for i in top_indices]
        
        cross_inp = [[query, doc] for doc in candidates]
        cross_scores = self.cross_encoder.predict(cross_inp)
        
        final_top_indices = np.argsort(cross_scores)[-top_k:]
        final_results = [candidates[i] for i in final_top_indices]
        
        return final_results

    def _generate_openai(self, prompt: str, model: str) -> str:
        if not self.openai_api_key:
            return "Error: OpenAI API Key not provided."
        
        client = openai.OpenAI(api_key=self.openai_api_key)
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"OpenAI Error: {e}"

    def _generate_ollama(self, prompt: str, model: str) -> str:
        try:
            response = ollama.chat(model=model, messages=[
                {'role': 'user', 'content': prompt},
            ])
            return response['message']['content']
        except Exception as e:
            return f"Ollama Error: {e}"