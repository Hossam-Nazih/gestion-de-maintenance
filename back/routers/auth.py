from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse
from auth import (
    create_simple_session,
    get_current_user_simple,
    logout_simple,
    clear_user_sessions
)

router = APIRouter()

@router.post("/register")
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Simple register - automatically logs in after registration"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        username=user_data.username,
        telephone=user_data.telephone,
        role=user_data.role or "technicien"
    )
    user.set_password(user_data.password)
    
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Automatically create session (log in)
        create_simple_session(user.id, request)
        
        return {
            "message": "Registration successful - you are now logged in",
            "user": user.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Simple login"""
    
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create simple session
    create_simple_session(user.id, request)
    
    return {
        "message": "Login successful",
        "user": user.to_dict()
    }

@router.post("/logout")
async def logout(request: Request):
    """Simple logout"""
    success = logout_simple(request)
    
    if success:
        return {"message": "Logged out successfully"}
    else:
        return {"message": "No active session found"}

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user_simple)):
    """Get current user profile"""
    return {
        "user": current_user.to_dict(),
        "message": "Profile retrieved successfully"
    }

@router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user_simple)):
    """Check if user is authenticated"""
    return {
        "authenticated": True,
        "user": current_user.to_dict(),
        "message": "Authentication valid"
    }