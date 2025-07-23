from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from database import get_db
from models.user import User
from models.intervention import Intervention
from models.traitement import Traitement
from models.equipement import Equipement
from schemas.intervention import InterventionResponse
from schemas.traitement import TraitementCreate, TraitementResponse
from auth import get_current_user_simple
from pydantic import BaseModel

router = APIRouter()

# Pydantic model for traitement updates
class TraitementUpdate(BaseModel):
    intervention_id: Optional[int] = None
    duree_fixation: Optional[int] = None
    heures_arret_machine: Optional[int] = None
    description_reparation: Optional[str] = None
    pieces_changees: Optional[str] = None
    type_fixation: Optional[str] = None
    transfert_specialiste: Optional[bool] = None
    statut_final: Optional[str] = "terminee"

# GET MY TREATED INTERVENTIONS (interventions I have created treatments for)
@router.get("/my-interventions", response_model=List[InterventionResponse])
async def get_my_interventions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get interventions that I have created treatments for"""
    # Use subquery for better performance
    intervention_subquery = db.query(Traitement.intervention_id).filter(
        Traitement.technicien_id == current_user.id
    ).distinct().subquery()
    
    interventions = db.query(Intervention).filter(
        Intervention.id.in_(intervention_subquery)
    ).options(
        joinedload(Intervention.equipement)
    ).order_by(desc(Intervention.created_at)).all()
    
    return interventions

# GET ALL INTERVENTIONS (for treatment)
@router.get("/available-interventions", response_model=List[InterventionResponse])
async def get_available_interventions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all interventions available for treatment"""
    interventions = db.query(Intervention).options(
        joinedload(Intervention.equipement)
    ).order_by(desc(Intervention.created_at)).all()
    
    return interventions

# GET SPECIFIC INTERVENTION
@router.get("/interventions/{intervention_id}", response_model=InterventionResponse)
async def get_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get specific intervention"""
    intervention = db.query(Intervention).options(
        joinedload(Intervention.equipement)
    ).filter(Intervention.id == intervention_id).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention not found"
        )
    
    return intervention

# GET INTERVENTIONS STATUS (Simple version - only equipments with problems)
@router.get("/interventions-status-simple")
async def get_interventions_status_simple(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get only equipments that have interventions (equipments with problems) and their status"""
    try:
        # Query interventions with their equipment information
        interventions = db.query(Intervention).options(
            joinedload(Intervention.equipement)
        ).order_by(desc(Intervention.created_at)).all()
        
        # Dictionary to store unique equipments with their latest status
        equipment_problems = {}
        
        for intervention in interventions:
            if hasattr(intervention, 'equipement') and intervention.equipement:
                equipment = intervention.equipement
                equipment_id = getattr(equipment, 'id', None)
                
                if equipment_id and equipment_id not in equipment_problems:
                    # Get equipment name safely
                    equipment_name = (getattr(equipment, 'nom', None) or 
                                    getattr(equipment, 'name', None) or 
                                    f"Equipment {equipment_id}")
                    
                    # Get intervention status safely
                    intervention_status = (getattr(intervention, 'statut', None) or 
                                         getattr(intervention, 'status', 'unknown'))
                    
                    equipment_problems[equipment_id] = {
                        "equipment_id": equipment_id,
                        "equipment_name": equipment_name,
                        "current_status": intervention_status,
                        "last_intervention_date": getattr(intervention, 'created_at', None)
                    }
        
        # Convert dictionary to list
        equipment_list = list(equipment_problems.values())
        
        # Count status summary
        status_summary = {}
        for equipment in equipment_list:
            status = equipment["current_status"]
            status_summary[status] = status_summary.get(status, 0) + 1
        
        return {
            "message": "Equipments with problems retrieved successfully",
            "total_equipments_with_problems": len(equipment_list),
            "status_summary": status_summary,
            "equipments": equipment_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving equipments with problems: {str(e)}"
        )

