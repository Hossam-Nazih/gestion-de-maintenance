from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Equipement(Base):
    __tablename__ = 'equipements'

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    en_service = Column(Enum('actif', 'maintenance', 'arret'), default='actif')
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    interventions = relationship("Intervention", back_populates="equipement")

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'type': self.type,
            'en_service': self.en_service,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }