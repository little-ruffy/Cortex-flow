import os
import json
from app.core.config import settings
from app.schemas import SystemConfig
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_community.retrievers import BM25Retriever
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

class AIEngine:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.CONFIG_FILE = os.path.join(base_dir, "config.json")
        print(f"Config File Path: {self.CONFIG_FILE}")
        
        self.config = self._load_config()
        
        self._setup_models()
        self._setup_vector_db()
        self._setup_bm25()
        self._setup_prompts()

    def _load_config(self) -> SystemConfig:
        if os.path.exists(self.CONFIG_FILE):
            try:
                with open(self.CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return SystemConfig(**data)
            except Exception as e:
                print(f"Failed to load config.json: {e}")
        
        return SystemConfig(
            llm_model=settings.DEFAULT_LLM_MODEL,
            embedding_model=settings.EMBEDDING_MODEL,
            reranker_model="BAAI/bge-reranker-v2-m3"
        )
        
    def save_config(self):
        with open(self.CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(self.config.dict(), f, indent=4, ensure_ascii=False)

    def reload_models(self, new_config: SystemConfig):
        self.config = new_config
        self._setup_models()
        self._setup_vector_db()

    def _setup_models(self):
        if self.config.llm_model.startswith("gpt-5") or self.config.llm_model.startswith("gpt-4"):
            self.llm = ChatOpenAI(
                model=self.config.llm_model, 
                api_key=settings.OPENAI_API_KEY
            )
        else:
            self.llm = ChatOllama(
                model=self.config.llm_model
            )
        
        print(f"Loading Embeddings: {self.config.embedding_model}")
        try:
             self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config.embedding_model,
                model_kwargs={'device': 'cuda', 'trust_remote_code': True}
            )
        except Exception as e:
            print(f"Failed to load user embedding model {self.config.embedding_model}, falling back to defaults: {e}")
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cuda'}
            )
        
        print(f"Loading Reranker: {self.config.reranker_model}")
        try:
           self.reranker = CrossEncoder(self.config.reranker_model, max_length=512, trust_remote_code=True)
        except:
           print("Reranker load failed, fallback to BGE")
           self.reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

    def _setup_vector_db(self):
        self.vector_store = Chroma(
            collection_name="helpdesk_rag_qwen",
            embedding_function=self.embeddings,
            persist_directory=settings.CHROMA_PERSIST_DIRECTORY
        )

    def _setup_bm25(self):
        print("Building BM25 Index...")
        try:
            results = self.vector_store.get()
            docs = []
            if results and results["documents"]:
                for i, content in enumerate(results["documents"]):
                    if content:
                        meta = results["metadatas"][i] if results["metadatas"] else {}
                        docs.append(Document(page_content=content, metadata=meta))
            
            if docs:
                self.bm25_retriever = BM25Retriever.from_documents(docs)
                self.bm25_retriever.k = 10
                print(f"BM25 Index built with {len(docs)} documents")
            else:
                self.bm25_retriever = None
                print("BM25 Index empty")
        except Exception as e:
            print(f"BM25 Init failed: {e}")
            self.bm25_retriever = None

    def _setup_prompts(self):
        self.router_prompt = ChatPromptTemplate.from_template(
            """
            You are an AI Support Routing Agent. Classify the following user request.
            Categories:
            - "spam": Marketing, gibberish, unrelated to IT, construction support.
            - "faq": Common questions (how-to, simple errors, policy questions).
            - "ticket": Complex technical issues, outages, hardware requests, account lockouts requiring admin interaction.

            Analyze urgency (high/medium/low) and specific category (Network, Hardware, Software, Access, etc.).
            
            User Query: {text}
            
            Output strictly valid JSON:
            {{
                "type": "spam" | "faq" | "ticket",
                "priority": "high" | "medium" | "low",
                "category": "string"
            }}
            """
        )

    async def classify_ticket(self, text: str) -> dict:
        chain = self.router_prompt | self.llm | JsonOutputParser()
        try:
            result = await chain.ainvoke({"text": text})
            return result
        except Exception as e:
            print(f"Classification failed: {e}")
            return {"type": "ticket", "priority": "medium", "category": "general"}

    async def hybrid_search(self, query: str) -> list:
        vector_docs = await self.vector_store.asimilarity_search(query, k=20)
        
        bm25_docs = []
        if self.bm25_retriever:
            try:
                bm25_docs = self.bm25_retriever.invoke(query)
            except Exception as e:
                print(f"BM25 search error: {e}")
        
        seen_ids = set()
        combined_docs = []
        
        for d in vector_docs:
            doc_id = d.metadata.get("id", d.page_content[:20])
            if doc_id not in seen_ids:
                combined_docs.append(d)
                seen_ids.add(doc_id)
                
        for d in bm25_docs:
            doc_id = d.metadata.get("id", d.page_content[:20])
            if doc_id not in seen_ids:
                combined_docs.append(d)
                seen_ids.add(doc_id)

        if not combined_docs:
            return []

        passages = [doc.page_content for doc in combined_docs]
        try:
            ranks = self.reranker.rank(query, passages)
            sorted_ranks = sorted(ranks, key=lambda x: x['score'], reverse=True)
            top_indices = [x['corpus_id'] for x in sorted_ranks[:3]]
            return [passages[i] for i in top_indices]
        except Exception as e:
            print(f"Reranking failed: {e}")
            return [d.page_content for d in vector_docs[:3]]

    async def generate_rag_response(self, query: str, context: list) -> str:
        style_instruction = ""
        if self.config.prefer_small_answers:
             style_instruction += " Keep the answer very concise and short."
        if self.config.max_answer_length:
             style_instruction += f" Respond in under {self.config.max_answer_length} characters roughly."
             
        if self.config.style_method == "rag" and self.config.style_example_text:
            style_instruction += f"\n\n[STYLE EXAMPLE]\nHere is an example of the writing style you MUST emulate:\n{self.config.style_example_text}\n[END STYLE EXAMPLE]\n"

        sys_prompt = self.config.system_prompt or "Answer the user's question based ONLY on the following context."

        prompt = ChatPromptTemplate.from_template(
            f"{sys_prompt}\n"
            f"{style_instruction}\n"
            "If you cannot answer the question based on the context or your knowledge, "
            "or if the question requires human intervention, reply EXACTLY with: [ESCALATE]\n\n"
            "Context:\n{context}\n\n"
            "Question: {question}"
        )
        chain = prompt | self.llm
        response = await chain.ainvoke({"context": "\\n\\n".join(context), "question": query})
        initial_answer = response.content

        if self.config.enable_critic_loop:
            critic_prompt = ChatPromptTemplate.from_template(
                """
                You are a strict editor. Review the following answer.
                Original Question: {question}
                Draft Answer: {answer}
                
                Critique Criteria:
                1. Is it concise? (Target: under {max_len} chars)
                2. Is the tone helpful and professional?
                
                If the draft is good, output the draft exactly as is.
                If it can be improved, output ONLY the improved version.
                """
            )
            critic_chain = critic_prompt | self.llm
            critic_response = await critic_chain.ainvoke({
                "question": query, 
                "answer": initial_answer,
                "max_len": self.config.max_answer_length or 200
            })
            return critic_response.content
            
        return initial_answer

    async def add_documents(self, documents: list):
        if not documents:
            return
        
        BATCH_SIZE = 50 
        total_docs = len(documents)
        
        for i in range(0, total_docs, BATCH_SIZE):
            batch = documents[i : i + BATCH_SIZE]
            await self.vector_store.aadd_documents(batch)
            
        self._setup_bm25()

    async def list_documents(self) -> list:
        try:
             results = self.vector_store.get(include=["metadatas"])
             sources = set()
             for m in results["metadatas"]:
                 if m and "source" in m:
                     sources.add(os.path.basename(m["source"]))
             return list(sources)
        except:
             return []

    async def get_chunks(self, source_filename: str) -> list:
        try:
            results = self.vector_store.get(include=["metadatas", "documents"])
            chunks = []
            if results and results["ids"]:
                 for i, meta in enumerate(results["metadatas"]):
                     if meta and "source" in meta and (source_filename in meta["source"] or meta["source"].endswith(source_filename)):
                         chunks.append({
                             "id": results["ids"][i],
                             "content": results["documents"][i],
                             "metadata": meta
                         })
            return chunks
        except Exception as e:
            print(f"Error fetching chunks: {e}")
            return []

    async def update_chunk(self, chunk_id: str, new_content: str):
        self.vector_store.update_document(chunk_id, Document(page_content=new_content))

    async def delete_document(self, filename: str):
        try:
             chunks = await self.get_chunks(filename)
             ids = [c["id"] for c in chunks]
             if ids:
                 self.vector_store.delete(ids=ids)
                 self._setup_bm25()
        except Exception as e:
            print(f"Delete failed: {e}")

    async def process_incoming_request(self, text: str, source: str):
        classification = await self.classify_ticket(text)
        
        if classification["type"] == "spam":
            return {"action": "ignore", "classification": classification}
        
        if classification["type"] == "faq":
            docs = await self.hybrid_search(text)
            if docs:
                answer = await self.generate_rag_response(text, docs)
                if "creating a support ticket" in answer.lower():
                     return {"action": "escalate", "classification": classification, "reason": "RAG miss"}
                return {"action": "auto_reply", "response": answer, "sources": [], "classification": classification}
            
        return {"action": "escalate", "classification": classification}

ai_engine = AIEngine()
