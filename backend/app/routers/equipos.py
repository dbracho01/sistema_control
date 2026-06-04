from fastapi import APIRouter, HTTPException, Depends
from models.cronograma import Cronograma
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *

router = APIRouter(
    prefix="/equipos",
    tags=["equipos"]
)

# ================================
# EQUIPOS
# ================================

@router.get("/")
def get_equipos(
    db: Session = Depends(get_db)
):
    return db.query(Cronograma).all()

@router.post("/")
def crear_equipo(
    equipo: EquipoCreate,
    db: Session = Depends(get_db)
):
    db_equipo = Cronograma(**equipo.dict())

    db.add(db_equipo)
    db.commit()
    db.refresh(db_equipo)

    return db_equipo

@router.get("/{equipo_id}")
def get_equipo(
    equipo_id: int,
    db: Session = Depends(get_db)
):
    equipo = db.query(Cronograma).filter(
        Cronograma.id == equipo_id
    ).first()

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    return equipo

@router.put("/{equipo_id}")
def modificar_equipo(
    equipo_id: int,
    equipo: EquipoCreate,
    db: Session = Depends(get_db)
):
    db_equipo = db.query(Cronograma).filter(
        Cronograma.id == equipo_id
    ).first()

    if not db_equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    for key, value in equipo.dict().items():
        setattr(db_equipo, key, value)

    db.commit()
    db.refresh(db_equipo)

    return db_equipo

@router.delete("/{equipo_id}")
def eliminar_equipo(
    equipo_id: int,
    db: Session = Depends(get_db)
):
    equipo = db.query(Cronograma).filter(
        Cronograma.id == equipo_id
    ).first()

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    db.delete(equipo)
    db.commit()

    return {
        "mensaje": "Equipo eliminado correctamente"
    }