from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Help Desk"
    API_V1_STR: str = "/api/v1"
    
    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    OPENAI_API_KEY: str = ""
    
    DEFAULT_LLM_MODEL: str = "gpt-5-mini"
    EMBEDDING_MODEL: str = "Qwen/Qwen3-Embedding-0.6B"
    
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    SETTINGS_FILE: str = "settings.json"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
