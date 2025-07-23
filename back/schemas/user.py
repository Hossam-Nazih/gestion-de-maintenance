from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    technicien = "technicien"
    admin = "admin"

class UserBase(BaseModel):
    username: str
    email: EmailStr
    telephone: Optional[str] = None

class UserCreate(UserBase):
    """For technicien registration"""
    password: str
    role: Optional[RoleEnum] = RoleEnum.technicien  # Default to technicien

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: RoleEnum  # Include role in response
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str