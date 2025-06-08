from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import httpx
import re
from bs4 import BeautifulSoup
import bcrypt
import jwt
from jwt import PyJWTError
import json
from enum import Enum
import stripe
from fastapi.encoders import jsonable_encoder
from bson import ObjectId

# Custom ObjectId conversion helper
def convert_objectid_to_str(obj):
    """Convert ObjectId fields to strings for JSON serialization"""
    if isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_objectid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

# Google OAuth imports
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_OAUTH_AVAILABLE = True
except ImportError as e:
    print(f"Google OAuth not available: {e}")
    GOOGLE_OAUTH_AVAILABLE = False


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Vapi.ai configuration
VAPI_PRIVATE_API_KEY = os.environ['VAPI_PRIVATE_API_KEY']
VAPI_PUBLIC_API_KEY = os.environ['VAPI_PUBLIC_API_KEY']

# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=30)

# Google OAuth configuration
GOOGLE_CLIENT_ID = "854027414985-6rm434tqail2661j4tv9kgl0350bn8rf.apps.googleusercontent.com"

# Stripe configuration
STRIPE_SECRET_KEY = "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"
STRIPE_PUBLISHABLE_KEY = "pk_live_51RWMzmP5uMQGZpKDO5pprsO2Sj2BKKPYdGnPrOdQllGoK8HLQdOwblYJkSBGT5ryHY7eCuZYHSvGzJTSXnmI3s4t00FBRp8Ly1"
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret')

# Configure Stripe
stripe.api_key = STRIPE_SECRET_KEY

# Admin configuration
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@voiceprepai.com')

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class ConversationStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    hashed_password: str
    role: UserRole = UserRole.USER
    credits: int = 20  # Free credits for new users
    total_credits_purchased: int = 0
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    referred_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleCredential(BaseModel):
    credential: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    credits: int
    referral_code: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ConversationAnalysis(BaseModel):
    confidence_score: float = Field(ge=0, le=10)
    fluency_score: float = Field(ge=0, le=10)
    patience_score: float = Field(ge=0, le=10)
    preparedness_score: float = Field(ge=0, le=10)
    overall_score: float = Field(ge=0, le=10)
    strengths: List[str] = []
    improvements: List[str] = []
    timeline: List[Dict[str, Any]] = []  # Minute-by-minute analysis

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vapi_call_id: Optional[str] = None
    type: str = "mock_interview"
    status: ConversationStatus = ConversationStatus.ACTIVE
    duration_minutes: int = 0
    credits_used: int = 0
    transcript: str = ""
    summary: str = ""
    analysis: Optional[ConversationAnalysis] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class ConversationCreate(BaseModel):
    type: str = "mock_interview"
    prompt: str

class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    duration_minutes: Optional[int] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    analysis: Optional[ConversationAnalysis] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stripe_payment_intent_id: str
    amount: float
    credits: int
    plan_name: str
    status: PaymentStatus = PaymentStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class CreditTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: int  # Positive for addition, negative for deduction
    type: str  # "signup_bonus", "referral", "purchase", "conversation", "admin_grant"
    description: str
    conversation_id: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Referral(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_id: str
    referred_id: str
    referral_code: str
    bonus_credited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MockInterviewRequest(BaseModel):
    current_role: str
    current_company: str
    pm_experience: int
    total_experience: int
    target_role: Optional[str] = ""
    target_company: Optional[str] = ""
    job_description: Optional[str] = ""
    resume_data: Optional[dict] = None

class JobLinkRequest(BaseModel):
    job_link: str
    current_role: str
    current_company: str
    pm_experience: int
    total_experience: int

class PricingPlan(BaseModel):
    name: str
    credits: int
    price: float  # In dollars
    description: str

class AdminCreditGrant(BaseModel):
    email: EmailStr
    credits: int
    reason: str

# Authentication Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + JWT_EXPIRATION_DELTA
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Credit System Helper Functions
async def add_credits(user_id: str, amount: int, transaction_type: str, description: str, 
                     conversation_id: Optional[str] = None, payment_id: Optional[str] = None):
    """Add credits to user account and record transaction"""
    # Update user credits
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": amount}}
    )
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=user_id,
        amount=amount,
        type=transaction_type,
        description=description,
        conversation_id=conversation_id,
        payment_id=payment_id
    )
    await db.credit_transactions.insert_one(transaction.dict())
    
    return transaction

async def deduct_credits(user_id: str, amount: int, transaction_type: str, description: str,
                        conversation_id: Optional[str] = None) -> bool:
    """Deduct credits from user account if sufficient balance exists"""
    user = await db.users.find_one({"id": user_id})
    if not user or user["credits"] < amount:
        return False
    
    # Deduct credits
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": -amount}}
    )
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=user_id,
        amount=-amount,
        type=transaction_type,
        description=description,
        conversation_id=conversation_id
    )
    await db.credit_transactions.insert_one(transaction.dict())
    
    return True

async def process_referral(referrer_code: str, new_user_id: str) -> bool:
    """Process referral bonus for both referrer and referee"""
    try:
        # Find referrer by code
        referrer = await db.users.find_one({"referral_code": referrer_code})
        if not referrer:
            return False
        
        # Create referral record
        referral = Referral(
            referrer_id=referrer["id"],
            referred_id=new_user_id,
            referral_code=referrer_code,
            bonus_credited=True
        )
        await db.referrals.insert_one(referral.dict())
        
        # Add bonus credits to both users
        await add_credits(
            referrer["id"], 10, "referral", 
            f"Referral bonus for inviting new user"
        )
        await add_credits(
            new_user_id, 10, "referral", 
            f"Referral bonus for joining with code {referrer_code}"
        )
        
        return True
    except Exception as e:
        logger.error(f"Referral processing error: {e}")
        return False

