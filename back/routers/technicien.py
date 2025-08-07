from fastapi import APIRouter, Depends, HTTPException, status as http_status
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
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving interventions: {str(e)}"
        )

# GET ALL INTERVENTIONS (for treatment)
@router.get("/available-interventions", response_model=List[InterventionResponse])
async def get_available_interventions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all interventions available for treatment"""
    try:
        interventions = db.query(Intervention).options(
            joinedload(Intervention.equipement)
        ).order_by(desc(Intervention.created_at)).all()
        
        return interventions
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving available interventions: {str(e)}"
        )

# GET SPECIFIC INTERVENTION
@router.get("/interventions/{intervention_id}", response_model=InterventionResponse)
async def get_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get specific intervention"""
    try:
        intervention = db.query(Intervention).options(
            joinedload(Intervention.equipement)
        ).filter(Intervention.id == intervention_id).first()
        
        if not intervention:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Intervention not found"
            )
        
        return intervention
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving intervention: {str(e)}"
        )


@router.get("/interventions-status-simple")
async def get_interventions_status_simple(
    db: Session = Depends(get_db)
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
            equipment_status = equipment["current_status"]
            status_summary[equipment_status] = status_summary.get(equipment_status, 0) + 1
        
        return {
            "message": "Equipments with problems retrieved successfully",
            "total_equipments_with_problems": len(equipment_list),
            "status_summary": status_summary,
            "equipments": equipment_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving equipments with problems: {str(e)}"
        )

# GET INTERVENTIONS STATUS - Display all interventions with equipment and status - NO AUTH
# In your back/routers/technicien.py file
# Update the get_interventions_status endpoint to include demandeur information

@router.get("/interventions-status")
async def get_interventions_status(
    db: Session = Depends(get_db)
):
    """Get all interventions with their equipment information and current status"""
    try:
        # Query interventions with equipment information using joinedload for optimization
        interventions = db.query(Intervention).options(
            joinedload(Intervention.equipement)
        ).order_by(desc(Intervention.created_at)).all()
        
        intervention_status_list = []
        for intervention in interventions:
            try:
                # Get the latest treatment for this intervention with error handling
                latest_traitement = None
                try:
                    latest_traitement = db.query(Traitement).filter(
                        Traitement.intervention_id == intervention.id
                    ).order_by(desc(Traitement.created_at)).first()
                except Exception as traitement_error:
                    print(f"Warning: Error getting treatment for intervention {intervention.id}: {str(traitement_error)}")
                    # Continue without treatment data
                
                # Safely get intervention attributes with fallbacks - UPDATED TO INCLUDE DEMANDEUR INFO
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
                    
                    # ADDED: Include demandeur information
                    "demandeur_nom": getattr(intervention, 'demandeur_nom', None),
                    "demandeur_email": getattr(intervention, 'demandeur_email', None),
                    "demandeur_telephone": getattr(intervention, 'demandeur_telephone', None),
                    "type_arret": getattr(intervention, 'type_arret', None),
                    "type_probleme": getattr(intervention, 'type_probleme', None),
                    
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
                
            except Exception as individual_error:
                print(f"Warning: Error processing intervention {intervention.id}: {str(individual_error)}")
                # Add basic intervention data even if there's an error
                intervention_status_list.append({
                    "intervention_id": intervention.id,
                    "intervention_title": getattr(intervention, 'titre', 'N/A'),
                    "intervention_description": "Error loading details",
                    "intervention_status": "error",
                    "intervention_priority": None,
                    "intervention_date": getattr(intervention, 'created_at', None),
                    "intervention_updated": None,
                    "equipement_id": getattr(intervention, 'equipement_id', None),
                    
                    # Include demandeur info even in error cases
                    "demandeur_nom": getattr(intervention, 'demandeur_nom', None),
                    "demandeur_email": getattr(intervention, 'demandeur_email', None),
                    "demandeur_telephone": getattr(intervention, 'demandeur_telephone', None),
                    "type_arret": getattr(intervention, 'type_arret', None),
                    "type_probleme": getattr(intervention, 'type_probleme', None),
                    
                    "equipment_info": None,
                    "latest_treatment": None
                })
        
        # Calculate status summary
        status_counts = {}
        for intervention in intervention_status_list:
            intervention_status = intervention["intervention_status"]
            status_counts[intervention_status] = status_counts.get(intervention_status, 0) + 1
        
        return {
            "message": "Interventions status retrieved successfully",
            "total_interventions": len(intervention_status_list),
            "status_summary": status_counts,
            "interventions": intervention_status_list
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving interventions status: {str(e)}"
        )

# CREATE TRAITEMENT (for any intervention)
@router.post("/traitements")
async def create_traitement(
    traitement_data: TraitementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Create a new traitement for any intervention"""
    try:
        # Check if intervention exists
        intervention = db.query(Intervention).filter(
            Intervention.id == traitement_data.intervention_id
        ).first()
        
        if not intervention:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Intervention not found"
            )
        
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Treatment creation failed: {str(e)}"
        )

# GET MY TRAITEMENTS (Fixed)
@router.get("/my-traitements", response_model=List[TraitementResponse])
async def get_my_traitements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get all traitements created by current technicien"""
    try:
        traitements = db.query(Traitement).options(
            joinedload(Traitement.intervention)
        ).filter(
            Traitement.technicien_id == current_user.id
        ).order_by(desc(Traitement.created_at)).all()
        
        return traitements
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving treatments: {str(e)}"
        )

# UPDATE MY TRAITEMENT
@router.put("/traitements/{traitement_id}")
async def update_my_traitement(
    traitement_id: int,
    traitement_update: TraitementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Update my traitement with structured fields"""
    try:
        # Find my traitement
        traitement = db.query(Traitement).filter(
            Traitement.id == traitement_id,
            Traitement.technicien_id == current_user.id
        ).first()
        
        if not traitement:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Treatment not found or not created by you"
            )
        
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )


@router.get("/dashboard")
async def get_technicien_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_simple)
):
    """Get dashboard summary for technicien"""
    try:
        # Use more efficient queries
        total_interventions = db.query(Intervention).count()
        
        # Initialize status_counts with all possible statuses
        status_counts = {
            "en_attente": 0,
            "en_cours": 0,
            "terminee": 0,
            "problematique": 0,
            "annulee": 0
        }
        
        # Single query for all status counts with proper error handling
        try:
            interventions = db.query(Intervention.statut).all()
            
            for status_tuple in interventions:
                # Safely extract status from tuple
                if status_tuple and len(status_tuple) > 0:
                    intervention_status = status_tuple[0]
                    if intervention_status and intervention_status in status_counts:
                        status_counts[intervention_status] += 1
                    # If status is None or unknown, we don't count it
        except Exception as status_error:
            print(f"Warning: Error counting intervention statuses: {str(status_error)}")
        
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
                "interventions_annulee": status_counts.get('annulee', 0),
                "my_traitements_count": my_traitements_count,
                "my_treated_interventions": my_treated_interventions,
                "all_status_counts": status_counts
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard data: {str(e)}"
        )