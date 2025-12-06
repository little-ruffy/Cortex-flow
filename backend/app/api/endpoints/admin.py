from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
import shutil
import os
from tempfile import NamedTemporaryFile
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.ai_engine import ai_engine
from app.schemas import SystemConfig
from pydantic import BaseModel
import json
from app.core.config import settings
from app.services.style_service import style_service
from fastapi.responses import FileResponse, StreamingResponse
import io
import csv

router = APIRouter()

class EvalRequest(BaseModel):
    text1: str
    text2: str

@router.post("/evaluate")
async def evaluate_text(req: EvalRequest):
    return style_service.evaluate_similarity(req.text1, req.text2)

async def process_file_background(temp_path: str, filename: str):
    try:
        suffix = os.path.splitext(filename)[1]
        loader = None
        
        if suffix.lower() == ".pdf":
            loader = PyPDFLoader(temp_path)
        elif suffix.lower() in [".docx", ".doc"]:
            loader = Docx2txtLoader(temp_path)
        elif suffix.lower() == ".txt":
            loader = TextLoader(temp_path)
        elif suffix.lower() == ".csv":
            loader = CSVLoader(temp_path, encoding='utf-8')
        
        if loader:
            docs = loader.load()
            for d in docs:
                d.metadata["source"] = filename
                
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_documents(docs)
            if chunks:
                await ai_engine.add_documents(chunks)
                print(f"Background: Successfully processed {len(chunks)} chunks from {filename}")
    except Exception as e:
        print(f"Background: Error processing {filename}: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/upload-document")
async def upload_document(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    for file in files:
        if file.filename:
            suffix = os.path.splitext(file.filename)[1]
            with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name
            
            background_tasks.add_task(process_file_background, tmp_path, file.filename)
    
    return {"message": "Uploads accepted. Processing started in background."}

@router.get("/documents")
async def list_documents():
    docs = await ai_engine.list_documents()
    return {"documents": docs}

@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    await ai_engine.delete_document(filename)
    return {"message": f"Deleted {filename}"}

@router.get("/analytics")
async def get_analytics(source: str = None):
    FEEDBACK_FILE = "feedback.json"
    if not os.path.exists(FEEDBACK_FILE):
          return {
            "auto_resolution_rate": 0,
            "average_response_time": "0s",
            "total_tickets": 0
        }
    
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if source:
        if source == "playground":
             data = [d for d in data if d.get("source") == "playground"]
        else:
             data = [d for d in data if d.get("source") != "playground"]

    total = len(data)
    if total == 0:
         return {
            "auto_resolution_rate": 0,
            "average_response_time": "0s",
            "total_tickets": 0
        }

    auto_resolved = sum(1 for d in data if d.get("result", {}).get("action") == "auto_reply")
    spam = sum(1 for d in data if d.get("result", {}).get("action") == "spam")
    rate = round(((auto_resolved + spam) / total) * 100, 1)

    recent = data[-5:][::-1]
    
    issues = [d for d in data if d.get("rating") == "dislike" or d.get("result", {}).get("action") == "create_ticket"]
    top_issues = issues[-5:][::-1]
    
    return {
        "auto_resolution_rate": rate,
        "average_response_time": "0.8s",
        "total_tickets": total,
        "recent_activity": recent,
        "top_issues": top_issues
    }

@router.get("/settings", response_model=SystemConfig)
async def get_settings():
    return ai_engine.config

@router.post("/settings")
async def update_settings(config: SystemConfig):
    ai_engine.config = config
    ai_engine.save_config()
    
    ai_engine.reload_models(config)
    
    return {"message": "Settings updated, saved, and applied."}

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/analyze-style")
async def analyze_style(req: AnalyzeRequest):
    return style_service.analyze_style(req.text)

@router.get("/feedback")
async def get_feedback():
    FEEDBACK_FILE = "feedback.json"
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

class RateRequest(BaseModel):
    rating: str

@router.post("/feedback/{index}/rate")
async def rate_feedback(index: int, req: RateRequest):
    FEEDBACK_FILE = "feedback.json"
    if not os.path.exists(FEEDBACK_FILE):
        raise HTTPException(status_code=404, detail="No feedback found")
    
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if 0 <= index < len(data):
        data[index]["rating"] = req.rating
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return {"message": "Rated"}
    
    raise HTTPException(status_code=404, detail="Index out of bounds")

@router.delete("/feedback/all")
async def delete_all_feedback():
    FEEDBACK_FILE = "feedback.json"
    if os.path.exists(FEEDBACK_FILE):
        try:
            os.remove(FEEDBACK_FILE)
            return {"message": "All feedback cleared"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete feedback: {e}")
    return {"message": "No feedback to delete"}

@router.get("/feedback/download")
async def download_feedback():
    FEEDBACK_FILE = "feedback.json"
    if not os.path.exists(FEEDBACK_FILE):
        return {"error": "No data"}
        
    with open(FEEDBACK_FILE, "r") as f:
        data = json.load(f)
        
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "text", "source", "action", "response", "rating"])
    
    for d in data:
        writer.writerow([
            d.get("timestamp", ""),
            d.get("text", ""),
            d.get("source", ""),
            d.get("result", {}).get("action", ""),
            d.get("result", {}).get("response", ""),
            d.get("rating", "")
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=feedback.csv"}
    )

class ChunkUpdate(BaseModel):
    content: str

@router.get("/documents/{filename}/chunks")
async def get_document_chunks(filename: str):
    chunks = await ai_engine.get_chunks(filename)
    return {"chunks": chunks}

@router.put("/chunks/{chunk_id}")
async def update_chunk(chunk_id: str, update: ChunkUpdate):
    await ai_engine.update_chunk(chunk_id, update.content)
    return {"message": "Chunk updated"}

class OperatorReplyRequest(BaseModel):
    ticket_id: str
    reply_text: str

@router.post("/operator/reply")
async def operator_reply(req: OperatorReplyRequest):
    FEEDBACK_FILE = "feedback.json"
    if not os.path.exists(FEEDBACK_FILE):
        raise HTTPException(status_code=404, detail="No tickets found")
    
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    ticket = next((d for d in data if d.get("id") == req.ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    source = ticket.get("source")
    contact = ticket.get("contact_info", {})
    
    if source == "telegram" and "chat_id" in contact:
        from app.services.telegram_bot import telegram_service
        if telegram_service.application:
             await telegram_service.application.bot.send_message(chat_id=contact["chat_id"], text=req.reply_text)
    elif source == "email" and "email" in contact:
        from app.services.email_bot import email_service
        subject = "Support Reply"
        if "Subject:" in ticket["text"]:
            subject = "Re: " + ticket["text"].split("\n")[0].replace("Subject:", "").strip()
        email_service.send_reply(contact["email"], subject, req.reply_text)
    
    ticket["status"] = "resolved"
    ticket["result"]["response"] = req.reply_text
    ticket["result"]["action"] = "operator_reply"
    
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    return {"message": "Reply sent and ticket resolved"}

@router.get("/operator/tickets")
async def get_pending_tickets():
    FEEDBACK_FILE = "feedback.json"
    if not os.path.exists(FEEDBACK_FILE): 
        return []
    with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [d for d in data if d.get("status") == "pending"]
