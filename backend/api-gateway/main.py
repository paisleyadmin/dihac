"""
API Gateway - Entry point for all client requests
Routes requests to appropriate microservices
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DIHAC API Gateway", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
SERVICE_URLS = {
    "user": os.getenv("USER_SERVICE_URL", "http://localhost:8001"),
    "conversation": os.getenv("CONVERSATION_SERVICE_URL", "http://localhost:8002"),
    "analysis": os.getenv("ANALYSIS_SERVICE_URL", "http://localhost:8003"),
    "legal_research": os.getenv("LEGAL_RESEARCH_SERVICE_URL", "http://localhost:8004"),
    "legal-research": os.getenv("LEGAL_RESEARCH_SERVICE_URL", "http://localhost:8004"),  # Alternative format
    "report": os.getenv("REPORT_SERVICE_URL", "http://localhost:8005"),
    "evidence": os.getenv("EVIDENCE_SERVICE_URL", "http://localhost:8006"),
    "llm": os.getenv("LLM_SERVICE_URL", "http://localhost:8007"),
}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "api-gateway"}

@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_request(service: str, path: str, request: Request):
    """
    Proxy requests to appropriate microservices
    """
    if service not in SERVICE_URLS:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")
    
    service_url = SERVICE_URLS[service]
    target_url = f"{service_url}/api/{path}"
    
    # Get request body if present
    body = None
    content = None
    files = None
    form_data = None
    
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        
        # Handle multipart/form-data (file uploads)
        if "multipart/form-data" in content_type:
            # Just forward the raw body and headers for multipart
            content = await request.body()
        # Handle JSON
        elif "application/json" in content_type:
            try:
                body = await request.json()
            except:
                content = await request.body()
        # Handle other content types
        else:
            content = await request.body()
    
    # Forward headers (excluding host, content-length)
    # We exclude content-length because httpx will set it correctly
    # We preserve authorization and other important headers
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    # If we're sending JSON, let httpx set content-type automatically
    if isinstance(body, dict):
        headers.pop("content-type", None)
    
    try:
        # Extended timeout for LLM processing (CPU inference can take 2-3 minutes)
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                json=body if isinstance(body, dict) else None,
                content=content if content else None,
                params=dict(request.query_params),
            )
            
            # Get response content
            response_content = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"data": response.text}
            
            # Filter response headers - remove content-length and transfer-encoding
            # as they will be set automatically by FastAPI
            response_headers = {
                k: v for k, v in response.headers.items()
                if k.lower() not in ['content-length', 'transfer-encoding', 'content-encoding']
            }
            
            return JSONResponse(
                content=response_content,
                status_code=response.status_code,
                headers=response_headers
            )
    except httpx.RequestError as e:
        logger.error(f"Error forwarding request to {service}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Service {service} unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

