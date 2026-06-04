from fastapi import APIRouter, HTTPException, Depends
from models.indicadores import Intervencion
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *

router = APIRouter(
    prefix="/intervenciones",
    tags=["intervenciones"]
)

# ================================
# INTERVENCIONES
# ================================

@router.post("/")
def crear_intervencion(
    intervencion: IntervencionCreate,
    db: Session = Depends(get_db)
):
    horas_parada = 0

    try:
        h1 = datetime.strptime(
            intervencion.hora_inicio,
            "%H:%M"
        )

        h2 = datetime.strptime(
            intervencion.hora_fin,
            "%H:%M"
        )

        horas_parada = (
            h2 - h1
        ).seconds / 3600

    except:
        pass

    db_intervencion = Intervencion(
        equipo_id=intervencion.equipo_id,
        fecha=intervencion.fecha,
        hora_inicio=intervencion.hora_inicio,
        hora_fin=intervencion.hora_fin,
        tipo_intervencion=intervencion.tipo_intervencion,
        descripcion=intervencion.descripcion,
        tecnico=intervencion.tecnico,
        horas_parada=horas_parada,
        costo_mano_obra=intervencion.costo_mano_obra,
        costo_repuestos=intervencion.costo_repuestos,
        costo_total=(
            intervencion.costo_mano_obra +
            intervencion.costo_repuestos
        ),
        ingreso_generado=intervencion.ingreso_generado,
        ahorro_fallos=intervencion.ahorro_fallos
    )

    db.add(db_intervencion)
    db.commit()
    db.refresh(db_intervencion)

    return db_intervencion

@router.get("/")
def obtener_intervenciones(
    db: Session = Depends(get_db)
):
    return db.query(
        Intervencion
    ).order_by(
        Intervencion.fecha.desc()
    ).all()

@router.get("/{intervencion_id}")
def obtener_intervencion(
    intervencion_id: int,
    db: Session = Depends(get_db)
):
    intervencion = db.query(
        Intervencion
    ).filter(
        Intervencion.id == intervencion_id
    ).first()

    if not intervencion:
        raise HTTPException(
            status_code=404,
            detail="Intervención no encontrada"
        )

    return intervencion

@router.put("/{intervencion_id}")
def actualizar_intervencion(
    intervencion_id: int,
    intervencion: IntervencionCreate,
    db: Session = Depends(get_db)
):
    db_intervencion = db.query(
        Intervencion
    ).filter(
        Intervencion.id == intervencion_id
    ).first()

    if not db_intervencion:
        raise HTTPException(
            status_code=404,
            detail="Intervención no encontrada"
        )

    for key, value in intervencion.dict().items():
        setattr(db_intervencion, key, value)

    db_intervencion.costo_total = (
        intervencion.costo_mano_obra +
        intervencion.costo_repuestos
    )

    db.commit()
    db.refresh(db_intervencion)

    return {
        "mensaje": "Intervención actualizada",
        "id": db_intervencion.id
    }

@router.delete("/{intervencion_id}")
def eliminar_intervencion(
    intervencion_id: int,
    db: Session = Depends(get_db)
):
    intervencion = db.query(
        Intervencion
    ).filter(
        Intervencion.id == intervencion_id
    ).first()

    if not intervencion:
        raise HTTPException(
            status_code=404,
            detail="Intervención no encontrada"
        )

    db.delete(intervencion)
    db.commit()

    return {
        "mensaje": "Intervención eliminada"
    }
