"""
Conversation Service - Handles chat/voice interactions and conversation management
"""
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
from datetime import datetime
import os
import httpx
from typing import Optional, List
import json
import logging
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DIHAC Conversation Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ANALYSIS_SERVICE_URL = os.getenv("ANALYSIS_SERVICE_URL", "http://localhost:8003")

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
    description = Column(Text)
    status = Column(Enum("draft", "in_progress", "analyzed", "archived"), default="draft")
    case_indicator = Column(Enum("thumbs_up", "thumbs_down", "pending"), default="pending")
    win_probability = Column(String(10))
    analysis_data = Column(Text)  # JSON string of complete analysis
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    conversations = relationship("Conversation", back_populates="case", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    user_message = Column(Text, nullable=False)
    system_response = Column(Text)
    message_type = Column(Enum("text", "voice", "evidence", "witness"), default="text")
    created_at = Column(DateTime, default=func.now())
    case = relationship("Case", back_populates="conversations")

# Pydantic models
class MessageRequest(BaseModel):
    case_id: Optional[int] = None
    message: str
    message_type: str = "text"

class MessageResponse(BaseModel):
    conversation_id: int
    user_message: str
    system_response: str
    clarifying_questions: Optional[List[str]] = None
    case_id: int
    analysis: Optional[dict] = None

class ConversationHistory(BaseModel):
    conversations: List[dict]
    case_id: int
    case_status: str
    analysis: Optional[dict] = None

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def generate_case_title(message: str) -> str:
    """Generate a short case title from the first message"""
    # Remove common question words and clean up
    words = message.strip().split()
    
    # Remove leading question words
    question_starters = ["can", "could", "should", "would", "how", "what", "when", "where", "why", "who", "is", "are", "do", "does", "did", "i"]
    filtered_words = []
    skip_next = False
    
    for i, word in enumerate(words):
        lower_word = word.lower().strip('?.,!;:')
        if i < 3 and lower_word in question_starters:
            skip_next = True
            continue
        if skip_next and lower_word in ["i", "you", "we", "they", "he", "she"]:
            continue
        skip_next = False
        filtered_words.append(word)
    
    # Take first 6-8 meaningful words
    title_words = filtered_words[:8]
    title = " ".join(title_words)
    
    # Clean up punctuation at the end
    title = title.rstrip('?.,!;:')
    
    # Truncate if too long
    if len(title) > 60:
        title = title[:57] + "..."
    
    # Capitalize first letter
    if title:
        title = title[0].upper() + title[1:]
    else:
        title = "New Case"
    
    return title

async def call_analysis_service(case_id: int, message: str, conversation_history: List[dict], files_data: List[dict] = None) -> dict:
    """Call analysis service to get AI response and clarifying questions"""
    try:
        # Extended timeout for CPU-based LLM inference (will be faster with GPU in production)
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes
            payload = {
                "user_message": message,
                "conversation_history": conversation_history,
                "case_context": {"case_id": case_id}
            }
            
            # Add files data if present
            if files_data:
                payload["files"] = files_data
                
            response = await client.post(
                f"{ANALYSIS_SERVICE_URL}/api/analyze",
                json=payload
            )
            if response.status_code == 200:
                result = response.json()
                # Transform response to match expected format
                return {
                    "response": result.get("response", ""),
                    "questions": result.get("clarifying_questions", []),
                    "analysis": result.get("analysis")
                }
            else:
                return {"response": "I'm processing your message. Could you provide more details?", "questions": [], "analysis": None}
    except Exception as e:
        print(f"Error calling analysis service: {str(e)}")
        return {"response": "I'm processing your message. Could you provide more details?", "questions": [], "analysis": None}

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "conversation-service"}

