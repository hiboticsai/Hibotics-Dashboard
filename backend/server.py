from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Resend email configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'info@hiboticsai.com')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'hibotics-ai-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Create the main app
app = FastAPI(title="HiBotics AI Dashboard API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== EMAIL NOTIFICATION HELPER ==================

async def send_onboarding_notification_email(submission_data: dict):
    """Send email notification when new onboarding submission is received"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email notification")
        return False
    
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        # Build email HTML
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 30px; border-radius: 10px;">
                <h1 style="color: #00F5D4; margin: 0;">New Onboarding Submission</h1>
                <p style="color: #888; margin-top: 10px;">A new client has completed the onboarding form</p>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #333; border-bottom: 2px solid #00F5D4; padding-bottom: 10px;">Business Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 40%;">Business Name:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: bold;">{submission_data.get('business_name', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Industry:</td>
                        <td style="padding: 8px 0; color: #333;">{submission_data.get('industry', 'N/A').title()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Business Size:</td>
                        <td style="padding: 8px 0; color: #333;">{submission_data.get('business_size', 'N/A')}</td>
                    </tr>
                </table>
                
                <h2 style="color: #333; border-bottom: 2px solid #00F5D4; padding-bottom: 10px; margin-top: 20px;">Contact Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 40%;">Name:</td>
                        <td style="padding: 8px 0; color: #333; font-weight: bold;">{submission_data.get('name', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Email:</td>
                        <td style="padding: 8px 0; color: #333;"><a href="mailto:{submission_data.get('email', '')}" style="color: #00F5D4;">{submission_data.get('email', 'N/A')}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Website:</td>
                        <td style="padding: 8px 0; color: #333;">{submission_data.get('website_url') or 'Not provided'}</td>
                    </tr>
                </table>
                
                <h2 style="color: #333; border-bottom: 2px solid #00F5D4; padding-bottom: 10px; margin-top: 20px;">AI Voice Selection</h2>
                <p style="color: #333;"><strong>Selected Voice:</strong> {submission_data.get('selected_voice_name', 'N/A')}</p>
                
                <h2 style="color: #333; border-bottom: 2px solid #00F5D4; padding-bottom: 10px; margin-top: 20px;">Preferences</h2>
                <p style="color: #666;"><strong>Business Hours:</strong> {submission_data.get('business_hours') or 'Not specified'}</p>
                <p style="color: #666;"><strong>Services:</strong> {submission_data.get('services_offered') or 'Not specified'}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://hibotics-analytics.preview.emergentagent.com/admin/onboarding" 
                   style="background: #00F5D4; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View in Dashboard
                </a>
            </div>
            
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
                This is an automated notification from HiBotics AI Onboarding System
            </p>
        </body>
        </html>
        """
        
        params = {
            "from": "HiBotics AI <onboarding@resend.dev>",
            "to": [NOTIFICATION_EMAIL],
            "subject": f"🎉 New Onboarding: {submission_data.get('business_name', 'New Client')}",
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Onboarding notification email sent: {email_result.get('id')}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send onboarding notification email: {str(e)}")
        return False

# ================== PYDANTIC MODELS ==================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Literal["admin", "client"] = "client"
    company_id: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "client"] = "client"
    company_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    role: str
    company_id: Optional[str] = None
    picture: Optional[str] = None

# Company Models
class CompanyBranding(BaseModel):
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    primary_color: str = "#4BACC6"
    accent_color: Optional[str] = "#FFCC00"
    show_powered_by: bool = True

class CompanyCreate(BaseModel):
    company_name: str
    slug: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    industry: Optional[str] = None
    avg_service_price: float = 100.0
    branding: Optional[CompanyBranding] = None

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    avg_service_price: Optional[float] = None
    branding: Optional[CompanyBranding] = None

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    company_id: str
    company_name: str
    slug: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    industry: Optional[str] = None
    avg_service_price: float = 100.0
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    primary_color: str = "#4BACC6"
    accent_color: Optional[str] = "#FFCC00"
    show_powered_by: bool = True
    created_at: datetime

# Agent Models
class AgentCreate(BaseModel):
    agent_name: str
    provider: str = "hibotics"
    phone_number: str
    status: Literal["active", "inactive", "paused"] = "active"

class AgentUpdate(BaseModel):
    agent_name: Optional[str] = None
    provider: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[Literal["active", "inactive", "paused"]] = None

class Agent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    agent_id: str
    company_id: str
    agent_name: str
    provider: str
    phone_number: str
    status: str
    created_at: datetime

# Call Models
class CallCreate(BaseModel):
    agent_id: str
    caller_number: str
    duration_seconds: int
    outcome: Literal["booking", "lead", "faq", "voicemail", "failed"]
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None

class Call(BaseModel):
    model_config = ConfigDict(extra="ignore")
    call_id: str
    company_id: str
    agent_id: str
    caller_number: str
    duration_seconds: int
    outcome: str
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

# Lead Models
class LeadCreate(BaseModel):
    source_call_id: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    service_requested: Optional[str] = None
    status: Literal["new", "contacted", "booked", "won", "lost"] = "new"
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service_requested: Optional[str] = None
    status: Optional[Literal["new", "contacted", "booked", "won", "lost"]] = None
    notes: Optional[str] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    lead_id: str
    company_id: str
    source_call_id: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    service_requested: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

# Social Account Models
class SocialAccountCreate(BaseModel):
    platform: Literal["instagram", "facebook", "tiktok"]
    account_id: str
    access_token: Optional[str] = None

class SocialAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    social_account_id: str
    company_id: str
    platform: str
    account_id: str
    created_at: datetime

# Social Metrics Models
class SocialMetricCreate(BaseModel):
    social_account_id: str
    date: datetime
    followers: int = 0
    reach: int = 0
    impressions: int = 0
    engagement_rate: float = 0.0
    profile_visits: int = 0
    link_clicks: int = 0

class SocialMetric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    metric_id: str
    social_account_id: str
    date: datetime
    followers: int
    reach: int
    impressions: int
    engagement_rate: float
    profile_visits: int
    link_clicks: int

# Billing Models
class BillingCreate(BaseModel):
    month: str  # Format: YYYY-MM
    retainer_amount: float = 0.0
    minutes_used: int = 0
    minute_rate: float = 0.1
    usage_cost: float = 0.0
    total_cost: float = 0.0
    payment_status: Literal["paid", "pending", "overdue"] = "pending"
    invoice_url: Optional[str] = None

class BillingUpdate(BaseModel):
    retainer_amount: Optional[float] = None
    minutes_used: Optional[int] = None
    minute_rate: Optional[float] = None
    usage_cost: Optional[float] = None
    total_cost: Optional[float] = None
    payment_status: Optional[Literal["paid", "pending", "overdue"]] = None
    invoice_url: Optional[str] = None

class Billing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    billing_id: str
    company_id: str
    month: str
    retainer_amount: float
    minutes_used: int
    minute_rate: float
    usage_cost: float
    total_cost: float
    payment_status: str
    invoice_url: Optional[str] = None
    created_at: datetime

# Dashboard KPIs
class DashboardKPIs(BaseModel):
    calls_handled: int
    bookings_created: int
    leads_captured: int
    minutes_used: int
    avg_call_duration: float
    conversion_rate: float
    estimated_revenue: float

# Auth Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ================== ONBOARDING MODELS ==================

# Discovery Questions (static list)
DISCOVERY_QUESTIONS = [
    {
        "key": "missed_calls_frequency",
        "question": "How often are you unable to answer calls during busy periods?",
        "type": "select",
        "options": ["Rarely", "Sometimes", "Often", "Very Often", "Almost Always"]
    },
    {
        "key": "lost_revenue_impact",
        "question": "Do missed calls or delayed responses result in lost bookings or revenue for your business?",
        "type": "select",
        "options": ["No", "Rarely", "Sometimes", "Frequently", "Yes, significantly"]
    },
    {
        "key": "current_call_handling",
        "question": "What currently happens when a customer calls and you can't answer?",
        "type": "textarea"
    },
    {
        "key": "time_spent_on_calls",
        "question": "How much time do you or your team spend handling calls, bookings, and admin each day?",
        "type": "select",
        "options": ["Less than 1 hour", "1-2 hours", "2-4 hours", "4-6 hours", "More than 6 hours"]
    },
    {
        "key": "instant_response_impact",
        "question": "If every enquiry was answered instantly, how would that impact your business?",
        "type": "textarea"
    }
]

class OnboardingDiscoveryAnswer(BaseModel):
    question_key: str
    answer: str

class OnboardingVoiceSelection(BaseModel):
    voice_id: str
    voice_name: str
    preview_url: Optional[str] = None

class OnboardingSubmissionCreate(BaseModel):
    # Step 1: Account Info (optional if already logged in)
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    # Step 2: Business Profile
    business_name: str
    industry: str
    business_size: str  # solo, 2-5, 6-10, 11-25, 26-50, 50+
    
    # Step 3: Website Info
    website_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    # Step 4: Discovery Answers
    discovery_answers: List[OnboardingDiscoveryAnswer]
    
    # Step 5: Receptionist Preferences
    business_hours: Optional[str] = None  # e.g., "Mon-Fri 9am-5pm"
    call_handling_instructions: Optional[str] = None
    services_offered: Optional[str] = None
    booking_link: Optional[str] = None
    
    # Step 6: Voice Selection
    selected_voice: OnboardingVoiceSelection

class OnboardingSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    submission_id: str
    user_id: Optional[str] = None
    company_id: Optional[str] = None
    
    # Account Info
    name: str
    email: str
    
    # Business Profile
    business_name: str
    industry: str
    business_size: str
    
    # Website Info
    website_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    # Discovery Answers stored separately
    
    # Receptionist Preferences
    business_hours: Optional[str] = None
    call_handling_instructions: Optional[str] = None
    services_offered: Optional[str] = None
    booking_link: Optional[str] = None
    
    # Voice Selection
    selected_voice_id: str
    selected_voice_name: str
    selected_voice_preview_url: Optional[str] = None
    
    # Status tracking
    status: str = "pending"  # pending, reviewed, setup_complete, rejected
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    
    created_at: str

class OnboardingSubmissionUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class AdminNoteCreate(BaseModel):
    note: str

# ================== AUTH UTILITIES ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str, company_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "company_id": company_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Try Authorization header as fallback
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token (for email/password auth)
    try:
        payload = decode_jwt_token(session_token)
        return payload
    except Exception:
        pass
    
    # Check if it's an Emergent session token
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def get_tenant_company_id(user: dict, company_id: Optional[str] = None) -> str:
    """Get the company ID based on user role and request"""
    if user.get("role") == "admin":
        # Admin can access any company
        if company_id:
            return company_id
        return None  # Admin accessing all
    else:
        # Client can only access their own company
        return user.get("company_id")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "company_id": user_data.company_id,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email, user_data.role, user_data.company_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            company_id=user_data.company_id
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"], user["role"], user.get("company_id"))
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            company_id=user.get("company_id"),
            picture=user.get("picture")
        )
    )

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent session_id for session data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as http_client:
        try:
            res = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = res.json()
        except Exception as e:
            logger.error(f"Emergent auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user exists
    email = session_data.get("email")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": session_data.get("name", existing_user.get("name")),
                "picture": session_data.get("picture")
            }}
        )
        role = existing_user.get("role", "client")
        company_id = existing_user.get("company_id")
    else:
        # Create new user (default to client role)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "client"
        company_id = None
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": session_data.get("name", ""),
            "picture": session_data.get("picture"),
            "role": role,
            "company_id": company_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    session_token = session_data.get("session_token")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": session_data.get("name", ""),
        "picture": session_data.get("picture"),
        "role": role,
        "company_id": company_id
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        user_id=user.get("user_id"),
        email=user.get("email"),
        name=user.get("name"),
        role=user.get("role"),
        company_id=user.get("company_id"),
        picture=user.get("picture")
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ================== COMPANY ROUTES ==================

