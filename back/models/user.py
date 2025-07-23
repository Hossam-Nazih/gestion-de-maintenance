from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from passlib.context import CryptContext
from database import Base
from datetime import datetime
from enum import Enum

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RoleEnum(str, Enum):
    technicien = "technicien"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    telephone = Column(String(20), nullable=True)
    password_hash = Column(String(128), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.technicien, nullable=False)  # Added role field
    created_at = Column(DateTime, server_default=func.now())

    # Updated relationships for the new intervention structure
    interventions_demandees = relationship(
        "Intervention", 
        foreign_keys="Intervention.demandeur_id",
        back_populates="demandeur"
    )
    interventions_assignees = relationship(
        "Intervention", 
        foreign_keys="Intervention.technicien_id",
        back_populates="technicien"
    )
    traitements = relationship("Traitement", back_populates="technicien")

    def set_password(self, password: str):
        self.password_hash = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'telephone': self.telephone,
            'role': self.role.value if self.role else None,  # Include role in response
            'created_at': self.created_at.isoformat() if self.created_at else None
        }