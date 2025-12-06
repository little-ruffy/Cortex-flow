from fastapi import FastAPI
from app.core.config import settings
from app.api import api_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.PROJECT_NAME, version="0.1.0")

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    from app.services.telegram_bot import telegram_service
    from app.services.email_bot import email_service
    import asyncio
    
    asyncio.create_task(telegram_service.start())
    asyncio.create_task(email_service.start_loop())
    print("Integration services startup initiated.")

@app.get("/")
def root():
    return {"message": "AI Help Desk API is running"}