# GET INTERVENTIONS STATUS - Display all interventions with equipment and status
@router.get("/interventions-status")
async def get_interventions_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all interventions with their equipment information and current status"""
    try:
        # Query interventions with equipment information using joinedload for optimization
        interventions = db.query(Intervention).options(
            joinedload(Intervention.equipement)
        ).order_by(desc(Intervention.created_at)).all()
        
        intervention_status_list = []
        for intervention in interventions:
            # Get the latest treatment for this intervention
            latest_traitement = db.query(Traitement).filter(
                Traitement.intervention_id == intervention.id
            ).order_by(desc(Traitement.created_at)).first()
            
            # Safely get intervention attributes with fallbacks
            intervention_data = {
                "intervention_id": intervention.id,
                "intervention_title": getattr(intervention, 'titre', 
                                            getattr(intervention, 'title', 
                                                   getattr(intervention, 'name', 'N/A'))),
                "intervention_description": getattr(intervention, 'description', 'N/A'),
                "intervention_status": getattr(intervention, 'statut', 'unknown'),
                "intervention_priority": getattr(intervention, 'priorite', 
                                               getattr(intervention, 'priority', None)),
                "intervention_date": getattr(intervention, 'created_at', None),
                "intervention_updated": getattr(intervention, 'updated_at', None),
                "equipement_id": getattr(intervention, 'equipement_id', None),
                "equipment_info": None,
                "latest_treatment": None
            }
            
            # Safely get equipment information
            if hasattr(intervention, 'equipement') and intervention.equipement:
                equipment = intervention.equipement
                intervention_data["equipment_info"] = {
                    "equipment_id": getattr(equipment, 'id', None),
                    "equipment_name": getattr(equipment, 'nom', 
                                            getattr(equipment, 'name', None)),
                    "equipment_type": getattr(equipment, 'type', None),
                    "equipment_model": getattr(equipment, 'modele', 
                                             getattr(equipment, 'model', None)),
                    "equipment_brand": getattr(equipment, 'marque', 
                                             getattr(equipment, 'brand', None)),
                    "equipment_location": getattr(equipment, 'localisation', 
                                                getattr(equipment, 'location', None)),
                    "installation_date": getattr(equipment, 'date_installation', None)
                }
            
            # Safely get treatment information
            if latest_traitement:
                intervention_data["latest_treatment"] = {
                    "treatment_id": getattr(latest_traitement, 'id', None),
                    "technician_id": getattr(latest_traitement, 'technicien_id', None),
                    "treatment_date": getattr(latest_traitement, 'created_at', None),
                    "repair_duration": getattr(latest_traitement, 'duree_fixation', None),
                    "machine_downtime": getattr(latest_traitement, 'heures_arret_machine', None),
                    "repair_description": getattr(latest_traitement, 'description_reparation', None),
                    "parts_changed": getattr(latest_traitement, 'pieces_changees', None),
                    "fix_type": getattr(latest_traitement, 'type_fixation', None),
                    "specialist_transfer": getattr(latest_traitement, 'transfert_specialiste', None),
                    "final_status": getattr(latest_traitement, 'statut_final', None)
                }
            
            intervention_status_list.append(intervention_data)
        
        # Calculate status summary
        status_counts = {}
        for intervention in intervention_status_list:
            status = intervention["intervention_status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "message": "Interventions status retrieved successfully",
            "total_interventions": len(intervention_status_list),
            "status_summary": status_counts,
            "interventions": intervention_status_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving interventions status: {str(e)}"
        )

# GET ALL EQUIPMENTS WITH THEIR STATUS (Optimized)
@router.get("/equipments-status")
async def get_equipments_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all equipments with their current status"""
    # Use a more efficient query with subquery for latest interventions
    latest_interventions_subquery = db.query(
        Intervention.equipement_id,
        Intervention.id,
        Intervention.statut,
        Intervention.created_at
    ).distinct(Intervention.equipement_id).order_by(
        Intervention.equipement_id, 
        desc(Intervention.created_at)
    ).subquery()
    
    equipments = db.query(Equipement).outerjoin(
        latest_interventions_subquery,
        Equipement.id == latest_interventions_subquery.c.equipement_id
    ).order_by(Equipement.nom).all()
    
    equipment_status_list = []
    for equipment in equipments:
        # Get the latest intervention for this equipment more efficiently
        latest_intervention = db.query(Intervention).filter(
            Intervention.equipement_id == equipment.id
        ).order_by(desc(Intervention.created_at)).first()
        
        equipment_status = "operational"
        last_intervention_date = None
        last_intervention_id = None
        
        if latest_intervention:
            equipment_status = latest_intervention.statut
            last_intervention_date = latest_intervention.created_at
            last_intervention_id = latest_intervention.id
        
        equipment_status_list.append({
            "equipment_id": equipment.id,
            "equipment_name": equipment.nom,
            "equipment_type": equipment.type,
            "equipment_model": equipment.modele,
            "equipment_brand": equipment.marque,
            "location": equipment.localisation,
            "current_status": equipment_status,
            "last_intervention_date": last_intervention_date,
            "last_intervention_id": last_intervention_id,
            "installation_date": equipment.date_installation
        })
    
    return {
        "message": "Equipment status retrieved successfully",
        "total_equipments": len(equipment_status_list),
        "equipments": equipment_status_list
    }