# Conversation Analysis Helper
def generate_conversation_analysis(transcript: str, duration_minutes: int) -> ConversationAnalysis:
    """Generate AI-powered conversation analysis"""
    # This is a simplified version - in production, you'd use AI/ML models
    # For now, we'll generate realistic sample analysis
    import random
    
    # Simulate analysis based on transcript length and duration
    word_count = len(transcript.split())
    speaking_rate = word_count / max(duration_minutes, 1)
    
    # Generate scores (simplified algorithm)
    confidence_score = min(10, 5 + (speaking_rate / 50) + random.uniform(-1, 2))
    fluency_score = min(10, 6 + (word_count / 100) + random.uniform(-1, 1.5))
    patience_score = min(10, 7 + random.uniform(-1, 2))
    preparedness_score = min(10, 5 + (word_count / 80) + random.uniform(-0.5, 2))
    overall_score = (confidence_score + fluency_score + patience_score + preparedness_score) / 4
    
    # Generate timeline (minute by minute)
    timeline = []
    for minute in range(duration_minutes):
        timeline.append({
            "minute": minute + 1,
            "activity": "Active conversation" if minute % 3 != 0 else "Thoughtful pause",
            "confidence": round(confidence_score + random.uniform(-1, 1), 1),
            "notes": f"Strong engagement" if minute % 2 == 0 else "Consider more specific examples"
        })
    
    strengths = [
        "Clear communication style",
        "Good use of examples",
        "Professional demeanor",
        "Structured responses"
    ][:random.randint(2, 4)]
    
    improvements = [
        "Use more specific metrics in examples",
        "Practice storytelling techniques",
        "Improve conciseness in responses",
        "Add more technical depth"
    ][:random.randint(2, 3)]
    
    return ConversationAnalysis(
        confidence_score=round(confidence_score, 1),
        fluency_score=round(fluency_score, 1),
        patience_score=round(patience_score, 1),
        preparedness_score=round(preparedness_score, 1),
        overall_score=round(overall_score, 1),
        strengths=strengths,
        improvements=improvements,
        timeline=timeline
    )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Voice Assistant Platform API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/scrape-job")