@api_router.get("/companies", response_model=List[Company])
async def list_companies(user: dict = Depends(require_admin)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    return companies

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, user: dict = Depends(get_current_user)):
    # Check access
    if user.get("role") != "admin" and user.get("company_id") != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@api_router.get("/companies/slug/{slug}", response_model=Company)
async def get_company_by_slug(slug: str):
    company = await db.companies.find_one({"slug": slug}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, user: dict = Depends(require_admin)):
    # Check slug uniqueness
    existing = await db.companies.find_one({"slug": company_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    company_id = f"company_{uuid.uuid4().hex[:12]}"
    branding = company_data.branding or CompanyBranding()
    
    company_doc = {
        "company_id": company_id,
        "company_name": company_data.company_name,
        "slug": company_data.slug,
        "contact_name": company_data.contact_name,
        "email": company_data.email,
        "phone": company_data.phone,
        "industry": company_data.industry,
        "avg_service_price": company_data.avg_service_price,
        "brand_name": branding.brand_name or company_data.company_name,
        "brand_logo_url": branding.brand_logo_url,
        "primary_color": branding.primary_color,
        "accent_color": branding.accent_color,
        "show_powered_by": branding.show_powered_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.companies.insert_one(company_doc)
    return company_doc

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: CompanyUpdate, user: dict = Depends(require_admin)):
    update_dict = {k: v for k, v in company_data.model_dump().items() if v is not None}
    
    if company_data.branding:
        branding = company_data.branding
        if branding.brand_name is not None:
            update_dict["brand_name"] = branding.brand_name
        if branding.brand_logo_url is not None:
            update_dict["brand_logo_url"] = branding.brand_logo_url
        if branding.primary_color is not None:
            update_dict["primary_color"] = branding.primary_color
        if branding.accent_color is not None:
            update_dict["accent_color"] = branding.accent_color
        if branding.show_powered_by is not None:
            update_dict["show_powered_by"] = branding.show_powered_by
        del update_dict["branding"]
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.companies.update_one({"company_id": company_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return await db.companies.find_one({"company_id": company_id}, {"_id": 0})

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, user: dict = Depends(require_admin)):
    result = await db.companies.delete_one({"company_id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted"}

# ================== AGENT ROUTES ==================

@api_router.get("/agents", response_model=List[Agent])
async def list_agents(company_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {"company_id": tenant_id} if tenant_id else {}
    agents = await db.agents.find(query, {"_id": 0}).to_list(1000)
    return agents

@api_router.post("/agents", response_model=Agent)
async def create_agent(agent_data: AgentCreate, company_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="company_id required")
    
    agent_id = f"agent_{uuid.uuid4().hex[:12]}"
    agent_doc = {
        "agent_id": agent_id,
        "company_id": tenant_id,
        "agent_name": agent_data.agent_name,
        "provider": agent_data.provider,
        "phone_number": agent_data.phone_number,
        "status": agent_data.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.agents.insert_one(agent_doc)
    return agent_doc

@api_router.put("/agents/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, agent_data: AgentUpdate, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"agent_id": agent_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    update_dict = {k: v for k, v in agent_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.agents.update_one(query, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user: dict = Depends(require_admin)):
    result = await db.agents.delete_one({"agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted"}

# ================== CALL ROUTES ==================

@api_router.get("/calls", response_model=List[Call])
async def list_calls(
    company_id: Optional[str] = None,
    outcome: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {}
    
    if tenant_id:
        query["company_id"] = tenant_id
    
    if outcome:
        query["outcome"] = outcome
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    calls = await db.calls.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return calls

@api_router.get("/calls/{call_id}", response_model=Call)
async def get_call(call_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"call_id": call_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    call = await db.calls.find_one(query, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

@api_router.post("/calls", response_model=Call)
async def create_call(call_data: CallCreate, company_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="company_id required")
    
    call_id = f"call_{uuid.uuid4().hex[:12]}"
    call_doc = {
        "call_id": call_id,
        "company_id": tenant_id,
        "agent_id": call_data.agent_id,
        "caller_number": call_data.caller_number,
        "duration_seconds": call_data.duration_seconds,
        "outcome": call_data.outcome,
        "recording_url": call_data.recording_url,
        "transcript": call_data.transcript,
        "summary": call_data.summary,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.calls.insert_one(call_doc)
    return call_doc

# ================== LEAD ROUTES ==================

@api_router.get("/leads", response_model=List[Lead])
async def list_leads(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {}
    
    if tenant_id:
        query["company_id"] = tenant_id
    
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"lead_id": lead_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    lead = await db.leads.find_one(query, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, company_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="company_id required")
    
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    lead_doc = {
        "lead_id": lead_id,
        "company_id": tenant_id,
        "source_call_id": lead_data.source_call_id,
        "name": lead_data.name,
        "phone": lead_data.phone,
        "email": lead_data.email,
        "service_requested": lead_data.service_requested,
        "status": lead_data.status,
        "notes": lead_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.insert_one(lead_doc)
    return lead_doc

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_data: LeadUpdate, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"lead_id": lead_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    update_dict = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.leads.update_one(query, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"lead_id": lead_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    result = await db.leads.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}

# ================== SOCIAL ACCOUNT ROUTES ==================

@api_router.get("/social-accounts", response_model=List[SocialAccount])
async def list_social_accounts(company_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {"company_id": tenant_id} if tenant_id else {}
    accounts = await db.social_accounts.find(query, {"_id": 0}).to_list(1000)
    return accounts

@api_router.post("/social-accounts", response_model=SocialAccount)
async def create_social_account(account_data: SocialAccountCreate, company_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    if not tenant_id:
        raise HTTPException(status_code=400, detail="company_id required")
    
    account_id = f"social_{uuid.uuid4().hex[:12]}"
    account_doc = {
        "social_account_id": account_id,
        "company_id": tenant_id,
        "platform": account_data.platform,
        "account_id": account_data.account_id,
        "access_token": account_data.access_token,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.social_accounts.insert_one(account_doc)
    # Remove access_token from response
    del account_doc["access_token"]
    return account_doc

@api_router.delete("/social-accounts/{social_account_id}")
async def delete_social_account(social_account_id: str, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user)
    
    query = {"social_account_id": social_account_id}
    if tenant_id:
        query["company_id"] = tenant_id
    
    result = await db.social_accounts.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social account not found")
    return {"message": "Social account deleted"}

# ================== SOCIAL METRICS ROUTES ==================

@api_router.get("/social-metrics", response_model=List[SocialMetric])
async def list_social_metrics(
    social_account_id: Optional[str] = None,
    company_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    tenant_id = get_tenant_company_id(user, company_id)
    
    # If company_id filter, get accounts for that company
    if tenant_id:
        accounts = await db.social_accounts.find({"company_id": tenant_id}, {"_id": 0, "social_account_id": 1}).to_list(1000)
        account_ids = [a["social_account_id"] for a in accounts]
        query = {"social_account_id": {"$in": account_ids}}
    elif social_account_id:
        query = {"social_account_id": social_account_id}
    else:
        query = {}
    
    metrics = await db.social_metrics.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return metrics

@api_router.post("/social-metrics", response_model=SocialMetric)
async def create_social_metric(metric_data: SocialMetricCreate, user: dict = Depends(get_current_user)):
    metric_id = f"metric_{uuid.uuid4().hex[:12]}"
    metric_doc = {
        "metric_id": metric_id,
        "social_account_id": metric_data.social_account_id,
        "date": metric_data.date.isoformat(),
        "followers": metric_data.followers,
        "reach": metric_data.reach,
        "impressions": metric_data.impressions,
        "engagement_rate": metric_data.engagement_rate,
        "profile_visits": metric_data.profile_visits,
        "link_clicks": metric_data.link_clicks
    }
    
    await db.social_metrics.insert_one(metric_doc)
    return metric_doc

# ================== BILLING ROUTES ==================

@api_router.get("/billing", response_model=List[Billing])
async def list_billing(
    company_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {}
    
    if tenant_id:
        query["company_id"] = tenant_id
    
    if payment_status:
        query["payment_status"] = payment_status
    
    billing = await db.billing.find(query, {"_id": 0}).sort("month", -1).to_list(1000)
    return billing

@api_router.post("/billing", response_model=Billing)
async def create_billing(billing_data: BillingCreate, company_id: str, user: dict = Depends(require_admin)):
    billing_id = f"bill_{uuid.uuid4().hex[:12]}"
    billing_doc = {
        "billing_id": billing_id,
        "company_id": company_id,
        "month": billing_data.month,
        "retainer_amount": billing_data.retainer_amount,
        "minutes_used": billing_data.minutes_used,
        "minute_rate": billing_data.minute_rate,
        "usage_cost": billing_data.usage_cost,
        "total_cost": billing_data.total_cost,
        "payment_status": billing_data.payment_status,
        "invoice_url": billing_data.invoice_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.billing.insert_one(billing_doc)
    return billing_doc

@api_router.put("/billing/{billing_id}", response_model=Billing)
async def update_billing(billing_id: str, billing_data: BillingUpdate, user: dict = Depends(require_admin)):
    update_dict = {k: v for k, v in billing_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.billing.update_one({"billing_id": billing_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Billing record not found")
    
    return await db.billing.find_one({"billing_id": billing_id}, {"_id": 0})

# ================== DASHBOARD / KPIs ==================

@api_router.get("/dashboard/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(company_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {"company_id": tenant_id} if tenant_id else {}
    
    # Get calls
    calls = await db.calls.find(query, {"_id": 0}).to_list(10000)
    
    # Get leads
    leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    # Get company for avg_service_price
    avg_service_price = 100.0
    if tenant_id:
        company = await db.companies.find_one({"company_id": tenant_id}, {"_id": 0})
        if company:
            avg_service_price = company.get("avg_service_price", 100.0)
    
    # Calculate KPIs
    calls_handled = len(calls)
    bookings_created = len([c for c in calls if c.get("outcome") == "booking"])
    leads_captured = len(leads)
    minutes_used = sum(c.get("duration_seconds", 0) for c in calls) // 60
    
    avg_call_duration = 0.0
    if calls_handled > 0:
        avg_call_duration = sum(c.get("duration_seconds", 0) for c in calls) / calls_handled
    
    conversion_rate = 0.0
    if calls_handled > 0:
        conversion_rate = (bookings_created / calls_handled) * 100
    
    estimated_revenue = bookings_created * avg_service_price
    
    return DashboardKPIs(
        calls_handled=calls_handled,
        bookings_created=bookings_created,
        leads_captured=leads_captured,
        minutes_used=minutes_used,
        avg_call_duration=round(avg_call_duration, 1),
        conversion_rate=round(conversion_rate, 1),
        estimated_revenue=round(estimated_revenue, 2)
    )

@api_router.get("/dashboard/call-trends")
async def get_call_trends(company_id: Optional[str] = None, days: int = 30, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    
    # Get calls from last N days
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    query = {"created_at": {"$gte": start_date}}
    if tenant_id:
        query["company_id"] = tenant_id
    
    calls = await db.calls.find(query, {"_id": 0}).to_list(10000)
    
    # Group by date
    trends = {}
    for call in calls:
        date = call.get("created_at", "")[:10]  # Get YYYY-MM-DD
        if date not in trends:
            trends[date] = {"date": date, "calls": 0, "bookings": 0, "leads": 0, "duration": 0}
        trends[date]["calls"] += 1
        if call.get("outcome") == "booking":
            trends[date]["bookings"] += 1
        if call.get("outcome") == "lead":
            trends[date]["leads"] += 1
        trends[date]["duration"] += call.get("duration_seconds", 0)
    
    return list(sorted(trends.values(), key=lambda x: x["date"]))

@api_router.get("/dashboard/outcome-distribution")
async def get_outcome_distribution(company_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    tenant_id = get_tenant_company_id(user, company_id)
    query = {"company_id": tenant_id} if tenant_id else {}
    
    calls = await db.calls.find(query, {"_id": 0}).to_list(10000)
    
    distribution = {}
    for call in calls:
        outcome = call.get("outcome", "unknown")
        distribution[outcome] = distribution.get(outcome, 0) + 1
    
    return [{"name": k, "value": v} for k, v in distribution.items()]

# ================== ADMIN STATS ==================

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    companies = await db.companies.count_documents({})
    users = await db.users.count_documents({})
    agents = await db.agents.count_documents({})
    calls = await db.calls.count_documents({})
    leads = await db.leads.count_documents({})
    
    # Billing stats
    billing_records = await db.billing.find({}, {"_id": 0}).to_list(10000)
    total_revenue = sum(b.get("total_cost", 0) for b in billing_records if b.get("payment_status") == "paid")
    pending_amount = sum(b.get("total_cost", 0) for b in billing_records if b.get("payment_status") == "pending")
    overdue_amount = sum(b.get("total_cost", 0) for b in billing_records if b.get("payment_status") == "overdue")
    
    return {
        "total_companies": companies,
        "total_users": users,
        "total_agents": agents,
        "total_calls": calls,
        "total_leads": leads,
        "total_revenue": round(total_revenue, 2),
        "pending_amount": round(pending_amount, 2),
        "overdue_amount": round(overdue_amount, 2)
    }

@api_router.get("/admin/companies-performance")
async def get_companies_performance(user: dict = Depends(require_admin)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    
    performance = []
    for company in companies:
        company_id = company["company_id"]
        
        calls = await db.calls.count_documents({"company_id": company_id})
        bookings = await db.calls.count_documents({"company_id": company_id, "outcome": "booking"})
        leads = await db.leads.count_documents({"company_id": company_id})
        
        # Get latest billing
        latest_billing = await db.billing.find_one(
            {"company_id": company_id},
            {"_id": 0},
            sort=[("month", -1)]
        )
        
        performance.append({
            "company_id": company_id,
            "company_name": company.get("company_name"),
            "slug": company.get("slug"),
            "industry": company.get("industry"),
            "calls": calls,
            "bookings": bookings,
            "leads": leads,
            "conversion_rate": round((bookings / calls * 100) if calls > 0 else 0, 1),
            "billing_status": latest_billing.get("payment_status") if latest_billing else "none"
        })
    
    return performance

# ================== USERS MANAGEMENT ==================

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(company_id: Optional[str] = None, user: dict = Depends(require_admin)):
    query = {"company_id": company_id} if company_id else {}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, admin: dict = Depends(require_admin)):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "company_id": user_data.company_id,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        company_id=user_data.company_id
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ================== PDF REPORT GENERATION ==================

@api_router.get("/reports/generate-pdf")
async def generate_pdf_report(
    company_id: Optional[str] = None,
    report_type: str = "weekly",
    user: dict = Depends(get_current_user)
):
    """Generate PDF report server-side"""
    tenant_id = get_tenant_company_id(user, company_id)
    
    # Get company info
    company = None
    if tenant_id:
        company = await db.companies.find_one({"company_id": tenant_id}, {"_id": 0})
    
    # Get KPIs
    query = {"company_id": tenant_id} if tenant_id else {}
    calls = await db.calls.find(query, {"_id": 0}).to_list(10000)
    leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    calls_handled = len(calls)
    bookings_created = len([c for c in calls if c.get("outcome") == "booking"])
    leads_captured = len(leads)
    minutes_used = sum(c.get("duration_seconds", 0) for c in calls) // 60
    
    avg_service_price = company.get("avg_service_price", 100.0) if company else 100.0
    estimated_revenue = bookings_created * avg_service_price
    conversion_rate = (bookings_created / calls_handled * 100) if calls_handled > 0 else 0
    
    # Generate simple text-based report (can be enhanced with reportlab)
    report_content = f"""
HiBotics AI - {report_type.capitalize()} Report
{'=' * 50}
Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}
Company: {company.get('company_name', 'All Companies') if company else 'All Companies'}

PERFORMANCE SUMMARY
{'-' * 30}
Calls Handled: {calls_handled}
Bookings Created: {bookings_created}
Leads Captured: {leads_captured}
Minutes Used: {minutes_used}
Conversion Rate: {conversion_rate:.1f}%
Estimated Revenue: ${estimated_revenue:,.2f}

CALL OUTCOMES
{'-' * 30}
"""
    
    # Add outcome breakdown
    outcomes = {}
    for call in calls:
        outcome = call.get("outcome", "unknown")
        outcomes[outcome] = outcomes.get(outcome, 0) + 1
    
    for outcome, count in outcomes.items():
        report_content += f"  {outcome.capitalize()}: {count}\n"
    
    report_content += f"""
LEAD STATUS
{'-' * 30}
"""
    
    # Add lead status breakdown
    statuses = {}
    for lead in leads:
        status = lead.get("status", "unknown")
        statuses[status] = statuses.get(status, 0) + 1
    
    for status, count in statuses.items():
        report_content += f"  {status.capitalize()}: {count}\n"
    
    report_content += f"""
{'=' * 50}
Powered by HiBotics AI
"""
    
    # Return as downloadable text file (can convert to PDF with reportlab)
    return StreamingResponse(
        BytesIO(report_content.encode()),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=hibotics_report_{report_type}_{datetime.now().strftime('%Y%m%d')}.txt"}
    )

# ================== ONBOARDING ROUTES ==================

# Sample voices for when ElevenLabs API is not available
SAMPLE_VOICES = [
    {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "female", "description": "calm"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8571-63c85f9e5fae.mp3"
    },
    {
        "voice_id": "29vD33N1CtxCmqQRPOHJ",
        "name": "Drew",
        "category": "premade",
        "labels": {"accent": "American", "age": "middle-aged", "gender": "male", "description": "well-rounded"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/29vD33N1CtxCmqQRPOHJ/b26e2a91-7c9f-41c0-ab9e-e3a87b26d83f.mp3"
    },
    {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Sarah",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "female", "description": "soft"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3"
    },
    {
        "voice_id": "ErXwobaYiN019PkySvjV",
        "name": "Antoni",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "male", "description": "well-rounded"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1122-4333-b323-0b87478d506a.mp3"
    },
    {
        "voice_id": "MF3mGyEYCl7XYWbV9V6O",
        "name": "Elli",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "female", "description": "emotional"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/2eb1bb15-66ff-4c43-b756-80ea0e7e2c5d.mp3"
    },
    {
        "voice_id": "TxGEqnHWrfWFTfGW9XjX",
        "name": "Josh",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "male", "description": "deep"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6431a82-f7d2-4905-b8a4-a631960633d6.mp3"
    },
    {
        "voice_id": "VR6AewLTigWG4xSOukaG",
        "name": "Arnold",
        "category": "premade",
        "labels": {"accent": "American", "age": "middle-aged", "gender": "male", "description": "crisp"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/3a48b4ad-e272-4957-be5d-c07b5f9b18ba.mp3"
    },
    {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "name": "Adam",
        "category": "premade",
        "labels": {"accent": "American", "age": "middle-aged", "gender": "male", "description": "deep"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/e0b45450-78db-49b9-aaa4-d5358a6871bd.mp3"
    },
    {
        "voice_id": "yoZ06aMxZJJ28mfd3POQ",
        "name": "Sam",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "male", "description": "raspy"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/b017ad02-8d82-4640-a435-5d5eaa899e7c.mp3"
    },
    {
        "voice_id": "jBpfuIE2acCO8z3wKNLl",
        "name": "Gigi",
        "category": "premade",
        "labels": {"accent": "American", "age": "young", "gender": "female", "description": "childlish"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/jBpfuIE2acCO8z3wKNLl/3a7e4339-78b8-45d7-a2e3-65f9f3f56a28.mp3"
    },
    {
        "voice_id": "oWAxZDx7w5VEj9dCyTzz",
        "name": "Grace",
        "category": "premade",
        "labels": {"accent": "American-Southern", "age": "young", "gender": "female", "description": "gentle"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/oWAxZDx7w5VEj9dCyTzz/84a36d1c-e182-41a8-8c55-dbdd15cd6e72.mp3"
    },
    {
        "voice_id": "onwK4e9ZLuTAKqWW03F9",
        "name": "Daniel",
        "category": "premade",
        "labels": {"accent": "British", "age": "middle-aged", "gender": "male", "description": "authoritative"},
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007c53.mp3"
    }
]

@api_router.get("/onboarding/discovery-questions")
async def get_discovery_questions():
    """Get the list of discovery questions for the onboarding flow"""
    return DISCOVERY_QUESTIONS

@api_router.get("/onboarding/voices")
async def get_available_voices():
    """Get available ElevenLabs voices - returns sample voices if API not configured"""
    elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')
    
    if elevenlabs_key:
        try:
            from elevenlabs import ElevenLabs
            client = ElevenLabs(api_key=elevenlabs_key)
            voices_response = client.voices.get_all()
            
            formatted_voices = []
            for voice in voices_response.voices:
                formatted_voices.append({
                    "voice_id": voice.voice_id,
                    "name": voice.name,
                    "category": voice.category or "premade",
                    "labels": voice.labels or {},
                    "preview_url": voice.preview_url or ""
                })
            return formatted_voices
        except Exception as e:
            logger.error(f"Error fetching voices from ElevenLabs: {e}")
            # Fall back to sample voices
            return SAMPLE_VOICES
    
    # Return sample voices when no API key is configured
    logger.info("ElevenLabs API key not configured, returning sample voices")
    return SAMPLE_VOICES

@api_router.get("/onboarding/voice-preview/{voice_id}")
async def get_voice_preview(voice_id: str, text: str = "Hello! Thank you for calling. How may I assist you today?"):
    """Generate a voice preview using ElevenLabs or return sample preview"""
    elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')
    
    # Check if we have a sample voice with this ID
    sample_voice = next((v for v in SAMPLE_VOICES if v["voice_id"] == voice_id), None)
    
    if elevenlabs_key:
        try:
            from elevenlabs import ElevenLabs
            client = ElevenLabs(api_key=elevenlabs_key)
            
            audio_generator = client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2"
            )
            
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            
            return StreamingResponse(
                BytesIO(audio_data),
                media_type="audio/mpeg",
                headers={"Content-Disposition": f"inline; filename=preview_{voice_id}.mp3"}
            )
        except Exception as e:
            logger.error(f"Error generating voice preview: {e}")
            # Fall through to use sample preview URL if available
    
    # Use sample preview URL if available
    if sample_voice and sample_voice.get("preview_url"):
        # Redirect to the sample preview URL
        return {"redirect_url": sample_voice["preview_url"]}
    
    raise HTTPException(status_code=404, detail="Voice preview not available")

@api_router.post("/onboarding/submit")
async def submit_onboarding(submission_data: OnboardingSubmissionCreate, request: Request):
    """Submit onboarding data - creates user account if needed"""
    
    user_id = None
    existing_user = None
    
    # Check if user is already authenticated
    try:
        auth_header = request.headers.get("Authorization")
        session_token = request.cookies.get("session_token")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_jwt_token(token)
            existing_user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        elif session_token:
            session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if session:
                existing_user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    except Exception:
        pass
    
    if existing_user:
        user_id = existing_user["user_id"]
        name = existing_user.get("name") or submission_data.name or "User"
        email = existing_user.get("email")
    else:
        # Create new user account
        if not submission_data.email or not submission_data.password:
            raise HTTPException(status_code=400, detail="Email and password required for new accounts")
        
        # Check if email exists
        existing = await db.users.find_one({"email": submission_data.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered. Please login first.")
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        name = submission_data.name or "User"
        email = submission_data.email
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "password_hash": hash_password(submission_data.password),
            "role": "client",
            "company_id": None,  # Will be assigned after admin reviews
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create submission record
    submission_id = f"onb_{uuid.uuid4().hex[:12]}"
    
    submission_doc = {
        "submission_id": submission_id,
        "user_id": user_id,
        "company_id": None,  # Will be assigned after admin sets up company
        
        # Account Info
        "name": name,
        "email": email,
        
        # Business Profile
        "business_name": submission_data.business_name,
        "industry": submission_data.industry,
        "business_size": submission_data.business_size,
        
        # Website Info
        "website_url": submission_data.website_url,
        "facebook_url": submission_data.facebook_url,
        "instagram_url": submission_data.instagram_url,
        "linkedin_url": submission_data.linkedin_url,
        
        # Receptionist Preferences
        "business_hours": submission_data.business_hours,
        "call_handling_instructions": submission_data.call_handling_instructions,
        "services_offered": submission_data.services_offered,
        "booking_link": submission_data.booking_link,
        
        # Voice Selection
        "selected_voice_id": submission_data.selected_voice.voice_id,
        "selected_voice_name": submission_data.selected_voice.voice_name,
        "selected_voice_preview_url": submission_data.selected_voice.preview_url,
        
        # Status
        "status": "pending",
        "admin_notes": None,
        "reviewed_by": None,
        "reviewed_at": None,
        
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.onboarding_submissions.insert_one(submission_doc)
    
    # Store discovery answers separately
    for answer in submission_data.discovery_answers:
        answer_doc = {
            "answer_id": f"ans_{uuid.uuid4().hex[:12]}",
            "submission_id": submission_id,
            "question_key": answer.question_key,
            "answer": answer.answer,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.onboarding_discovery_answers.insert_one(answer_doc)
    
    # Send email notification to admin
    await send_onboarding_notification_email(submission_doc)
    
    # Generate JWT token for new users
    token = None
    if not existing_user:
        token = create_jwt_token(user_id, email, "client", None)
    
    return {
        "submission_id": submission_id,
        "message": "Onboarding submitted successfully! Our team will review and set up your AI receptionist.",
        "access_token": token
    }

@api_router.get("/onboarding/submissions", response_model=List[OnboardingSubmission])
async def list_onboarding_submissions(
    status: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Admin: List all onboarding submissions"""
    query = {}
    if status:
        query["status"] = status
    
    submissions = await db.onboarding_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return submissions

@api_router.get("/onboarding/submissions/{submission_id}")
async def get_onboarding_submission(submission_id: str, user: dict = Depends(require_admin)):
    """Admin: Get a specific onboarding submission with discovery answers"""
    submission = await db.onboarding_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get discovery answers
    answers = await db.onboarding_discovery_answers.find({"submission_id": submission_id}, {"_id": 0}).to_list(100)
    
    # Map answers to question keys
    answers_map = {a["question_key"]: a["answer"] for a in answers}
    
    return {
        **submission,
        "discovery_answers": answers_map,
        "discovery_questions": DISCOVERY_QUESTIONS
    }

@api_router.put("/onboarding/submissions/{submission_id}")
async def update_onboarding_submission(
    submission_id: str,
    update_data: OnboardingSubmissionUpdate,
    user: dict = Depends(require_admin)
):
    """Admin: Update submission status and notes"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add reviewer info
    update_dict["reviewed_by"] = user.get("user_id")
    update_dict["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.onboarding_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return await db.onboarding_submissions.find_one({"submission_id": submission_id}, {"_id": 0})

@api_router.post("/onboarding/submissions/{submission_id}/notes")
async def add_admin_note(
    submission_id: str,
    note_data: AdminNoteCreate,
    user: dict = Depends(require_admin)
):
    """Admin: Add a note to a submission"""
    submission = await db.onboarding_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Append note with timestamp
    existing_notes = submission.get("admin_notes") or ""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    admin_name = user.get("name", user.get("email", "Admin"))
    new_note = f"\n[{timestamp}] {admin_name}: {note_data.note}"
    
    updated_notes = existing_notes + new_note
    
    await db.onboarding_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": {
            "admin_notes": updated_notes.strip(),
            "reviewed_by": user.get("user_id"),
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Note added", "admin_notes": updated_notes.strip()}

@api_router.get("/onboarding/stats")
async def get_onboarding_stats(user: dict = Depends(require_admin)):
    """Admin: Get onboarding statistics"""
    total = await db.onboarding_submissions.count_documents({})
    pending = await db.onboarding_submissions.count_documents({"status": "pending"})
    reviewed = await db.onboarding_submissions.count_documents({"status": "reviewed"})
    setup_complete = await db.onboarding_submissions.count_documents({"status": "setup_complete"})
    rejected = await db.onboarding_submissions.count_documents({"status": "rejected"})
    
    return {
        "total": total,
        "pending": pending,
        "reviewed": reviewed,
        "setup_complete": setup_complete,
        "rejected": rejected
    }

# ================== WEBHOOK PLACEHOLDER ==================

@api_router.post("/webhooks/voice-provider")
async def voice_provider_webhook(request: Request):
    """Placeholder for voice provider webhook ingestion"""
    body = await request.json()
    logger.info(f"Received voice provider webhook: {body}")
    # TODO: Process webhook data and create call records
    return {"status": "received"}

@api_router.post("/webhooks/social-metrics")
async def social_metrics_webhook(request: Request):
    """Placeholder for social metrics ingestion"""
    body = await request.json()
    logger.info(f"Received social metrics webhook: {body}")
    # TODO: Process webhook data and create metric records
    return {"status": "received"}

# ================== SEED DATA ==================

@api_router.post("/seed")
async def seed_database(user: dict = Depends(require_admin)):
    """Seed database with sample data"""
    # Check if already seeded
    existing = await db.companies.count_documents({})
    if existing > 0:
        return {"message": "Database already has data", "seeded": False}
    
    # Create companies
    companies_data = [
        {
            "company_id": "company_inlux001",
            "company_name": "Inlux Wellness",
            "slug": "inlux",
            "contact_name": "John Smith",
            "email": "john@inluxwellness.com",
            "phone": "+1-555-0101",
            "industry": "wellness",
            "avg_service_price": 150.0,
            "brand_name": "Inlux Wellness",
            "brand_logo_url": None,
            "primary_color": "#10B981",
            "accent_color": "#FBBF24",
            "show_powered_by": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "company_id": "company_ayurvilla002",
            "company_name": "Ayur Villa Spa",
            "slug": "ayurvilla",
            "contact_name": "Sarah Johnson",
            "email": "sarah@ayurvilla.com",
            "phone": "+1-555-0102",
            "industry": "beauty",
            "avg_service_price": 200.0,
            "brand_name": "Ayur Villa",
            "brand_logo_url": None,
            "primary_color": "#8B5CF6",
            "accent_color": "#F472B6",
            "show_powered_by": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.companies.insert_many(companies_data)
    
    # Create agents
    agents_data = [
        {
            "agent_id": "agent_inlux001",
            "company_id": "company_inlux001",
            "agent_name": "Inlux Receptionist",
            "provider": "hibotics",
            "phone_number": "+1-555-1001",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "agent_id": "agent_ayurvilla001",
            "company_id": "company_ayurvilla002",
            "agent_name": "Ayur Villa Assistant",
            "provider": "hibotics",
            "phone_number": "+1-555-1002",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.agents.insert_many(agents_data)
    
    # Create sample calls
    calls_data = []
    outcomes = ["booking", "lead", "faq", "voicemail", "booking", "booking", "lead", "faq"]
    
    for i, company_id in enumerate(["company_inlux001", "company_ayurvilla002"]):
        agent_id = f"agent_{'inlux001' if i == 0 else 'ayurvilla001'}"
        for j in range(15):
            calls_data.append({
                "call_id": f"call_{uuid.uuid4().hex[:12]}",
                "company_id": company_id,
                "agent_id": agent_id,
                "caller_number": f"+1-555-{str(2000 + j).zfill(4)}",
                "duration_seconds": 60 + (j * 30) % 300,
                "outcome": outcomes[j % len(outcomes)],
                "recording_url": f"https://recordings.hibotics.ai/call_{j}.mp3",
                "transcript": f"Sample transcript for call {j}. Customer inquired about services and availability.",
                "summary": f"Customer called to inquire about services. {'Booking confirmed.' if outcomes[j % len(outcomes)] == 'booking' else 'Information provided.'}",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=j)).isoformat()
            })
    
    await db.calls.insert_many(calls_data)
    
    # Create sample leads
    leads_data = []
    statuses = ["new", "contacted", "booked", "won", "new", "contacted"]
    
    for i, company_id in enumerate(["company_inlux001", "company_ayurvilla002"]):
        for j in range(8):
            leads_data.append({
                "lead_id": f"lead_{uuid.uuid4().hex[:12]}",
                "company_id": company_id,
                "source_call_id": None,
                "name": f"Lead {j + 1}",
                "phone": f"+1-555-{str(3000 + j).zfill(4)}",
                "email": f"lead{j}@example.com",
                "service_requested": "Massage" if j % 2 == 0 else "Facial",
                "status": statuses[j % len(statuses)],
                "notes": f"Interested in premium package. Follow up {'completed' if j % 2 == 0 else 'scheduled'}.",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=j * 2)).isoformat()
            })
    
    await db.leads.insert_many(leads_data)
    
    # Create social accounts
    social_data = [
        {
            "social_account_id": "social_inlux_ig",
            "company_id": "company_inlux001",
            "platform": "instagram",
            "account_id": "inluxwellness",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "social_account_id": "social_ayurvilla_ig",
            "company_id": "company_ayurvilla002",
            "platform": "instagram",
            "account_id": "ayurvillaspa",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "social_account_id": "social_ayurvilla_fb",
            "company_id": "company_ayurvilla002",
            "platform": "facebook",
            "account_id": "ayurvillaspa",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.social_accounts.insert_many(social_data)
    
    # Create social metrics
    metrics_data = []
    for account in ["social_inlux_ig", "social_ayurvilla_ig", "social_ayurvilla_fb"]:
        base_followers = 5000 if "inlux" in account else 8000
        for j in range(14):
            metrics_data.append({
                "metric_id": f"metric_{uuid.uuid4().hex[:12]}",
                "social_account_id": account,
                "date": (datetime.now(timezone.utc) - timedelta(days=j)).isoformat(),
                "followers": base_followers + (j * 50),
                "reach": 1000 + (j * 100),
                "impressions": 2000 + (j * 200),
                "engagement_rate": 3.5 + (j * 0.1),
                "profile_visits": 150 + (j * 10),
                "link_clicks": 30 + (j * 5)
            })
    
    await db.social_metrics.insert_many(metrics_data)
    
    # Create billing records
    billing_data = []
    for company_id in ["company_inlux001", "company_ayurvilla002"]:
        for month_offset in range(3):
            month = (datetime.now(timezone.utc) - timedelta(days=month_offset * 30)).strftime("%Y-%m")
            status = "paid" if month_offset > 0 else "pending"
            
            billing_data.append({
                "billing_id": f"bill_{uuid.uuid4().hex[:12]}",
                "company_id": company_id,
                "month": month,
                "retainer_amount": 500.0,
                "minutes_used": 200 + (month_offset * 50),
                "minute_rate": 0.10,
                "usage_cost": (200 + (month_offset * 50)) * 0.10,
                "total_cost": 500.0 + (200 + (month_offset * 50)) * 0.10,
                "payment_status": status,
                "invoice_url": f"https://invoices.hibotics.ai/{company_id}/{month}.pdf",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    await db.billing.insert_many(billing_data)
    
    return {"message": "Database seeded successfully", "seeded": True}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
