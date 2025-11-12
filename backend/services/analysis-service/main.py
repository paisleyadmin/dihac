"""
Analysis Service - Handles LLM integration, case analysis, and RAG
"""
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Enum, ForeignKey, func, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os
import httpx
from typing import Optional, List, Dict
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DIHAC Analysis Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# LLM Configuration
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://localhost:8007")
LEGAL_RESEARCH_SERVICE_URL = os.getenv("LEGAL_RESEARCH_SERVICE_URL", "http://localhost:8004")
RAG_ENABLED = os.getenv("RAG_ENABLED", "true").lower() == "true"

# Models
class CaseAnalysis(Base):
    __tablename__ = "case_analysis"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    analysis_summary = Column(Text)
    strengths = Column(Text)
    weaknesses = Column(Text)
    recommendations = Column(Text)
    llm_model_used = Column(String(100))
    analysis_timestamp = Column(DateTime, default=func.now())

# Pydantic models
class AnalyzeMessageRequest(BaseModel):
    case_id: int
    message: str
    conversation_history: List[Dict]

class AnalyzeMessageResponse(BaseModel):
    response: str
    questions: List[str] = []

class CaseAnalysisRequest(BaseModel):
    case_id: int

class CaseAnalysisResponse(BaseModel):
    case_id: int
    case_indicator: str  # thumbs_up or thumbs_down
    win_probability: float
    analysis_summary: str
    strengths: str
    weaknesses: str
    recommendations: str

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# LLM Integration
async def call_llm(prompt: str, system_prompt: Optional[str] = None, conversation_history: List[Dict] = []) -> Dict:
    """Call dedicated LLM service for analysis"""
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes for LLM
            payload = {
                "user_message": prompt,
                "conversation_history": conversation_history,
                "case_context": {}
            }
            
            logger.info(f"Calling LLM service with prompt: {prompt[:100]}...")
            
            response = await client.post(
                f"{LLM_SERVICE_URL}/api/analyze",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"LLM service response: {result}")
                return result
            else:
                logger.error(f"LLM service error: {response.status_code} - {response.text}")
                return {
                    "response": "I'm having trouble processing your request. Please try again.",
                    "clarifying_questions": [],
                    "case_assessment": None,
                    "confidence_level": "low"
                }
    except Exception as e:
        logger.error(f"Error calling LLM service: {str(e)}", exc_info=True)
        return {
            "response": "I'm having trouble processing your request. Please try again.",
            "clarifying_questions": [],
            "case_assessment": None,
            "confidence_level": "low"
        }

# RAG Integration
async def retrieve_relevant_context(query: str, db: Session) -> List[str]:
    """Retrieve relevant legal context using RAG"""
    if not RAG_ENABLED:
        return []
    
    try:
        # Simple keyword-based retrieval (can be enhanced with vector search)
        # In production, use a proper vector database like ChromaDB, Pinecone, or Weaviate
        from sqlalchemy import text
        
        # Search in RAG documents table
        search_query = text("""
            SELECT document_title, document_content 
            FROM rag_documents 
            WHERE document_content LIKE :query
            LIMIT 5
        """)
        
        results = db.execute(search_query, {"query": f"%{query}%"})
        contexts = []
        for row in results:
            contexts.append(f"{row[0]}: {row[1][:500]}")
        
        return contexts
    except Exception as e:
        logger.error(f"Error in RAG retrieval: {str(e)}")
        return []

# Analysis Functions
async def analyze_message(case_id: int, message: str, conversation_history: List[Dict], db: Session) -> Dict:
    """Analyze user message and generate response with clarifying questions"""
    
    # Build conversation context
    context = "Previous conversation:\n"
    for conv in conversation_history[-5:]:  # Last 5 messages
        context += f"User: {conv.get('user_message', '')}\n"
        context += f"Assistant: {conv.get('system_response', '')}\n\n"
    
    # Retrieve relevant legal context using RAG
    rag_context = await retrieve_relevant_context(message, db)
    rag_text = "\n".join(rag_context) if rag_context else ""
    
    # Call LLM service with conversation history
    llm_result = await call_llm(message, conversation_history=conversation_history)
    
    return AnalyzeMessageResponse(
        response=llm_result.get("response", "I'm processing your message."),
        questions=llm_result.get("clarifying_questions", []),
        case_id=case_id
    )