# GET EQUIPMENT STATUS SUMMARY (Optimized)
@router.get("/equipments-status-summary")
async def get_equipments_status_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get summary of equipment statuses"""
    # More efficient query using raw SQL or optimized SQLAlchemy
    equipments = db.query(Equipement).all()
    
    status_counts = {
        "operational": 0,
        "en_attente": 0,
        "en_cours": 0,
        "terminee": 0,
        "problematique": 0
    }
    
    # Batch query for all latest interventions
    equipment_ids = [eq.id for eq in equipments]
    latest_interventions = {}
    
    for eq_id in equipment_ids:
        latest_intervention = db.query(Intervention).filter(
            Intervention.equipement_id == eq_id
        ).order_by(desc(Intervention.created_at)).first()
        
        if latest_intervention:
            latest_interventions[eq_id] = latest_intervention.statut
    
    for equipment in equipments:
        equipment_status = latest_interventions.get(equipment.id, "operational")
        
        if equipment_status in status_counts:
            status_counts[equipment_status] += 1
        else:
            status_counts["operational"] += 1
    
    return {
        "message": "Equipment status summary retrieved",
        "total_equipments": len(equipments),
        "status_summary": status_counts
    }

# CREATE TRAITEMENT (for any intervention)
@router.post("/traitements")
async def create_traitement(
    traitement_data: TraitementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Create a new traitement for any intervention"""
    # Check if intervention exists
    intervention = db.query(Intervention).filter(
        Intervention.id == traitement_data.intervention_id
    ).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention not found"
        )
    
    try:
        # Create traitement
        traitement = Traitement(
            technicien_id=current_user.id,
            **traitement_data.dict()
        )
        
        db.add(traitement)
        
        # Update intervention status based on treatment
        intervention.statut = traitement_data.statut_final
        
        db.commit()
        db.refresh(traitement)
        
        return {
            "message": "Treatment created successfully",
            "traitement_id": traitement.id,
            "intervention_id": intervention.id,
            "created_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Treatment creation failed: {str(e)}"
        )

# GET MY TRAITEMENTS (Optimized)
@router.get("/my-traitements", response_model=List[TraitementResponse])
async def get_my_traitements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all traitements created by current technicien"""
    traitements = db.query(Traitement).options(
        joinedload(Traitement.intervention)
    ).filter(
        Traitement.technicien_id == current_user.id
    ).order_by(desc(Traitement.created_at)).all()
    
    return traitements

# UPDATE MY TRAITEMENT
@router.put("/traitements/{traitement_id}")
async def update_my_traitement(
    traitement_id: int,
    traitement_update: TraitementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Update my traitement with structured fields"""
    # Find my traitement
    traitement = db.query(Traitement).filter(
        Traitement.id == traitement_id,
        Traitement.technicien_id == current_user.id
    ).first()
    
    if not traitement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found or not created by you"
        )
    
    try:
        updated_fields = {}
        update_data = traitement_update.dict(exclude_unset=True)
        
        # Update all provided fields except intervention_id (protected)
        for field, value in update_data.items():
            if field != 'intervention_id' and hasattr(traitement, field):
                setattr(traitement, field, value)
                updated_fields[field] = value
        
        # Update intervention status if statut_final was provided
        if traitement_update.statut_final:
            intervention = db.query(Intervention).filter(
                Intervention.id == traitement.intervention_id
            ).first()
            if intervention:
                intervention.statut = traitement_update.statut_final
        
        db.commit()
        db.refresh(traitement)
        
        return {
            "message": "Treatment updated successfully",
            "traitement_id": traitement.id,
            "intervention_id": traitement.intervention_id,
            "updated_by": current_user.username,
            "updated_fields": updated_fields
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

# DASHBOARD - GET SUMMARY (Optimized)
@router.get("/dashboard")
async def get_technicien_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get dashboard summary for technicien"""
    # Use more efficient queries
    total_interventions = db.query(Intervention).count()
    
    # Single query for all status counts
    status_counts = {}
    interventions = db.query(Intervention.statut).all()
    
    for status_tuple in interventions:
        status = status_tuple[0]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Count my treatments
    my_traitements_count = db.query(Traitement).filter(
        Traitement.technicien_id == current_user.id
    ).count()
    
    # Count interventions I have treated
    my_treated_interventions = db.query(Traitement.intervention_id).filter(
        Traitement.technicien_id == current_user.id
    ).distinct().count()
    
    return {
        "message": "Dashboard data retrieved",
        "technicien": current_user.to_dict(),
        "stats": {
            "total_interventions": total_interventions,
            "interventions_en_attente": status_counts.get('en_attente', 0),
            "interventions_en_cours": status_counts.get('en_cours', 0),
            "interventions_terminee": status_counts.get('terminee', 0),
            "interventions_problematique": status_counts.get('problematique', 0),
            "my_traitements_count": my_traitements_count,
            "my_treated_interventions": my_treated_interventions,
            "all_status_counts": status_counts
        }
    }