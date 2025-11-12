"""
Legal Research Service - Finds relevant laws and precedent cases
"""
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, DECIMAL, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os
import httpx
from typing import List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DIHAC Legal Research Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class RelevantLaw(Base):
    __tablename__ = "relevant_laws"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    law_title = Column(String(500), nullable=False)
    law_url = Column(String(1000))
    law_code = Column(String(100))
    description = Column(Text)
    relevance_score = Column(DECIMAL(5, 2))
    created_at = Column(DateTime, default=func.now())

class PrecedentCase(Base):
    __tablename__ = "precedent_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    case_name = Column(String(500), nullable=False)
    case_citation = Column(String(255))
    case_url = Column(String(1000))
    court = Column(String(255))
    year = Column(Integer)
    relevance_description = Column(Text)
    relevance_score = Column(DECIMAL(5, 2))
    created_at = Column(DateTime, default=func.now())

class LegalContact(Base):
    __tablename__ = "legal_contacts"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    firm_name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    website = Column(String(500))
    specialization = Column(String(255))
    rating = Column(DECIMAL(3, 2))
    rank_order = Column(Integer)
    created_at = Column(DateTime, default=func.now())

# Pydantic models
class LegalResearchRequest(BaseModel):
    case_id: int

class LegalResearchResponse(BaseModel):
    case_id: int
    laws: List[dict]
    precedents: List[dict]
    legal_contacts: List[dict]

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Legal Research Functions
async def find_relevant_laws(case_id: int, case_summary: str, db: Session) -> List[dict]:
    """Find relevant laws based on case summary"""
    # In production, this would use a legal database API or search service
    # For now, we'll use a simple keyword-based approach
    
    # Common legal areas and their laws (US-focused, can be expanded)
    legal_keywords = {
        "employment": [
            {
                "law_title": "Fair Labor Standards Act (FLSA)",
                "law_url": "https://www.dol.gov/agencies/whd/flsa",
                "law_code": "29 U.S.C. § 201 et seq.",
                "description": "Establishes minimum wage, overtime pay, recordkeeping, and youth employment standards"
            },
            {
                "law_title": "Title VII of the Civil Rights Act",
                "law_url": "https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964",
                "law_code": "42 U.S.C. § 2000e",
                "description": "Prohibits employment discrimination based on race, color, religion, sex, or national origin"
            }
        ],
        "contract": [
            {
                "law_title": "Uniform Commercial Code (UCC)",
                "law_url": "https://www.law.cornell.edu/ucc",
                "law_code": "UCC Article 2",
                "description": "Governs commercial transactions and contracts for the sale of goods"
            }
        ],
        "personal injury": [
            {
                "law_title": "Tort Law - Negligence",
                "law_url": "https://www.law.cornell.edu/wex/negligence",
                "law_code": "Common Law",
                "description": "Legal framework for personal injury claims based on negligence"
            }
        ],
        "discrimination": [
            {
                "law_title": "Civil Rights Act of 1964",
                "law_url": "https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964",
                "law_code": "42 U.S.C. § 2000a",
                "description": "Prohibits discrimination in public accommodations and employment"
            },
            {
                "law_title": "Americans with Disabilities Act (ADA)",
                "law_url": "https://www.ada.gov/",
                "law_code": "42 U.S.C. § 12101",
                "description": "Prohibits discrimination against individuals with disabilities"
            }
        ]
    }
    
    # Simple keyword matching (in production, use NLP/ML)
    found_laws = []
    case_lower = case_summary.lower()
    
    for category, laws in legal_keywords.items():
        if category in case_lower:
            for law in laws:
                found_laws.append({
                    **law,
                    "relevance_score": 0.8
                })
    
    # Save to database
    for law_data in found_laws[:5]:  # Top 5 most relevant
        law = RelevantLaw(
            case_id=case_id,
            law_title=law_data["law_title"],
            law_url=law_data["law_url"],
            law_code=law_data.get("law_code", ""),
            description=law_data["description"],
            relevance_score=law_data["relevance_score"]
        )
        db.add(law)
    
    db.commit()
    return found_laws[:5]

async def find_precedent_cases(case_id: int, case_summary: str, db: Session) -> List[dict]:
    """Find relevant precedent cases"""
    # In production, this would query a legal case database
    # For now, return sample precedents based on keywords
    
    precedents = []
    case_lower = case_summary.lower()
    
    # Sample precedent cases (in production, use a real legal database)
    if "employment" in case_lower or "discrimination" in case_lower:
        precedents.append({
            "case_name": "McDonnell Douglas Corp. v. Green",
            "case_citation": "411 U.S. 792 (1973)",
            "case_url": "https://supreme.justia.com/cases/federal/us/411/792/",
            "court": "Supreme Court of the United States",
            "year": 1973,
            "relevance_description": "Established framework for proving employment discrimination",
            "relevance_score": 0.85
        })
    
    if "contract" in case_lower:
        precedents.append({
            "case_name": "Hadley v. Baxendale",
            "case_citation": "9 Ex. 341 (1854)",
            "case_url": "https://en.wikipedia.org/wiki/Hadley_v_Baxendale",
            "court": "Court of Exchequer",
            "year": 1854,
            "relevance_description": "Established rule for contract damages",
            "relevance_score": 0.75
        })
    
    # Save to database
    for prec_data in precedents:
        precedent = PrecedentCase(
            case_id=case_id,
            case_name=prec_data["case_name"],
            case_citation=prec_data.get("case_citation", ""),
            case_url=prec_data.get("case_url", ""),
            court=prec_data.get("court", ""),
            year=prec_data.get("year"),
            relevance_description=prec_data["relevance_description"],
            relevance_score=prec_data["relevance_score"]
        )
        db.add(precedent)
    
    db.commit()
    return precedents

