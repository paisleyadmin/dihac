"""
Evidence Service - Handles file uploads and evidence management
"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from jose import JWTError, jwt
from datetime import datetime
import os
import aiofiles
from typing import List, Optional
import uuid

app = FastAPI(title="DIHAC Evidence Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Models
class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size = Column(BigInteger)
    description = Column(Text)
    uploaded_at = Column(DateTime, default=func.now())

class Witness(Base):
    __tablename__ = "witnesses"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    name = Column(String(255), nullable=False)
    contact_info = Column(String(255))
    statement = Column(Text)
    relationship = Column(String(255))
    created_at = Column(DateTime, default=func.now())

# Pydantic models
class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    file_name: str
    file_type: Optional[str]
    file_size: Optional[int]
    description: Optional[str]
    uploaded_at: datetime

class WitnessCreate(BaseModel):
    case_id: int
    name: str
    contact_info: Optional[str] = None
    statement: Optional[str] = None
    relationship: Optional[str] = None

class WitnessResponse(BaseModel):
    id: int
    case_id: int
    name: str
    contact_info: Optional[str]
    statement: Optional[str]
    relationship: Optional[str]
    created_at: datetime

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

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "evidence-service"}

@app.post("/api/upload", response_model=EvidenceResponse)
async def upload_evidence(
    case_id: int,
    description: Optional[str] = None,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Upload evidence file"""
    
    # Verify case belongs to user
    from sqlalchemy import text
    case_query = text("SELECT id FROM cases WHERE id = :case_id AND user_id = :user_id")
    case = db.execute(case_query, {"case_id": case_id, "user_id": user_id}).fetchone()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    file_size = len(content)
    
    # Save to database
    evidence = Evidence(
        case_id=case_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
        description=description
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return EvidenceResponse(
        id=evidence.id,
        case_id=evidence.case_id,
        file_name=evidence.file_name,
        file_type=evidence.file_type,
        file_size=evidence.file_size,
        description=evidence.description,
        uploaded_at=evidence.uploaded_at
    )

@app.get("/api/evidence/{case_id}", response_model=List[EvidenceResponse])
async def get_evidence(
    case_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all evidence for a case"""
    
    # Verify case belongs to user
    from sqlalchemy import text
    case_query = text("SELECT id FROM cases WHERE id = :case_id AND user_id = :user_id")
    case = db.execute(case_query, {"case_id": case_id, "user_id": user_id}).fetchone()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    
    return [
        EvidenceResponse(
            id=e.id,
            case_id=e.case_id,
            file_name=e.file_name,
            file_type=e.file_type,
            file_size=e.file_size,
            description=e.description,
            uploaded_at=e.uploaded_at
        )
        for e in evidence_list
    ]

@app.post("/api/witnesses", response_model=WitnessResponse, status_code=201)
async def create_witness(
    witness_data: WitnessCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a witness"""
    
    # Verify case belongs to user
    from sqlalchemy import text
    case_query = text("SELECT id FROM cases WHERE id = :case_id AND user_id = :user_id")
    case = db.execute(case_query, {"case_id": witness_data.case_id, "user_id": user_id}).fetchone()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    witness = Witness(
        case_id=witness_data.case_id,
        name=witness_data.name,
        contact_info=witness_data.contact_info,
        statement=witness_data.statement,
        relationship=witness_data.relationship
    )
    db.add(witness)
    db.commit()
    db.refresh(witness)
    
    return WitnessResponse(
        id=witness.id,
        case_id=witness.case_id,
        name=witness.name,
        contact_info=witness.contact_info,
        statement=witness.statement,
        relationship=witness.relationship,
        created_at=witness.created_at
    )

@app.get("/api/witnesses/{case_id}", response_model=List[WitnessResponse])
async def get_witnesses(
    case_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all witnesses for a case"""
    
    # Verify case belongs to user
    from sqlalchemy import text
    case_query = text("SELECT id FROM cases WHERE id = :case_id AND user_id = :user_id")
    case = db.execute(case_query, {"case_id": case_id, "user_id": user_id}).fetchone()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    witnesses = db.query(Witness).filter(Witness.case_id == case_id).all()
    
    return [
        WitnessResponse(
            id=w.id,
            case_id=w.case_id,
            name=w.name,
            contact_info=w.contact_info,
            statement=w.statement,
            relationship=w.relationship,
            created_at=w.created_at
        )
        for w in witnesses
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

