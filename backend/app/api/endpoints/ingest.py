from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
import time
import uuid
import os
import json
from app.services.ai_engine import ai_engine

router = APIRouter()

class IngestRequest(BaseModel):
    text: str
    source: str
    metadata: dict = {}

class LogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
    text: str
    source: str
    contact_info: Optional[dict] = None
    translations: Optional[dict] = None
    status: str = "resolved"
    result: dict
    rating: Optional[str] = None

async def ingest_log(entry: LogEntry):
    FEEDBACK_FILE = "feedback.json"
    existing = []
    if os.path.exists(FEEDBACK_FILE):
        try:
             with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                 existing = json.load(f)
        except: pass
    
    data = entry.dict()
    existing.append(data)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=4, ensure_ascii=False)

@router.post("/message")
async def ingest_message(request: IngestRequest):
    result = await ai_engine.process_incoming_request(request.text, request.source)
    
    await ingest_log(LogEntry(
        text=request.text,
        source=request.source,
        result=result
    ))

    return result
