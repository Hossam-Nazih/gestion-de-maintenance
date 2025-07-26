from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class TypeArretEnum(str, Enum):
    AM = "AM"
    AP = "AP"
    AN = "AN"
    CM = "CM"


class PrioriteEnum(str, Enum):
    basse = "basse"        # Match database exactly
    moyenne = "moyenne"    # Match database exactly  
    elevee = "elevee"      # Match database exactly ('elevee' not 'haute')


class TypeProblemeEnum(str, Enum):
    mecanique = "mecanique"       # Match database exactly
    electrique = "electrique"     # Match database exactly
    hydraulique = "hydraulique"   # Match database exactly
    pneumatique = "pneumatique"   # Match database exactly


class StatutEnum(str, Enum):
    en_attente = "en_attente"     # Fixed: use lowercase values consistently
    en_cours = "en_cours"         # Fixed: use lowercase values consistently
    terminee = "terminee"         # Fixed: use lowercase values consistently
    annulee = "annulee"
    en_attente_piece = "en_attente_piece"           # Fixed: use lowercase values consistently


class InterventionBase(BaseModel):
    equipement_id: int
    type_arret: TypeArretEnum
    description: str
    photo_path: Optional[str] = None
    priorite: PrioriteEnum
    type_probleme: TypeProblemeEnum


class InterventionCreate(InterventionBase):
    """For authenticated users (legacy)"""
    pass


class InterventionCreatePublic(InterventionBase):
    """For public creation without authentication"""
    demandeur_nom: str
    demandeur_email: EmailStr
    demandeur_telephone: Optional[str] = None


class InterventionUpdate(BaseModel):
    equipement_id: Optional[int] = None
    type_arret: Optional[TypeArretEnum] = None
    description: Optional[str] = None
    photo_path: Optional[str] = None
    priorite: Optional[PrioriteEnum] = None
    type_probleme: Optional[TypeProblemeEnum] = None
    statut: Optional[StatutEnum] = None
    demandeur_nom: Optional[str] = None
    demandeur_email: Optional[EmailStr] = None
    demandeur_telephone: Optional[str] = None


class InterventionResponse(InterventionBase):
    id: int
    demandeur_id: Optional[int] = None  # Made optional for public interventions
    technicien_id: Optional[int] = None
    statut: StatutEnum
    created_at: Optional[datetime] = None
    demandeur_nom: Optional[str] = None
    demandeur_email: Optional[EmailStr] = None
    demandeur_telephone: Optional[str] = None
    notes_technicien: Optional[str] = None

    class Config:
        from_attributes = True