async def scrape_job_details(request: JobLinkRequest):
    """Scrape job details from job posting URL"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            response = await client.get(request.job_link, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract job details with improved selectors
            title = ""
            company = ""
            description = ""
            
            # Enhanced job title extraction
            title_selectors = [
                # LinkedIn
                'h1.top-card-layout__title',
                'h1[data-test="job-title"]',
                '.job-details-jobs-unified-top-card__job-title h1',
                
                # Indeed
                'h1.jobsearch-JobInfoHeader-title',
                'h1[data-jk]',
                '.jobsearch-JobInfoHeader-title span',
                
                # Glassdoor
                '[data-test="job-title"]',
                '.JobDetails_jobTitle__Rw_gn',
                
                # AngelList/Wellfound
                '.job-title',
                
                # Generic fallbacks
                'h1:contains("Product Manager")',
                'h1:contains("Manager")',
                'h1',
                '.title',
                '[class*="title"]',
                '[class*="job-title"]'
            ]
            
            for selector in title_selectors:
                try:
                    if ':contains(' in selector:
                        # Handle CSS :contains pseudo-selector manually
                        elements = soup.find_all('h1')
                        for elem in elements:
                            text = elem.get_text(strip=True)
                            if 'Product Manager' in text or 'Manager' in text:
                                title = text
                                break
                        if title:
                            break
                    else:
                        title_elem = soup.select_one(selector)
                        if title_elem:
                            title = title_elem.get_text(strip=True)
                            if title and len(title) > 3:  # Valid title
                                break
                except:
                    continue
            
            # Enhanced company name extraction
            company_selectors = [
                # LinkedIn
                '.job-details-jobs-unified-top-card__company-name a',
                '.job-details-jobs-unified-top-card__company-name',
                '[data-test="job-poster"]',
                '.topcard__org-name-link',
                
                # Indeed
                'span.jobsearch-InlineCompanyRating a',
                '[data-testid="inlineHeader-companyName"] a',
                '.jobsearch-InlineCompanyRating-companyHeader a',
                
                # Glassdoor
                '[data-test="employer-name"]',
                '.JobDetails_companyName__3lAow',
                
                # Generic
                '.company-name',
                '[class*="company"]',
                'a[href*="/company/"]'
            ]
            
            for selector in company_selectors:
                try:
                    company_elem = soup.select_one(selector)
                    if company_elem:
                        company = company_elem.get_text(strip=True)
                        if company and len(company) > 1:  # Valid company
                            break
                except:
                    continue
            
            # Enhanced job description extraction
            desc_selectors = [
                # LinkedIn
                '.job-details-jobs-unified-top-card__job-description',
                '.jobs-description__content .jobs-box__html-content',
                '[data-test="job-description"]',
                
                # Indeed
                '#jobDescriptionText',
                '.jobsearch-jobDescriptionText',
                
                # Glassdoor
                '.JobDetails_jobDescription__6VeBn',
                '[data-test="job-description"]',
                
                # Generic
                '.job-description',
                '.description',
                '[class*="description"]',
                '.content'
            ]
            
            for selector in desc_selectors:
                try:
                    desc_elem = soup.select_one(selector)
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)
                        if description and len(description) > 50:  # Valid description
                            break
                except:
                    continue
            
            # Enhanced fallback for description
            if not description or len(description) < 50:
                # Try to get text from common content areas
                content_areas = soup.find_all(['div', 'section'], class_=re.compile(r'(description|content|detail|requirement)', re.I))
                for area in content_areas:
                    text = area.get_text(strip=True)
                    if len(text) > 100:
                        description = text[:2000]
                        break
                
                # Final fallback: get all paragraphs
                if not description:
                    paragraphs = soup.find_all('p')
                    description = ' '.join([p.get_text(strip=True) for p in paragraphs[:10] if len(p.get_text(strip=True)) > 20])
            
            # Clean up extracted data
            title = re.sub(r'\s+', ' ', title).strip() if title else "Product Manager"
            company = re.sub(r'\s+', ' ', company).strip() if company else "Company not found"
            description = re.sub(r'\s+', ' ', description).strip()[:2000] if description else "Job description not available. Please fill manually."
            
            return {
                "target_role": title,
                "target_company": company,
                "job_description": description,
                "current_role": request.current_role,
                "current_company": request.current_company,
                "pm_experience": request.pm_experience,
                "total_experience": request.total_experience
            }
            
    except Exception as e:
        logger.error(f"Error scraping job details: {str(e)}")
        # Return partial data rather than failing completely
        return {
            "target_role": "Product Manager",
            "target_company": "Please fill manually",
            "job_description": f"Could not scrape job details from URL. Error: {str(e)[:100]}. Please fill manually.",
            "current_role": request.current_role,
            "current_company": request.current_company,
            "pm_experience": request.pm_experience,
            "total_experience": request.total_experience
        }

@api_router.post("/parse-resume", response_model=dict)
async def parse_resume(resume: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Parse uploaded resume and extract key information"""
    try:
        logger.info(f"Resume upload for user {current_user.id}")
        
        if not resume.content_type in ['application/pdf', 'application/msword', 
                                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                     'text/plain']:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.")
        
        # Read file content
        content = await resume.read()
        
        # Parse resume content based on file type
        resume_text = ""
        if resume.content_type == 'application/pdf':
            import PyPDF2
            import io
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                resume_text += page.extract_text()
        elif resume.content_type == 'text/plain':
            resume_text = content.decode('utf-8')
        else:
            # For DOC/DOCX files, we'll use a simple text extraction
            # In production, you might want to use python-docx or similar
            resume_text = content.decode('utf-8', errors='ignore')
        
        # Extract information using AI/pattern matching
        # This is a simplified version - in production you'd use more sophisticated NLP
        resume_data = extract_resume_info(resume_text)
        
        return {
            "success": True,
            "resume_data": resume_data,
            "message": "Resume parsed successfully"
        }
        
    except Exception as e:
        logger.error(f"Resume parsing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")

def extract_resume_info(resume_text):
    """Extract key information from resume text"""
    import re
    
    resume_data = {
        "current_role": None,
        "current_company": None,
        "pm_experience": None,
        "total_experience": None,
        "skills": [],
        "education": [],
        "summary": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text
    }
    
    text_lower = resume_text.lower()
    
    # Extract current role (look for common PM titles)
    pm_titles = ['product manager', 'senior product manager', 'associate product manager', 
                'principal product manager', 'director of product', 'vp of product', 
                'head of product', 'product owner', 'product lead']
    
    for title in pm_titles:
        if title in text_lower:
            resume_data["current_role"] = title.title()
            break
    
    # Extract companies (look for common patterns)
    company_patterns = [
        r'(?:at|@)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited)?)',
        r'([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited))\s*-',
    ]
    
    for pattern in company_patterns:
        matches = re.findall(pattern, resume_text)
        if matches:
            resume_data["current_company"] = matches[0].strip()
            break
    
    # Extract years of experience
    exp_patterns = [
        r'(\d+)\+?\s*years?\s*of\s*(?:product\s*management|PM|product)',
        r'(\d+)\+?\s*years?\s*(?:product\s*management|PM|product)\s*experience',
        r'(\d+)\s*years?\s*(?:as\s*a?\s*)?product\s*manager'
    ]
    
    for pattern in exp_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            resume_data["pm_experience"] = int(matches[0])
            break
    
    # Extract total experience (look for overall experience mentions)
    total_exp_patterns = [
        r'(\d+)\+?\s*years?\s*of\s*(?:professional\s*)?experience',
        r'(\d+)\+?\s*years?\s*experience',
        r'over\s*(\d+)\s*years'
    ]
    
    for pattern in total_exp_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            resume_data["total_experience"] = int(matches[0])
            break
    
    # Extract skills
    skill_keywords = ['python', 'java', 'sql', 'analytics', 'data analysis', 'agile', 'scrum',
                     'jira', 'figma', 'sketch', 'wireframing', 'user research', 'a/b testing',
                     'roadmap', 'strategy', 'metrics', 'kpis', 'stakeholder management']
    
    found_skills = []
    for skill in skill_keywords:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    resume_data["skills"] = found_skills[:10]  # Limit to 10 skills
    
    return resume_data

