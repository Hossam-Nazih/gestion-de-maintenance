from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class StatutFinalEnum(str, Enum):
    terminee = "terminee"
    annulee = "annulee"
    en_cours = "en_cours"
    reportee = "reportee"
    en_attente = "en_attente"


class TraitementBase(BaseModel):
    intervention_id: int
    duree_fixation: Optional[float] = None
    heures_arret_machine: Optional[float] = None
    description_reparation: Optional[str] = None
    pieces_changees: Optional[str] = None
    type_fixation: Optional[str] = None
    transfert_specialiste: bool = False
    statut_final: StatutFinalEnum
    


class TraitementCreate(TraitementBase):
    pass


class TraitementUpdate(BaseModel):                # Added missing update schema
    duree_fixation: Optional[float] = None
    heures_arret_machine: Optional[float] = None
    description_reparation: Optional[str] = None
    pieces_changees: Optional[str] = None
    type_fixation: Optional[str] = None
    transfert_specialiste: Optional[bool] = None
    statut_final: Optional[StatutFinalEnum] = None


class TraitementResponse(TraitementBase):
    id: int
    technicien_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True