# equipement.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.equipement import Equipement  # Your ORM model

router = APIRouter()

@router.get("/equipments")
def get_equipments(db: Session = Depends(get_db)):
    equipments = db.query(Equipement).all()
    return equipments