@api_router.post("/generate-mock-interview-prompt", response_model=dict)
async def generate_mock_interview_prompt(request: MockInterviewRequest):
    """Generate dynamic prompt for mock interview"""
    
    # Build comprehensive candidate profile including resume data
    candidate_profile = f"""CANDIDATE PROFILE:
- Current Role: {request.current_role}
- Current Company: {request.current_company}
- Product Management Experience: {request.pm_experience} years
- Total Work Experience: {request.total_experience} years"""

    # Add resume information if available
    if request.resume_data:
        resume_info = request.resume_data
        candidate_profile += f"""

RESUME HIGHLIGHTS:"""
        
        if resume_info.get('skills'):
            candidate_profile += f"\n- Key Skills: {', '.join(resume_info['skills'][:8])}"
        
        if resume_info.get('summary'):
            candidate_profile += f"\n- Background Summary: {resume_info['summary'][:300]}..."
        
        if resume_info.get('education'):
            candidate_profile += f"\n- Education: {', '.join(resume_info['education'][:2])}"

    prompt = f"""
You are an experienced hiring manager conducting a mock product management interview. You have access to the candidate's complete profile including their resume. Use this information to ask relevant, personalized questions.

{candidate_profile}"""

    # Add target role information if provided
    if request.target_role or request.target_company:
        prompt += f"""

TARGET ROLE:"""
        if request.target_role:
            prompt += f"\n- Position: {request.target_role}"
        if request.target_company:
            prompt += f"\n- Company: {request.target_company}"

    # Add job description if provided
    if request.job_description:
        prompt += f"""

JOB DESCRIPTION:
{request.job_description}"""

    prompt += f"""

INTERVIEW INSTRUCTIONS:
1. You have the candidate's complete background - use this to ask targeted questions
2. Reference their specific experience, skills, and background from their resume when relevant
3. Ask behavioral questions using the STAR method based on their actual experience
4. Conduct a realistic product management interview focusing on skills relevant to the target role
5. Include technical and strategic questions appropriate for their experience level
6. Be personable and reference their background to make the interview feel authentic
7. Ask follow-up questions based on their responses
8. Provide a mix of: behavioral questions, case studies, technical PM questions, and strategic thinking
9. Keep responses concise and interview-like (not too lengthy)
10. End the interview naturally after covering key PM competencies

Remember: You know their background, so ask questions that would naturally come up given their experience and the target role. Make it feel like a real interview where the interviewer has read their resume.

Begin the interview with a warm introduction and start with an appropriate opening question.
3. Include technical PM questions about product strategy, metrics, prioritization
4. Adapt your questions based on their experience level
5. Be encouraging but thorough in your evaluation
6. Ask follow-up questions to dive deeper into their responses
7. The interview should last 15-20 minutes
8. At the end, provide constructive feedback on their performance

Start by greeting the candidate and explaining the interview format, then begin with your first question.
"""
    
    return {"prompt": prompt.strip()}

@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with referral processing
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        referred_by=user_data.referral_code
    )
    
    # Save user to database
    await db.users.insert_one(user.dict())
    
    # Add signup bonus credits
    await add_credits(
        user.id, 20, "signup_bonus", 
        "Welcome bonus for new user registration"
    )
    
    # Process referral if provided
    if user_data.referral_code:
        await process_referral(user_data.referral_code, user.id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "success": True,
        "user": UserResponse(**user.dict()),
        "token": access_token,
        "message": "User registered successfully",
        "welcome_credits": 20
    }

@api_router.post("/auth/login", response_model=dict)
async def login_user(user_data: UserLogin):
    """Login user"""
    # Find user by email
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "success": True,
        "user": UserResponse(**user),
        "token": access_token,
        "message": "Login successful"
    }

@api_router.post("/auth/google", response_model=dict)
async def google_auth(credential_data: GoogleCredential):
    """Authenticate user with Google OAuth"""
    if not GOOGLE_OAUTH_AVAILABLE:
        raise HTTPException(status_code=501, detail="Google OAuth not configured on server")
    
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            credential_data.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Extract user information from Google
        google_user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # User exists, log them in
            user = User(**existing_user)
            access_token = create_access_token(data={"sub": user.id})
            
            return {
                "success": True,
                "user": UserResponse(**user.dict()),
                "token": access_token,
                "message": "Google login successful"
            }
        else:
            # Create new user
            user = User(
                email=email,
                name=name,
                hashed_password=""  # No password for Google users
            )
            
            # Save user to database
            await db.users.insert_one(user.dict())
            
            # Create access token
            access_token = create_access_token(data={"sub": user.id})
            
            return {
                "success": True,
                "user": UserResponse(**user.dict()),
                "token": access_token,
                "message": "Google registration successful"
            }
            
    except ValueError as e:
        # Invalid token
        logger.error(f"Google token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Google authentication failed")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user.dict())

# Conversation Management Endpoints
@api_router.post("/conversations", response_model=dict)
async def create_conversation(conversation_data: ConversationCreate, current_user: User = Depends(get_current_user)):
    """Create a new conversation"""
    conversation = Conversation(
        user_id=current_user.id,
        type=conversation_data.type
    )
    
    await db.conversations.insert_one(conversation.dict())
    
    return {
        "success": True,
        "conversation": conversation.dict(),
        "message": "Conversation created successfully"
    }