async def perform_case_analysis(case_id: int, db: Session) -> Dict:
    """Perform comprehensive case analysis"""
    
    # Get all conversations for the case
    from sqlalchemy import text
    conversations_query = text("""
        SELECT user_message, system_response 
        FROM conversations 
        WHERE case_id = :case_id 
        ORDER BY created_at
    """)
    conversations = db.execute(conversations_query, {"case_id": case_id}).fetchall()
    
    # Build case summary
    case_summary = "Case Summary:\n"
    for conv in conversations:
        case_summary += f"User: {conv[0]}\n"
        case_summary += f"Assistant: {conv[1]}\n\n"
    
    # Retrieve relevant legal context
    rag_context = await retrieve_relevant_context(case_summary, db)
    rag_text = "\n".join(rag_context) if rag_context else ""
    
    # Create analysis prompt
    system_prompt = """You are a legal analyst evaluating a potential case. 
    Analyze the facts and provide:
    1. Case indicator: thumbs_up (strong case) or thumbs_down (weak case)
    2. Win probability: 0-100%
    3. Analysis summary
    4. Strengths of the case
    5. Weaknesses of the case
    6. Recommendations"""
    
    analysis_prompt = f"""{case_summary}

Relevant legal context:
{rag_text}

Please analyze this case and provide your assessment in JSON format:
{{
    "case_indicator": "thumbs_up" or "thumbs_down",
    "win_probability": 0-100,
    "analysis_summary": "brief summary",
    "strengths": "list of strengths",
    "weaknesses": "list of weaknesses",
    "recommendations": "recommendations for the user"
}}"""
    
    llm_response = await call_llm(analysis_prompt, system_prompt)
    
    # Parse response
    try:
        if "```json" in llm_response:
            json_start = llm_response.find("```json") + 7
            json_end = llm_response.find("```", json_start)
            llm_response = llm_response[json_start:json_end].strip()
        elif "```" in llm_response:
            json_start = llm_response.find("```") + 3
            json_end = llm_response.find("```", json_start)
            llm_response = llm_response[json_start:json_end].strip()
        
        analysis = json.loads(llm_response)
        
        # Save analysis to database
        case_analysis = CaseAnalysis(
            case_id=case_id,
            analysis_summary=analysis.get("analysis_summary", ""),
            strengths=analysis.get("strengths", ""),
            weaknesses=analysis.get("weaknesses", ""),
            recommendations=analysis.get("recommendations", ""),
            llm_model_used="llama2"
        )
        db.merge(case_analysis)
        
        # Update case status
        from sqlalchemy import text
        update_query = text("""
            UPDATE cases 
            SET case_indicator = :indicator, 
                win_probability = :probability,
                status = 'analyzed'
            WHERE id = :case_id
        """)
        db.execute(update_query, {
            "indicator": analysis.get("case_indicator", "pending"),
            "probability": str(analysis.get("win_probability", 0)),
            "case_id": case_id
        })
        db.commit()
        
        return analysis
    except Exception as e:
        logger.error(f"Error parsing analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Error analyzing case")

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "analysis-service"}

@app.post("/api/analyze-message", response_model=AnalyzeMessageResponse)
async def analyze_message_endpoint(
    request: AnalyzeMessageRequest,
    db: Session = Depends(get_db)
):
    """Analyze a user message and return response with clarifying questions"""
    result = await analyze_message(
        request.case_id,
        request.message,
        request.conversation_history,
        db
    )
    return result  # analyze_message already returns AnalyzeMessageResponse object


@app.post("/api/analyze-case", response_model=CaseAnalysisResponse)
async def analyze_case_endpoint(
    request: CaseAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Perform comprehensive case analysis"""
    analysis = await perform_case_analysis(request.case_id, db)
    
    # Get legal research (laws and precedents)
    try:
        async with httpx.AsyncClient() as client:
            legal_research = await client.post(
                f"{LEGAL_RESEARCH_SERVICE_URL}/api/research",
                json={"case_id": request.case_id},
                timeout=30.0
            )
            # Legal research service will save results to database
    except Exception as e:
        logger.error(f"Error calling legal research service: {str(e)}")
    
    return CaseAnalysisResponse(
        case_id=request.case_id,
        case_indicator=analysis.get("case_indicator", "pending"),
        win_probability=float(analysis.get("win_probability", 0)),
        analysis_summary=analysis.get("analysis_summary", ""),
        strengths=analysis.get("strengths", ""),
        weaknesses=analysis.get("weaknesses", ""),
        recommendations=analysis.get("recommendations", "")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

