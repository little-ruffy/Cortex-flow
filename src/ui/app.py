import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.parsers.instagram import InstagramParser
from src.parsers.linkedin import LinkedInParser
from src.analysis.style import StyleAnalyzer, FluencyScorer
from src.generation.engine import GenerationEngine

st.set_page_config(page_title="Social Style Mimic", layout="wide")

st.title("Kitty Buster")

st.sidebar.header("Configuration")
openai_key = st.sidebar.text_input("OpenAI API Key", type="password")

st.sidebar.subheader("RAG Models")
embedding_model = st.sidebar.selectbox(
    "Embedding Model", 
    ["all-MiniLM-L6-v2", "Qwen/Qwen3-Embedding-0.6B(sometimes dont work)"]
)
reranker_model = st.sidebar.selectbox(
    "Re-ranker Model", 
    ["cross-encoder/ms-marco-MiniLM-L-6-v2", "Qwen/Qwen3-Reranker-0.6B(sometimes dont work)"]
)

st.sidebar.subheader("Instagram Credentials")
st.sidebar.write("(if something gone wrong, try to fill this)")
insta_user = st.sidebar.text_input("Username")
insta_pass = st.sidebar.text_input("Password", type="password")
st.sidebar.subheader("LinkedIn Credentials")
st.sidebar.write("(if something gone wrong, try to fill this)")
linkedin_email = st.sidebar.text_input("Email")
linkedin_pass = st.sidebar.text_input("LinkedIn Password", type="password")

if 'posts' not in st.session_state:
    st.session_state.posts = []
if 'style_profile' not in st.session_state:
    st.session_state.style_profile = None

@st.cache_resource
def get_generation_engine(api_key, embed_model, rank_model):
    return GenerationEngine(
        openai_api_key=api_key,
        embedding_model=embed_model,
        reranker_model=rank_model
    )

st.header("1. Parse Profile")
col1, col2 = st.columns([3, 1])
with col1:
    profile_url = st.text_input("Profile URL / Username")
with col2:
    platform = st.selectbox("Platform", ["Instagram", "LinkedIn"])

if st.button("Analyze Profile"):
    with st.spinner("Parsing, Analyzing... And meowing!"):
        posts = []
        if platform == "Instagram":
            parser = InstagramParser(insta_user, insta_pass)
            username = profile_url.split('/')[-2] if 'instagram.com' in profile_url else profile_url
            posts = parser.get_posts(username, limit=50)
        else:
            parser = LinkedInParser(linkedin_email, linkedin_pass)
            pid = profile_url.split('/in/')[-1].strip('/') if 'linkedin.com' in profile_url else profile_url
            posts = parser.get_posts(pid, limit=50)
        
        if posts:
            st.session_state.posts = [p['text'] for p in posts if p['text']]
            analyzer = StyleAnalyzer()
            st.session_state.style_profile = analyzer.analyze_style(st.session_state.posts)
            st.success(f"Successfully parsed {len(posts)} posts!")
        else:
            st.error("No posts found or authentication failed.")