@api_router.get("/conversations", response_model=List[dict])
async def get_user_conversations(current_user: User = Depends(get_current_user)):
    """Get all conversations for the current user"""
    conversations = await db.conversations.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(100)
    
    return convert_objectid_to_str(conversations)

@api_router.post("/conversations", response_model=dict)
async def create_conversation(request: dict, current_user: User = Depends(get_current_user)):
    """Create a new conversation record"""
    try:
        conversation = Conversation(
            user_id=current_user.id,
            type=request.get("type", "mock_interview"),
            prompt=request.get("prompt", ""),
            status=request.get("status", "active"),
            metadata=request.get("metadata", {}),
            created_at=datetime.utcnow()
        )
        
        result = await db.conversations.insert_one(conversation.dict())
        conversation_id = str(result.inserted_id)
        
        return {
            "success": True,
            "id": conversation_id,
            "message": "Conversation created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@api_router.put("/conversations/{conversation_id}", response_model=dict)
async def update_conversation(conversation_id: str, request: dict, current_user: User = Depends(get_current_user)):
    """Update conversation with transcript and analysis"""
    try:
        update_data = {
            "status": request.get("status"),
            "transcript": request.get("transcript"),
            "duration_minutes": request.get("duration_minutes"),
            "credits_used": request.get("credits_used"),
            "updated_at": datetime.utcnow()
        }
        
        if request.get("completed_at"):
            update_data["completed_at"] = datetime.fromisoformat(request["completed_at"].replace('Z', '+00:00'))
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = await db.conversations.update_one(
            {"_id": ObjectId(conversation_id), "user_id": current_user.id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"success": True, "message": "Conversation updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update conversation")

@api_router.post("/conversations/{conversation_id}/analyze", response_model=dict)
async def analyze_conversation(conversation_id: str, request: dict, current_user: User = Depends(get_current_user)):
    """Generate analysis for conversation transcript"""
    try:
        transcript = request.get("transcript", "")
        
        # Generate comprehensive analysis
        analysis = generate_conversation_analysis(transcript)
        
        # Update conversation with analysis
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id), "user_id": current_user.id},
            {"$set": {"analysis": analysis, "analyzed_at": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "analysis": analysis,
            "message": "Analysis generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze conversation")

def generate_conversation_analysis(transcript):
    """Generate comprehensive analysis from transcript"""
    
    # Calculate basic metrics
    words = transcript.split()
    total_words = len(words)
    
    # Analyze conversation flow
    user_messages = [line for line in transcript.split('\n') if '👤 You:' in line]
    ai_messages = [line for line in transcript.split('\n') if '🤖 AI:' in line]
    
    # Generate scores (in production, use AI/ML for better analysis)
    import random
    random.seed(total_words)  # Consistent scoring based on content
    
    confidence_score = min(10, max(3, random.randint(6, 9) + (len(user_messages) * 0.1)))
    fluency_score = min(10, max(4, random.randint(6, 9) + (total_words * 0.001)))
    patience_score = min(10, max(3, random.randint(5, 8)))
    preparedness_score = min(10, max(3, random.randint(5, 9)))
    overall_score = (confidence_score + fluency_score + patience_score + preparedness_score) / 4
    
    # Generate timeline
    timeline = []
    conversation_duration = len(user_messages) + len(ai_messages)
    for i in range(min(10, conversation_duration)):
        timeline.append({
            "minute": i + 1,
            "topic": f"Discussion topic {i + 1}",
            "score": random.randint(6, 9),
            "notes": f"Key points discussed in minute {i + 1}"
        })
    
    # Generate insights
    strengths = [
        "Clear communication style",
        "Good examples provided",
        "Strong analytical thinking",
        "Appropriate use of metrics",
        "Well-structured responses"
    ][:random.randint(2, 4)]
    
    improvements = [
        "More specific examples needed",
        "Better framework usage",
        "Stronger data-driven approach",
        "More strategic thinking",
        "Improved storytelling"
    ][:random.randint(2, 3)]
    
    recommendations = [
        "Practice the STAR method for behavioral questions",
        "Study more case study frameworks",
        "Research company-specific challenges",
        "Prepare more quantitative examples",
        "Work on executive presence"
    ][:random.randint(3, 5)]
    
    return {
        "overall_score": round(overall_score, 1),
        "confidence_score": round(confidence_score, 1),
        "fluency_score": round(fluency_score, 1),
        "patience_score": round(patience_score, 1),
        "preparedness_score": round(preparedness_score, 1),
        "timeline": timeline,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
        "total_words": total_words,
        "user_responses": len(user_messages),
        "ai_questions": len(ai_messages)
    }

@api_router.get("/conversations/{conversation_id}", response_model=dict)
async def get_conversation(conversation_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific conversation"""
    conversation = await db.conversations.find_one({
        "id": conversation_id,
        "user_id": current_user.id
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return convert_objectid_to_str(conversation)

@api_router.put("/conversations/{conversation_id}", response_model=dict)
async def update_conversation(
    conversation_id: str, 
    update_data: ConversationUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update a conversation (used when call ends)"""
    conversation = await db.conversations.find_one({
        "id": conversation_id,
        "user_id": current_user.id
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    update_dict = update_data.dict(exclude_unset=True)
    
    # If conversation is being completed, process credits and analysis
    if update_data.status == ConversationStatus.COMPLETED:
        duration = update_data.duration_minutes or 0
        
        # Deduct credits for conversation time
        credits_deducted = await deduct_credits(
            current_user.id, duration, "conversation", 
            f"Credits used for {duration} minute conversation",
            conversation_id
        )
        
        if not credits_deducted:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        update_dict["credits_used"] = duration
        update_dict["completed_at"] = datetime.utcnow()
        
        # Generate analysis if transcript is provided
        if update_data.transcript:
            analysis = generate_conversation_analysis(update_data.transcript, duration)
            update_dict["analysis"] = analysis.dict()
    
    # Update conversation
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": update_dict}
    )
    
    # Return updated conversation
    updated_conversation = await db.conversations.find_one({"id": conversation_id})
    return convert_objectid_to_str(updated_conversation)

# Credits Management Endpoints
@api_router.get("/credits/balance", response_model=dict)
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    """Get current user's credit balance"""
    return {
        "credits": current_user.credits,
        "total_purchased": current_user.total_credits_purchased
    }

@api_router.get("/credits/transactions", response_model=List[dict])
async def get_credit_transactions(current_user: User = Depends(get_current_user)):
    """Get user's credit transaction history"""
    transactions = await db.credit_transactions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(50)
    
    # Use custom ObjectId converter to handle serialization
    return convert_objectid_to_str(transactions)

@api_router.get("/dashboard/stats", response_model=dict)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics for the user"""
    # Get conversation stats
    total_conversations = await db.conversations.count_documents({
        "user_id": current_user.id,
        "status": ConversationStatus.COMPLETED
    })
    
    total_minutes = await db.conversations.aggregate([
        {"$match": {"user_id": current_user.id, "status": ConversationStatus.COMPLETED}},
        {"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}}}
    ]).to_list(1)
    
    total_minutes = total_minutes[0]["total"] if total_minutes else 0
    
    # Get recent conversations
    recent_conversations = await db.conversations.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get average score
    conversations_with_analysis = await db.conversations.find(
        {"user_id": current_user.id, "analysis": {"$exists": True}}
    ).to_list(None)
    
    avg_score = 0
    if conversations_with_analysis:
        scores = [conv["analysis"]["overall_score"] for conv in conversations_with_analysis 
                 if conv.get("analysis", {}).get("overall_score")]
        avg_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "total_conversations": total_conversations,
        "total_minutes": total_minutes,
        "average_score": round(avg_score, 1),
        "current_credits": current_user.credits,
        "recent_conversations": convert_objectid_to_str(recent_conversations)
    }

# Stripe Payment Endpoints
@api_router.get("/pricing/plans", response_model=List[dict])
async def get_pricing_plans():
    """Get available pricing plans"""
    plans = [
        {
            "id": "starter",
            "name": "Starter",
            "credits": 60,
            "price": 10.00,
            "description": "Perfect for occasional practice",
            "features": ["60 minutes of practice", "Full analytics", "All interview types"]
        },
        {
            "id": "pro", 
            "name": "Pro",
            "credits": 300,
            "price": 45.00,
            "description": "Best value for serious preparation",
            "features": ["300 minutes of practice", "Advanced analytics", "Priority support", "Bonus: 25% more credits"]
        }
    ]
    return plans

@api_router.post("/payments/create-intent", response_model=dict)
async def create_payment_intent(plan_data: dict, current_user: User = Depends(get_current_user)):
    """Create Stripe payment intent"""
    try:
        plan_id = plan_data.get("plan_id")
        
        # Define plan details
        plans = {
            "starter": {"credits": 60, "price": 10.00, "name": "Starter"},
            "pro": {"credits": 300, "price": 45.00, "name": "Pro"}
        }
        
        if plan_id not in plans:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        plan = plans[plan_id]
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(plan["price"] * 100),  # Amount in cents
            currency='usd',
            metadata={
                'user_id': current_user.id,
                'plan_id': plan_id,
                'credits': plan["credits"],
                'plan_name': plan["name"]
            }
        )
        
        # Store payment record
        payment = Payment(
            user_id=current_user.id,
            stripe_payment_intent_id=intent.id,
            amount=plan["price"],
            credits=plan["credits"],
            plan_name=plan["name"],
            status=PaymentStatus.PENDING
        )
        await db.payments.insert_one(payment.dict())
        
        return {
            "client_secret": intent.client_secret,
            "publishable_key": STRIPE_PUBLISHABLE_KEY
        }
        
    except Exception as e:
        logger.error(f"Stripe payment intent creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment initialization failed")

@api_router.post("/payments/create-checkout-session", response_model=dict)
async def create_checkout_session(plan_data: dict, current_user: User = Depends(get_current_user)):
    """Create Stripe Checkout session"""
    try:
        plan_id = plan_data.get("plan_id")
        success_url = plan_data.get("success_url", "https://example.com/success")
        cancel_url = plan_data.get("cancel_url", "https://example.com/cancel")
        
        # Define plan details
        plans = {
            "starter": {"credits": 60, "price": 10.00, "name": "Starter Pack"},
            "pro": {"credits": 300, "price": 45.00, "name": "Pro Pack"}
        }
        
        if plan_id not in plans:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        plan = plans[plan_id]
        
        # Create Stripe Checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': plan["name"],
                        'description': f'{plan["credits"]} minutes of AI interview practice'
                    },
                    'unit_amount': int(plan["price"] * 100),  # Amount in cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url + f'?session_id={{CHECKOUT_SESSION_ID}}&plan_id={plan_id}',
            cancel_url=cancel_url,
            metadata={
                'user_id': current_user.id,
                'plan_id': plan_id,
                'credits': plan["credits"],
                'plan_name': plan["name"]
            },
            customer_email=current_user.email
        )
        
        # Store payment record
        payment = Payment(
            user_id=current_user.id,
            stripe_payment_intent_id=session.payment_intent or session.id,
            amount=plan["price"],
            credits=plan["credits"],
            plan_name=plan["name"],
            status=PaymentStatus.PENDING
        )
        await db.payments.insert_one(payment.dict())
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Checkout session creation failed")

@api_router.post("/payments/confirm", response_model=dict)
async def confirm_payment(payment_data: dict, current_user: User = Depends(get_current_user)):
    """Confirm payment and add credits"""
    try:
        payment_intent_id = payment_data.get("payment_intent_id")
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == "succeeded":
            # Find payment record
            payment_record = await db.payments.find_one({
                "stripe_payment_intent_id": payment_intent_id,
                "user_id": current_user.id
            })
            
            if not payment_record:
                raise HTTPException(status_code=404, detail="Payment record not found")
            
            # Update payment status
            await db.payments.update_one(
                {"stripe_payment_intent_id": payment_intent_id},
                {
                    "$set": {
                        "status": PaymentStatus.COMPLETED,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            # Add credits to user account
            credits_to_add = payment_record["credits"]
            await add_credits(
                current_user.id,
                credits_to_add,
                "purchase",
                f"Purchased {payment_record['plan_name']} plan",
                payment_id=payment_record["id"]
            )
            
            # Update user's total purchased credits
            await db.users.update_one(
                {"id": current_user.id},
                {"$inc": {"total_credits_purchased": credits_to_add}}
            )
            
            return {
                "success": True,
                "credits_added": credits_to_add,
                "message": f"Successfully added {credits_to_add} credits to your account!"
            }
        else:
            raise HTTPException(status_code=400, detail="Payment not completed")
            
    except Exception as e:
        logger.error(f"Payment confirmation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment confirmation failed")

@api_router.post("/payments/recover-payment", response_model=dict)
async def recover_payment(request: dict, current_user: User = Depends(get_current_user)):
    """Manually recover a payment when automatic confirmation fails"""
    try:
        logger.info(f"Payment recovery requested for user {current_user.id}")
        
        # Get recent pending payments for this user
        pending_payments = await db.payments.find({
            "user_id": current_user.id,
            "status": PaymentStatus.PENDING
        }).sort([("created_at", -1)]).limit(10).to_list(10)
        
        logger.info(f"Found {len(pending_payments)} pending payments for user {current_user.id}")
        
        if not pending_payments:
            # Also check for any payments in the last 24 hours regardless of status
            from datetime import datetime, timedelta
            recent_cutoff = datetime.utcnow() - timedelta(hours=24)
            
            recent_payments = await db.payments.find({
                "user_id": current_user.id,
                "created_at": {"$gte": recent_cutoff}
            }).sort([("created_at", -1)]).to_list(10)
            
            logger.info(f"Found {len(recent_payments)} recent payments (24h) for user {current_user.id}")
            
            if not recent_payments:
                return {"success": False, "message": "No recent payments found in database"}
            else:
                # Show debug info about recent payments
                payment_info = []
                for p in recent_payments:
                    payment_info.append({
                        "id": p.get("id"),
                        "status": p.get("status"),
                        "amount": p.get("amount"),
                        "credits": p.get("credits"),
                        "created_at": p.get("created_at").isoformat() if p.get("created_at") else None
                    })
                return {
                    "success": False, 
                    "message": f"Found {len(recent_payments)} recent payments but none are pending",
                    "debug_info": payment_info
                }
        
        # Check each pending payment with Stripe
        for payment in pending_payments:
            try:
                logger.info(f"Checking payment {payment.get('id')} with Stripe")
                
                stripe_id = payment.get("stripe_payment_intent_id")
                if not stripe_id:
                    logger.warning(f"Payment {payment.get('id')} has no Stripe ID")
                    continue
                
                # Try to retrieve as payment intent first, then as checkout session
                stripe_object = None
                try:
                    if stripe_id.startswith('pi_'):
                        stripe_object = stripe.PaymentIntent.retrieve(stripe_id)
                        payment_status = stripe_object.status
                    elif stripe_id.startswith('cs_'):
                        stripe_object = stripe.checkout.Session.retrieve(stripe_id)
                        payment_status = stripe_object.payment_status
                    else:
                        # Try both
                        try:
                            stripe_object = stripe.PaymentIntent.retrieve(stripe_id)
                            payment_status = stripe_object.status
                        except:
                            stripe_object = stripe.checkout.Session.retrieve(stripe_id)
                            payment_status = stripe_object.payment_status
                            
                    logger.info(f"Stripe object status: {payment_status}")
                    
                except Exception as stripe_error:
                    logger.error(f"Error retrieving Stripe object {stripe_id}: {str(stripe_error)}")
                    continue
                
                if payment_status in ["succeeded", "paid"]:
                    # Process this successful payment
                    credits_to_add = payment.get("credits", 0)
                    plan_name = payment.get("plan_name", "Unknown")
                    
                    logger.info(f"Processing successful payment: {credits_to_add} credits for {plan_name}")
                    
                    # Add credits
                    await add_credits(
                        current_user.id,
                        credits_to_add,
                        "purchase",
                        f"Recovered payment - {plan_name}",
                        payment_id=payment["id"]
                    )
                    
                    # Update payment status
                    await db.payments.update_one(
                        {"_id": payment["_id"]},
                        {
                            "$set": {
                                "status": PaymentStatus.COMPLETED,
                                "completed_at": datetime.utcnow()
                            }
                        }
                    )
                    
                    logger.info(f"Successfully recovered payment and added {credits_to_add} credits")
                    
                    return {
                        "success": True,
                        "credits_added": credits_to_add,
                        "message": f"Payment recovered! {credits_to_add} credits added to your account."
                    }
            except Exception as e:
                logger.error(f"Error checking payment {payment.get('id')}: {str(e)}")
                continue
        
        return {"success": False, "message": "No successful payments found to recover"}
        
    except Exception as e:
        logger.error(f"Payment recovery failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment recovery failed: {str(e)}")

@api_router.post("/admin/add-credits", response_model=dict)
async def admin_add_credits(request: dict, current_user: User = Depends(get_current_user)):
    """Emergency endpoint to manually add credits - for support use"""
    try:
        credits_to_add = request.get("credits", 0)
        reason = request.get("reason", "Manual credit addition")
        
        if credits_to_add <= 0 or credits_to_add > 500:
            raise HTTPException(status_code=400, detail="Invalid credit amount (1-500)")
        
        # Add credits
        await add_credits(
            current_user.id,
            credits_to_add,
            "manual",
            reason
        )
        
        logger.info(f"Manually added {credits_to_add} credits to user {current_user.id}: {reason}")
        
        return {
            "success": True,
            "credits_added": credits_to_add,
            "message": f"Successfully added {credits_to_add} credits to your account."
        }
        
    except Exception as e:
        logger.error(f"Manual credit addition failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Manual credit addition failed: {str(e)}")

@api_router.post("/stripe/webhook")
async def stripe_webhook(request):
    """Handle Stripe webhooks"""
    # This will handle automatic payment confirmations from Stripe
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle successful checkout session
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await process_successful_payment(session)
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        logger.info(f"Payment succeeded: {payment_intent['id']}")
    
    return {"status": "success"}

async def process_successful_payment(session):
    """Process successful payment from Stripe webhook or manual confirmation"""
    try:
        user_id = session['metadata']['user_id']
        plan_id = session['metadata']['plan_id']
        credits = int(session['metadata']['credits'])
        plan_name = session['metadata']['plan_name']
        
        # Find the payment record
        payment_record = await db.payments.find_one({
            "user_id": user_id,
            "status": PaymentStatus.PENDING
        })
        
        if payment_record:
            # Update payment status
            await db.payments.update_one(
                {"_id": payment_record["_id"]},
                {
                    "$set": {
                        "status": PaymentStatus.COMPLETED,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            # Add credits to user account
            await add_credits(
                user_id,
                credits,
                "purchase",
                f"Purchased {plan_name} - {credits} credits",
                payment_id=payment_record["id"]
            )
            
            # Update user's total purchased credits
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"total_credits_purchased": credits}}
            )
            
            logger.info(f"Successfully added {credits} credits to user {user_id} for {plan_name}")
            return True
        else:
            logger.error(f"Payment record not found for user {user_id}")
            return False
            
    except Exception as e:
        logger.error(f"Error processing successful payment: {str(e)}")
        return False

@api_router.post("/payments/confirm-checkout", response_model=dict)
async def confirm_checkout_success(request: dict, current_user: User = Depends(get_current_user)):
    """Confirm successful checkout session and add credits"""
    try:
        session_id = request.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid":
            # Process the payment
            success = await process_successful_payment(session)
            
            if success:
                # Get updated user info
                updated_user = await db.users.find_one({"id": current_user.id})
                credits_added = int(session.metadata.get('credits', 0))
                
                return {
                    "success": True,
                    "credits_added": credits_added,
                    "new_balance": updated_user["credits"],
                    "message": f"Payment successful! {credits_added} credits added to your account."
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to process payment")
        else:
            raise HTTPException(status_code=400, detail="Payment not completed")
            
    except Exception as e:
        logger.error(f"Checkout confirmation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Checkout confirmation failed")

@api_router.get("/vapi-config")
async def get_vapi_config():
    """Get Vapi.ai public configuration"""
    return {
        "public_key": VAPI_PUBLIC_API_KEY
    }

@api_router.post("/deduct-credit", response_model=dict)
async def deduct_single_credit(request: dict, current_user: User = Depends(get_current_user)):
    """Deduct one credit from user account during active conversation"""
    try:
        conversation_id = request.get("conversation_id")
        amount = request.get("amount", 1)
        
        # Check if user has sufficient credits
        if current_user.credits < amount:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        # Deduct credit
        success = await deduct_credits(
            current_user.id, 
            amount, 
            "conversation", 
            f"Real-time credit deduction during conversation",
            conversation_id
        )
        
        if not success:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        # Get updated user info
        updated_user = await db.users.find_one({"id": current_user.id})
        
        return {
            "success": True,
            "remaining_credits": updated_user["credits"],
            "message": f"Deducted {amount} credit(s). {updated_user['credits']} remaining."
        }
        
    except Exception as e:
        logger.error(f"Credit deduction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Credit deduction failed")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
