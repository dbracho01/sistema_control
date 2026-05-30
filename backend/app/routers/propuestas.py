from fastapi import APIRouter, Depends
from models.propuesta import Propuesta
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *

# =========================
# PROPUESTAS
# =========================

router = APIRouter(
    prefix="/propuestas",
    tags=["propuestas"]
)

@router.get("")
def get_propuestas(
    db: Session = Depends(get_db)
):
    return db.query(Propuesta).all()


@router.post("")
def crear_propuesta(
    propuesta: PropuestaCreate,
    db: Session = Depends(get_db)
):
    db_propuesta = Propuesta(**propuesta.dict())

    db.add(db_propuesta)
    db.commit()
    db.refresh(db_propuesta)

    return db_propuesta


@router.get("/{propuesta_id}")
def get_propuesta(
    propuesta_id: int,
    db: Session = Depends(get_db)
):
    propuesta = db.query(Propuesta).filter(
        Propuesta.id == propuesta_id
    ).first()

    if not propuesta:
        raise HTTPException(
            status_code=404,
            detail="Propuesta no encontrada"
        )

    return propuesta


@router.put("/{propuesta_id}")
def modificar_propuesta(
    propuesta_id: int,
    propuesta: PropuestaCreate,
    db: Session = Depends(get_db)
):
    db_propuesta = db.query(Propuesta).filter(
        Propuesta.id == propuesta_id
    ).first()

    if not db_propuesta:
        raise HTTPException(
            status_code=404,
            detail="Propuesta no encontrada"
        )

    for key, value in propuesta.dict().items():
        setattr(db_propuesta, key, value)

    db.commit()
    db.refresh(db_propuesta)

    return db_propuesta


@router.delete("/{propuesta_id}")
def eliminar_propuesta(
    propuesta_id: int,
    db: Session = Depends(get_db)
):
    propuesta = db.query(Propuesta).filter(
        Propuesta.id == propuesta_id
    ).first()

    if not propuesta:
        raise HTTPException(
            status_code=404,
            detail="Propuesta no encontrada"
        )

    db.delete(propuesta)
    db.commit()

    return {
        "mensaje": "Propuesta eliminada"
    }
