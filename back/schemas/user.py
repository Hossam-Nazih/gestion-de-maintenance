from pydantic import BaseModel, EmailStr
from typing import Optional
from models.user import RoleEnum

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    telephone: Optional[str] = None
    password: str
    role: Optional[RoleEnum] = RoleEnum.technicien

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    telephone: Optional[str]
    role: str
    created_at: str

    class Config:
        from_attributes = True

# schemas/intervention.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models.intervention import TypeArretEnum, PrioriteEnum, TypeProblemeEnum, StatutEnum

class InterventionCreatePublic(BaseModel):
    equipement_id: int
    type_arret: TypeArretEnum
    description: str
    photo_path: Optional[str] = None
    priorite: PrioriteEnum
    type_probleme: TypeProblemeEnum
    demandeur_nom: str
    demandeur_email: EmailStr
    demandeur_telephone: Optional[str] = None

class InterventionUpdate(BaseModel):
    description: Optional[str] = None
    photo_path: Optional[str] = None
    priorite: Optional[PrioriteEnum] = None
    type_probleme: Optional[TypeProblemeEnum] = None
    demandeur_nom: Optional[str] = None
    demandeur_email: Optional[EmailStr] = None
    demandeur_telephone: Optional[str] = None

class TechnicienInterventionUpdate(BaseModel):
    statut: Optional[StatutEnum] = None
    notes_technicien: Optional[str] = None

class InterventionResponse(BaseModel):
    id: int
    equipement_id: int
    type_arret: str
    description: str
    photo_path: Optional[str]
    priorite: str
    type_probleme: str
    statut: str
    created_at: str
    demandeur_nom: Optional[str]
    demandeur_email: Optional[str]
    demandeur_telephone: Optional[str]
    demandeur_id: Optional[int]
    technicien_id: Optional[int]
    notes_technicien: Optional[str]

    class Config:
        from_attributes = True