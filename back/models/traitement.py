from sqlalchemy import Column, Integer, Float, Text, String, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Traitement(Base):
    __tablename__ = 'traitements'

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey('interventions.id'), nullable=False)
    technicien_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    duree_fixation = Column(Float)
    heures_arret_machine = Column(Float)
    description_reparation = Column(Text)
    pieces_changees = Column(Text)
    type_fixation = Column(String(100))
    transfert_specialiste = Column(Boolean, default=False)
    STATUT_TERMINEE = "terminee"
    STATUT_ANNULEE = "annulee"
    STATUT_EN_COURS = "en_cours"
    STATUT_REPORTEE = "reportee"
    STATUT_EN_ATTENTE = "en_attente"

    statut_final = Column(
        Enum(
            STATUT_TERMINEE,
            STATUT_ANNULEE,
            STATUT_EN_COURS,
            STATUT_REPORTEE,
            STATUT_EN_ATTENTE,
            name="statutfinalenum"
        ),
        nullable=False
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    intervention = relationship("Intervention", back_populates="traitements")
    technicien = relationship("User", back_populates="traitements")

    def to_dict(self):
        return {
            'id': self.id,
            'intervention_id': self.intervention_id,
            'technicien_id': self.technicien_id,
            'duree_fixation': self.duree_fixation,
            'heures_arret_machine': self.heures_arret_machine,
            'description_reparation': self.description_reparation,
            'pieces_changees': self.pieces_changees,
            'type_fixation': self.type_fixation,
            'transfert_specialiste': self.transfert_specialiste,
            'statut_final': self.statut_final,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'intervention': self.intervention.to_dict() if self.intervention else None,
            'technicien': self.technicien.to_dict() if self.technicien else None
        }