from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.intervention import Intervention
from models.equipement import Equipement
from schemas.intervention import InterventionCreatePublic, InterventionUpdate, InterventionResponse

router = APIRouter()


@router.post("/intervention", response_model=dict)
async def create_intervention_public(
    intervention_data: InterventionCreatePublic,
    db: Session = Depends(get_db)
):
    """Create intervention without authentication - for demandeurs"""
    
    # Validate equipment exists
    equipment = db.query(Equipement).filter(Equipement.id == intervention_data.equipement_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Équipement non trouvé"
        )
    
    try:
        # Create intervention with explicit field mapping
        intervention = Intervention(
            equipement_id=intervention_data.equipement_id,
            type_arret=intervention_data.type_arret.value,
            description=intervention_data.description,
            photo_path=intervention_data.photo_path,
            priorite=intervention_data.priorite.value,
            type_probleme=intervention_data.type_probleme.value,
            demandeur_nom=intervention_data.demandeur_nom,
            demandeur_email=intervention_data.demandeur_email,
            demandeur_telephone=intervention_data.demandeur_telephone,
            statut="en_attente"
        )
        
        db.add(intervention)
        db.commit()
        db.refresh(intervention)
        
        return {
            "message": "Intervention créée avec succès",
            "intervention_id": intervention.id,
            "statut": intervention.statut,
            "reference": f"INT-{intervention.id:06d}"  # Give them a reference number
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création: {str(e)}"
        )


@router.get("/intervention/{intervention_id}", response_model=InterventionResponse)
async def get_intervention_public(
    intervention_id: int,
    db: Session = Depends(get_db)
):
    """Get intervention by ID - no auth required for tracking"""
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention non trouvée"
        )
    
    return intervention


@router.put("/intervention/{intervention_id}", response_model=dict)
async def update_intervention_public(
    intervention_id: int,
    intervention_data: InterventionUpdate,
    db: Session = Depends(get_db)
):
    """Update intervention without authentication - for demandeurs (only if not yet processed)"""
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention non trouvée"
        )
    
    if intervention.statut != 'en_attente':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Intervention déjà prise en charge - modifications non autorisées"
        )
    
    try:
        # Update only allowed fields for public users
        update_data = intervention_data.dict(exclude_unset=True)
        allowed_fields = [
            'description', 'photo_path', 'priorite', 'type_probleme',
            'demandeur_nom', 'demandeur_email', 'demandeur_telephone'
        ]
        
        for field, value in update_data.items():
            if field in allowed_fields:
                if hasattr(value, 'value'):  # Handle enum values
                    setattr(intervention, field, value.value)
                else:
                    setattr(intervention, field, value)
        
        db.commit()
        db.refresh(intervention)
        
        return {
            "message": "Intervention mise à jour avec succès",
            "intervention_id": intervention.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour: {str(e)}"
        )


@router.get("/interventions/recent", response_model=List[InterventionResponse])
async def get_recent_interventions_public(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent interventions - public feed for demandeurs to see activity"""
    interventions = db.query(Intervention).order_by(
        Intervention.created_at.desc()
    ).limit(limit).all()
    
    return interventions


@router.get("/intervention/{intervention_id}/status", response_model=dict)
async def get_intervention_status(
    intervention_id: int,
    db: Session = Depends(get_db)
):
    """Get intervention status - simplified for public tracking"""
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention non trouvée"
        )
    
    # Status mapping for public display
    status_messages = {
        'en_attente': 'En attente d\'assignation',
        'en_cours': 'En cours de traitement',
        'terminee': 'Intervention terminée',
        'annulee': 'Intervention annulée'
    }
    
    return {
        "intervention_id": intervention.id,
        "reference": f"INT-{intervention.id:06d}",
        "statut": intervention.statut,
        "statut_message": status_messages.get(intervention.statut, "Statut inconnu"),
        "created_at": intervention.created_at,
        "equipement": intervention.equipement.nom if intervention.equipement else None,
        "technicien_assigne": bool(intervention.technicien_id),
        "notes_technicien": intervention.notes_technicien if intervention.statut == 'terminee' else None
    }