if st.session_state.style_profile:
    st.header("2. Style Portrait")
    st.write(f"Fluency (Readability) - https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests#Flesch_reading_ease")
    st.write(f"Grade Level - https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests#Flesch%E2%80%93Kincaid_grade_level")
    sp = st.session_state.style_profile
    
    c1, c2, c3, c4, c5, c6, c7 = st.columns(7)
    c1.metric("Avg Length", f"{sp['avg_length']} words")
    c2.metric("Fluency (Readability)", sp['readability_score'])
    c3.metric("Emoji Density", sp['emoji_density'])
    c4.metric("Avg Sentences", sp['sentence_count'])
    c5.metric("Grade Level", sp['grade_level'])
    c6.metric("Reading Time", sp['reading_time'])
    c7.metric("Tone", sp['tone'])   
    
    st.subheader("Key Structure & Vocabulary")
    st.write(f"**Structure:** {', '.join(sp['structure_features'])}")
    st.write(f"**Top Keywords:** {', '.join(sp['top_keywords'])}")

    st.header("3. Generate New Post")
    
    topic = st.text_input("Topic for new post")

    uploaded_file = st.file_uploader("Upload an Image (Optional - for visual context)", type=['jpg', 'png', 'jpeg'])
    
    col_gen1, col_gen2 = st.columns(2)
    with col_gen1:
        model_choice = st.selectbox("Model", ["gpt-5-mini", "llava:13b", "gpt-oss:20b"])
    with col_gen2:
        strategy = st.selectbox("Style Transfer Strategy", [
            "Prompt Engineering (Bruh so silly idea)", 
            "RAG Style Transfer", 
            "Wasserstein Style Copy",
            "Latent Space Disentanglement",
            "Chain of Thought (CoT) (Bruh so silly idea)",
            "Contrastive Prompting (Bruh so silly idea)"
        ])

    if topic:
        with st.expander("Hook Optimizer (Optional) - also it little bit autistic, sometimes use english instead of local language. BUT! if small amount of english words, in 90(%) final generation everything will be ok)", expanded=False):
            if st.button("Generate Hooks"):
                with st.spinner("Brainstorming your kitty... meow :3"):
                    engine = get_generation_engine(openai_key, embedding_model, reranker_model)
                    st.session_state.hooks = engine.generate_hooks(topic, st.session_state.style_profile, model_choice)
            
            if 'hooks' in st.session_state and st.session_state.hooks:
                selected_hook = st.radio("Select a Hook to start your post:", st.session_state.hooks)
                if selected_hook:
                    st.info(f"Selected Hook: {selected_hook}")
                    st.caption("This hook will be used as the opening line.")
            else:
                selected_hook = None
    else:
        selected_hook = None
    
    with st.expander("Advanced Options", expanded=True):
        enable_rag = st.checkbox("Enable Global RAG (Reference past posts)", value=False)
        enable_critic = st.checkbox("Enable Wasserstein Critic (Auto-correction) - Little bit tune final post in length, readability and grade level", value=False)
        additional_context = st.text_area("Additional Context (e.g., specific details, links, CTA)")
        
        platforms = st.multiselect("Target Platforms", ["LinkedIn", "Instagram", "Twitter/X"], default=[platform])
    
    if st.button("Generate Post"):
        if not topic:
            st.warning("Please enter a topic.")
        else:
            with st.spinner("Generating... And meowing!"):
                engine = get_generation_engine(openai_key, embedding_model, reranker_model)
                
                image_desc = None
                if uploaded_file:
                    with st.spinner("Analyzing Image... meow :3"):
                        image_bytes = uploaded_file.getvalue()
                        vision_model = model_choice if "gpt-5" in model_choice or "llava" in model_choice else "gpt-5-mini"
                        if "gpt-5" not in vision_model and "llava" not in vision_model:
                             st.warning(f"Model {model_choice} might not support vision. Trying gpt-5-mini for vision analysis.")
                             vision_model = "gpt-5-mini"
                        
                        image_desc = engine.analyze_image(image_bytes, vision_model)
                        st.info(f"Image Analysis: {image_desc[:100]}...")

                final_topic = topic
                if selected_hook:
                    final_topic = f"Start with this hook: '{selected_hook}'. Topic: {topic}"

                generated_results = engine.generate_post(
                    st.session_state.style_profile,
                    final_topic,
                    model_choice,
                    strategy,
                    st.session_state.posts,
                    image_description=image_desc,
                    enable_rag=enable_rag,
                    additional_context=additional_context,
                    platforms=platforms if platforms else [platform],
                    enable_critic=enable_critic
                )
                
                st.subheader("Generated Post(s)")
                
                if len(generated_results) == 1:
                    platform_name = list(generated_results.keys())[0]
                    text = generated_results[platform_name]
                    st.text_area(f"Result ({platform_name})", text, height=300)
                    
                    scorer = FluencyScorer()
                    new_fluency = scorer.score(text)
                    
                    from src.analysis.style import StyleAnalyzer
                    analyzer = StyleAnalyzer()
                    metrics = analyzer.extract_metrics(text)
                    
                    m1, m2, m3, m4 = st.columns(4)
                    m1.metric("Fluency", round(new_fluency, 1), delta=round(new_fluency - sp['readability_score'], 1))
                    m2.metric("Reading Time", f"{round(metrics['reading_time'], 1)}s")
                    m3.metric("Grade Level", round(metrics['grade_level'], 1))
                    m4.metric("Word Count", metrics['length'])
                    
                else:
                    tabs = st.tabs(generated_results.keys())
                    scorer = FluencyScorer()
                    from src.analysis.style import StyleAnalyzer
                    analyzer = StyleAnalyzer()
                    
                    for i, (plat, text) in enumerate(generated_results.items()):
                        with tabs[i]:
                            st.text_area(f"Draft for {plat}", text, height=300)
                            new_fluency = scorer.score(text)
                            metrics = analyzer.extract_metrics(text)
                            
                            m1, m2, m3, m4 = st.columns(4)
                            m1.metric("Fluency", round(new_fluency, 1))
                            m2.metric("Reading Time", f"{round(metrics['reading_time'], 1)}s")
                            m3.metric("Grade Level", round(metrics['grade_level'], 1))
                            m4.metric("Word Count", metrics['length'])
