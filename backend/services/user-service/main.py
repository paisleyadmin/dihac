"""
User Service - Handles authentication and user management
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DIHAC User Service", version="1.0.0")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://dihac_user:dihac_password@localhost:3306/dihac")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION = int(os.getenv("JWT_EXPIRATION", "86400"))

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
    to_encode.update({"exp": expire})
    # Convert sub to string if it's an integer (JWT standard requires string)
    if "sub" in to_encode and isinstance(to_encode["sub"], int):
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user_id = int(user_id_str)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user ID in token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}

@app.post("/api/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/api/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# OAuth Models
class GoogleAuthRequest(BaseModel):
    credential: str

class FacebookAuthRequest(BaseModel):
    access_token: str

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")

@app.post("/api/oauth/google", response_model=TokenResponse)
async def google_oauth_login(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    try:
        # Verify the Google credential
        idinfo = id_token.verify_oauth2_token(
            auth_request.credential, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Get user info from Google token
        email = idinfo.get('email')
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user from Google account
            # Generate a random password since OAuth users don't need it
            random_password = bcrypt.gensalt().decode('utf-8')
            hashed_password = get_password_hash(random_password)
            
            user = User(
                email=email,
                password_hash=hashed_password,
                first_name=given_name,
                last_name=family_name,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user from Google OAuth: {email}")
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": user.id})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        logger.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@app.post("/api/oauth/facebook", response_model=TokenResponse)
async def facebook_oauth_login(auth_request: FacebookAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Facebook OAuth"""
    try:
        import requests as http_requests
        
        # Verify Facebook access token
        verify_url = f"https://graph.facebook.com/debug_token"
        params = {
            'input_token': auth_request.access_token,
            'access_token': f"{FACEBOOK_APP_ID}|{FACEBOOK_APP_SECRET}"
        }
        
        verify_response = http_requests.get(verify_url, params=params)
        verify_data = verify_response.json()
        
        if not verify_data.get('data', {}).get('is_valid'):
            raise HTTPException(status_code=401, detail="Invalid Facebook token")
        
        # Get user info from Facebook
        user_info_url = "https://graph.facebook.com/me"
        params = {
            'fields': 'id,email,first_name,last_name',
            'access_token': auth_request.access_token
        }
        
        user_response = http_requests.get(user_info_url, params=params)
        user_data = user_response.json()
        
        email = user_data.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Facebook")
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user from Facebook account
            random_password = bcrypt.gensalt().decode('utf-8')
            hashed_password = get_password_hash(random_password)
            
            user = User(
                email=email,
                password_hash=hashed_password,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user from Facebook OAuth: {email}")
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": user.id})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facebook OAuth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

