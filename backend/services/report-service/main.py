"""
Report Service - Generates PDF case reports
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from datetime import datetime
from typing import Optional
import io

app = FastAPI(title="DIHAC Report Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Pydantic models
class ReportRequest(BaseModel):
    case_id: int

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_pdf_report(case_id: int, db: Session) -> bytes:
    """Generate PDF case report"""
    
    # Get case data
    case_query = text("""
        SELECT c.id, c.title, c.description, c.case_indicator, c.win_probability,
               u.first_name, u.last_name, u.email, u.phone,
               c.created_at, c.updated_at
        FROM cases c
        JOIN users u ON u.id = c.user_id
        WHERE c.id = :case_id
    """)
    case_data = db.execute(case_query, {"case_id": case_id}).fetchone()
    
    if not case_data:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get conversations
    conv_query = text("""
        SELECT user_message, system_response, created_at
        FROM conversations
        WHERE case_id = :case_id
        ORDER BY created_at
    """)
    conversations = db.execute(conv_query, {"case_id": case_id}).fetchall()
    
    # Get analysis
    analysis_query = text("""
        SELECT analysis_summary, strengths, weaknesses, recommendations
        FROM case_analysis
        WHERE case_id = :case_id
    """)
    analysis = db.execute(analysis_query, {"case_id": case_id}).fetchone()
    
    # Get laws
    laws_query = text("""
        SELECT law_title, law_url, law_code, description
        FROM relevant_laws
        WHERE case_id = :case_id
        ORDER BY relevance_score DESC
    """)
    laws = db.execute(laws_query, {"case_id": case_id}).fetchall()
    
    # Get precedents
    prec_query = text("""
        SELECT case_name, case_citation, case_url, relevance_description
        FROM precedent_cases
        WHERE case_id = :case_id
        ORDER BY relevance_score DESC
    """)
    precedents = db.execute(prec_query, {"case_id": case_id}).fetchall()
    
    # Get contacts
    contacts_query = text("""
        SELECT firm_name, contact_person, phone, email, website, specialization
        FROM legal_contacts
        WHERE case_id = :case_id
        ORDER BY rank_order
    """)
    contacts = db.execute(contacts_query, {"case_id": case_id}).fetchall()
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
    )
    story.append(Paragraph("DIHAC Case Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Case Information
    story.append(Paragraph("Case Information", styles['Heading2']))
    case_info = [
        ["Case ID:", str(case_data[0])],
        ["Title:", case_data[1] or "N/A"],
        ["Client:", f"{case_data[5] or ''} {case_data[6] or ''}".strip() or "N/A"],
        ["Email:", case_data[7] or "N/A"],
        ["Phone:", case_data[8] or "N/A"],
        ["Created:", case_data[9].strftime("%Y-%m-%d %H:%M:%S") if case_data[9] else "N/A"],
        ["Status:", case_data[3] or "pending"],
        ["Win Probability:", f"{case_data[4]}%" if case_data[4] else "N/A"]
    ]
    case_table = Table(case_info, colWidths=[2*inch, 4*inch])
    case_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(case_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Description
    if case_data[2]:
        story.append(Paragraph("Case Description", styles['Heading2']))
        story.append(Paragraph(case_data[2], styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
    
    # Conversation History
    if conversations:
        story.append(Paragraph("Conversation History", styles['Heading2']))
        for i, conv in enumerate(conversations, 1):
            story.append(Paragraph(f"<b>Exchange {i}</b>", styles['Normal']))
            story.append(Paragraph(f"<b>User:</b> {conv[0]}", styles['Normal']))
            story.append(Paragraph(f"<b>Assistant:</b> {conv[1] or 'N/A'}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        story.append(Spacer(1, 0.2*inch))
    
    # Analysis
    if analysis:
        story.append(Paragraph("Case Analysis", styles['Heading2']))
        story.append(Paragraph(f"<b>Summary:</b> {analysis[0] or 'N/A'}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(f"<b>Strengths:</b> {analysis[1] or 'N/A'}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(f"<b>Weaknesses:</b> {analysis[2] or 'N/A'}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(f"<b>Recommendations:</b> {analysis[3] or 'N/A'}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
    
    # Relevant Laws
    if laws:
        story.append(Paragraph("Relevant Laws", styles['Heading2']))
        for law in laws:
            story.append(Paragraph(f"<b>{law[0]}</b>", styles['Normal']))
            if law[2]:
                story.append(Paragraph(f"Code: {law[2]}", styles['Normal']))
            if law[3]:
                story.append(Paragraph(f"Description: {law[3]}", styles['Normal']))
            if law[1]:
                story.append(Paragraph(f"URL: {law[1]}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        story.append(Spacer(1, 0.3*inch))
    
    # Precedent Cases
    if precedents:
        story.append(Paragraph("Precedent Cases", styles['Heading2']))
        for prec in precedents:
            story.append(Paragraph(f"<b>{prec[0]}</b>", styles['Normal']))
            if prec[1]:
                story.append(Paragraph(f"Citation: {prec[1]}", styles['Normal']))
            if prec[3]:
                story.append(Paragraph(f"Relevance: {prec[3]}", styles['Normal']))
            if prec[2]:
                story.append(Paragraph(f"URL: {prec[2]}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        story.append(Spacer(1, 0.3*inch))
    
    # Legal Contacts
    if contacts:
        story.append(Paragraph("Recommended Legal Contacts", styles['Heading2']))
        for contact in contacts:
            story.append(Paragraph(f"<b>{contact[0]}</b>", styles['Normal']))
            if contact[1]:
                story.append(Paragraph(f"Contact: {contact[1]}", styles['Normal']))
            if contact[2]:
                story.append(Paragraph(f"Phone: {contact[2]}", styles['Normal']))
            if contact[3]:
                story.append(Paragraph(f"Email: {contact[3]}", styles['Normal']))
            if contact[5]:
                story.append(Paragraph(f"Specialization: {contact[5]}", styles['Normal']))
            if contact[4]:
                story.append(Paragraph(f"Website: {contact[4]}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles['Normal']
    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.read()

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "report-service"}

@app.post("/api/generate-report")
async def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db)
):
    """Generate and return PDF report"""
    try:
        pdf_bytes = generate_pdf_report(request.case_id, db)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=case_report_{request.case_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)