@app.post("/api/message", response_model=MessageResponse)
async def send_message(
    message: str = Form(...),
    case_id: Optional[int] = Form(None),
    message_type: str = Form("text"),
    files: List[UploadFile] = File(default=[]),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Send a message with optional file attachments and get AI response"""
    
    # Get user ID from token
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # Process uploaded files
    files_data = []
    if files:
        for file in files:
            content = await file.read()
            # Convert to base64 for transmission to LLM service
            file_data = {
                "filename": file.filename,
                "content_type": file.content_type,
                "data": base64.b64encode(content).decode('utf-8')
            }
            files_data.append(file_data)
            logger.info(f"Processed file: {file.filename} ({file.content_type})")
    
    # Get or create case
    if case_id:
        case = db.query(Case).filter(Case.id == case_id, Case.user_id == user_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
    else:
        # Create new case with generated title from first message
        case = Case(
            user_id=user_id,
            title=generate_case_title(message),
            description=message[:500] if len(message) > 500 else message,
            status="in_progress"
        )
        db.add(case)
        db.commit()
        db.refresh(case)
    
    # Get conversation history
    previous_conversations = db.query(Conversation).filter(
        Conversation.case_id == case.id
    ).order_by(Conversation.created_at).all()
    
    conversation_history = [
        {
            "user_message": conv.user_message,
            "system_response": conv.system_response,
            "timestamp": conv.created_at.isoformat()
        }
        for conv in previous_conversations
    ]
    
    # Call analysis service with files
    analysis_result = await call_analysis_service(case.id, message, conversation_history, files_data)
    
    # Save conversation
    conversation = Conversation(
        case_id=case.id,
        user_message=message,
        system_response=analysis_result.get("response", ""),
        message_type=message_type
    )
    db.add(conversation)
    
    # Update case status and save analysis if available
    case.status = "in_progress"
    case.updated_at = datetime.utcnow()
    
    # Save analysis data to case if available
    if analysis_result.get("analysis"):
        case.analysis_data = json.dumps(analysis_result["analysis"])
        # Also update win_probability for quick access - extract numeric value
        win_prob_str = analysis_result["analysis"].get("winProbability", "")
        try:
            # Extract number from "65%" or "65" format
            win_prob_numeric = float(win_prob_str.rstrip('%'))
            case.win_probability = win_prob_numeric
        except (ValueError, AttributeError):
            logger.warning(f"Could not parse win probability: {win_prob_str}")
            case.win_probability = None
    
    db.commit()
    db.refresh(conversation)
    
    return MessageResponse(
        conversation_id=conversation.id,
        user_message=conversation.user_message,
        system_response=conversation.system_response,
        clarifying_questions=analysis_result.get("questions", []),
        case_id=case.id,
        analysis=analysis_result.get("analysis")
    )

@app.get("/api/conversations/{case_id}", response_model=ConversationHistory)
async def get_conversation_history(
    case_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get conversation history for a case"""
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    conversations = db.query(Conversation).filter(
        Conversation.case_id == case_id
    ).order_by(Conversation.created_at).all()
    
    # Parse analysis data if available
    analysis_data = None
    if case.analysis_data:
        try:
            analysis_data = json.loads(case.analysis_data)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse analysis_data for case {case_id}")
    
    return ConversationHistory(
        conversations=[
            {
                "id": conv.id,
                "user_message": conv.user_message,
                "system_response": conv.system_response,
                "message_type": conv.message_type,
                "created_at": conv.created_at.isoformat()
            }
            for conv in conversations
        ],
        case_id=case_id,
        case_status=case.status,
        analysis=analysis_data
    )

@app.get("/api/cases", response_model=List[dict])
async def get_user_cases(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all cases for the current user"""
    cases = db.query(Case).filter(Case.user_id == user_id).order_by(Case.created_at.desc()).all()
    
    return [
        {
            "id": case.id,
            "title": case.title,
            "description": case.description,
            "status": case.status,
            "case_indicator": case.case_indicator,
            "win_probability": case.win_probability,
            "created_at": case.created_at.isoformat(),
            "updated_at": case.updated_at.isoformat()
        }
        for case in cases
    ]

@app.delete("/api/cases/{case_id}")
async def delete_case(
    case_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a case and all its conversations"""
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    db.delete(case)
    db.commit()
    
    return {"message": "Case deleted successfully", "case_id": case_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

