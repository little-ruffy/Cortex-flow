from pydantic import BaseModel

class SystemConfig(BaseModel):
    llm_model: str
    embedding_model: str
    reranker_model: str
    system_prompt: str = "You are a helpful IT support assistant."
    temperature: float = 0.7
    top_k: int = 3
    
    max_answer_length: int = 200
    prefer_small_answers: bool = False
    enable_critic_loop: bool = False
    style_method: str = "rag"
    style_profile: dict = {}
    style_example_text: str = ""

    telegram_token: str = ""
    telegram_enabled: bool = False
    gmail_email: str = ""
    gmail_password: str = ""
    gmail_enabled: bool = False