async def find_legal_contacts(case_id: int, case_summary: str, db: Session) -> List[dict]:
    """Find top 5 legal contacts/law firms"""
    # In production, this would query a directory of law firms
    # For now, return sample contacts
    
    # Sample law firms (in production, use a real directory API)
    contacts = [
        {
            "firm_name": "Legal Aid Society",
            "contact_person": "General Inquiry",
            "phone": "1-800-LEGAL-AID",
            "email": "info@legalaid.org",
            "website": "https://www.legalaid.org",
            "specialization": "General Legal Services",
            "rating": 4.5,
            "rank_order": 1
        },
        {
            "firm_name": "Pro Bono Legal Services",
            "contact_person": "Case Coordinator",
            "phone": "1-800-PRO-BONO",
            "email": "cases@probono.org",
            "website": "https://www.probono.org",
            "specialization": "Free Legal Assistance",
            "rating": 4.3,
            "rank_order": 2
        }
    ]
    
    # Save to database
    for contact_data in contacts:
        contact = LegalContact(
            case_id=case_id,
            firm_name=contact_data["firm_name"],
            contact_person=contact_data.get("contact_person", ""),
            phone=contact_data.get("phone", ""),
            email=contact_data.get("email", ""),
            website=contact_data.get("website", ""),
            specialization=contact_data.get("specialization", ""),
            rating=contact_data.get("rating", 0),
            rank_order=contact_data.get("rank_order", 0)
        )
        db.add(contact)
    
    db.commit()
    return contacts

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "legal-research-service"}

@app.post("/api/research", response_model=LegalResearchResponse)
async def research_legal_info(
    request: LegalResearchRequest,
    db: Session = Depends(get_db)
):
    """Perform legal research for a case"""
    
    # Get case summary from conversations
    from sqlalchemy import text
    case_query = text("""
        SELECT c.description, 
               GROUP_CONCAT(conv.user_message SEPARATOR ' ') as messages
        FROM cases c
        LEFT JOIN conversations conv ON conv.case_id = c.id
        WHERE c.id = :case_id
        GROUP BY c.id
    """)
    result = db.execute(case_query, {"case_id": request.case_id}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case_summary = f"{result[0] or ''} {result[1] or ''}"
    
    # Find relevant laws, precedents, and contacts
    laws = await find_relevant_laws(request.case_id, case_summary, db)
    precedents = await find_precedent_cases(request.case_id, case_summary, db)
    contacts = await find_legal_contacts(request.case_id, case_summary, db)
    
    return LegalResearchResponse(
        case_id=request.case_id,
        laws=laws,
        precedents=precedents,
        legal_contacts=contacts
    )

@app.get("/api/laws/{case_id}")
async def get_laws(case_id: int, db: Session = Depends(get_db)):
    """Get relevant laws for a case"""
    laws = db.query(RelevantLaw).filter(RelevantLaw.case_id == case_id).all()
    return [
        {
            "id": law.id,
            "law_title": law.law_title,
            "law_url": law.law_url,
            "law_code": law.law_code,
            "description": law.description,
            "relevance_score": float(law.relevance_score) if law.relevance_score else 0
        }
        for law in laws
    ]

@app.get("/api/precedents/{case_id}")
async def get_precedents(case_id: int, db: Session = Depends(get_db)):
    """Get precedent cases for a case"""
    precedents = db.query(PrecedentCase).filter(PrecedentCase.case_id == case_id).all()
    return [
        {
            "id": prec.id,
            "case_name": prec.case_name,
            "case_citation": prec.case_citation,
            "case_url": prec.case_url,
            "court": prec.court,
            "year": prec.year,
            "relevance_description": prec.relevance_description,
            "relevance_score": float(prec.relevance_score) if prec.relevance_score else 0
        }
        for prec in precedents
    ]

@app.get("/api/contacts/{case_id}")
async def get_contacts(case_id: int, db: Session = Depends(get_db)):
    """Get legal contacts for a case"""
    contacts = db.query(LegalContact).filter(
        LegalContact.case_id == case_id
    ).order_by(LegalContact.rank_order).all()
    
    return [
        {
            "id": contact.id,
            "firm_name": contact.firm_name,
            "contact_person": contact.contact_person,
            "phone": contact.phone,
            "email": contact.email,
            "address": contact.address,
            "website": contact.website,
            "specialization": contact.specialization,
            "rating": float(contact.rating) if contact.rating else 0,
            "rank_order": contact.rank_order
        }
        for contact in contacts
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)

