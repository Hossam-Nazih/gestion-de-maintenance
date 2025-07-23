from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from typing import Dict

# In-memory session store - user_id by session_id
active_sessions: Dict[str, int] = {}

def create_simple_session(user_id: int, request: Request) -> str:
    """Create a simple session using request info"""
    # Use client IP + user agent as session identifier (simple approach)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    session_id = f"{client_ip}_{user_agent}_{user_id}"
    
    # Store user_id for this session
    active_sessions[session_id] = user_id
    print(f"DEBUG: Session created for user {user_id}")
    return session_id

def get_session_user_id(request: Request) -> int:
    """Get user_id from simple session"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Try to find any session for this client
    for session_id, user_id in active_sessions.items():
        if session_id.startswith(f"{client_ip}_{user_agent}_"):
            print(f"DEBUG: Found session for user {user_id}")
            return user_id
    
    print("DEBUG: No active session found")
    return None

def get_current_user_simple(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from simple session"""
    user_id = get_session_user_id(request)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Clean up invalid session
        clear_user_sessions(user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    print(f"DEBUG: Authenticated user: {user.username} (Role: {user.role})")
    return user

def logout_simple(request: Request) -> bool:
    """Simple logout"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Remove all sessions for this client
    sessions_to_remove = []
    for session_id in active_sessions.keys():
        if session_id.startswith(f"{client_ip}_{user_agent}_"):
            sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        del active_sessions[session_id]
    
    print(f"DEBUG: Logged out {len(sessions_to_remove)} sessions")
    return len(sessions_to_remove) > 0

def clear_user_sessions(user_id: int) -> int:
    """Clear all sessions for a user"""
    sessions_to_remove = []
    for session_id, session_user_id in active_sessions.items():
        if session_user_id == user_id:
            sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        del active_sessions[session_id]
    
    return len(sessions_to_remove)