from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from enum import Enum

# Define enums that MATCH your database exactly
class TypeArretEnum(str, Enum):
    AM = "AM"
    AP = "AP"
    AN = "AN"
    CM = "CM"

class PrioriteEnum(str, Enum):
    basse = "basse"        # Match your database
    moyenne = "moyenne"    # Match your database  
    elevee = "elevee"      # Match your database (not 'haute')

class TypeProblemeEnum(str, Enum):
    mecanique = "mecanique"       # Match your database
    electrique = "electrique"     # Match your database
    hydraulique = "hydraulique"   # Match your database
    pneumatique = "pneumatique"   # Match your database

class StatutEnum(str, Enum):
    en_attente = "en_attente"
    en_cours = "en_cours"
    terminee = "terminee"
    annulee = "annulee"

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    equipement_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    type_arret = Column(SQLEnum(TypeArretEnum), nullable=False)
    description = Column(String(500), nullable=False)
    photo_path = Column(String(255))
    priorite = Column(SQLEnum(PrioriteEnum), nullable=False)
    type_probleme = Column(SQLEnum(TypeProblemeEnum), nullable=False)
    statut = Column(SQLEnum(StatutEnum), default=StatutEnum.en_attente)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Fields for public interventions
    demandeur_nom = Column(String(100))
    demandeur_email = Column(String(100))
    demandeur_telephone = Column(String(20))
    
    # Optional relations
    demandeur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    technicien_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes_technicien = Column(String(500))
    
    # Relationships
    equipement = relationship("Equipement", back_populates="interventions")
    demandeur = relationship(
        "User", 
        foreign_keys=[demandeur_id],
        back_populates="interventions_demandees"
    )
    technicien = relationship(
        "User", 
        foreign_keys=[technicien_id],
        back_populates="interventions_assignees"
    )
    traitements = relationship("Traitement", back_populates="intervention")

    def to_dict(self):
        return {
            'id': self.id,
            'equipement_id': self.equipement_id,
            'type_arret': self.type_arret.value if self.type_arret else None,
            'description': self.description,
            'photo_path': self.photo_path,
            'priorite': self.priorite.value if self.priorite else None,
            'type_probleme': self.type_probleme.value if self.type_probleme else None,
            'statut': self.statut.value if self.statut else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'demandeur_nom': self.demandeur_nom,
            'demandeur_email': self.demandeur_email,
            'demandeur_telephone': self.demandeur_telephone,
            'demandeur_id': self.demandeur_id,
            'technicien_id': self.technicien_id,
            'notes_technicien': self.notes_technicien,
            'equipement': self.equipement.to_dict() if self.equipement else None,
            'demandeur': self.demandeur.to_dict() if self.demandeur else None,
            'technicien': self.technicien.to_dict() if self.technicien else None
        }