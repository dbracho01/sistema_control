from fastapi import APIRouter, HTTPException, Depends
from models.cotizacion import Cotizacion
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *
# =========================
# CLIENTES
# =========================

router = APIRouter(
    prefix="/cotizaciones",
    tags=["cotizaciones"]
)

# =========================
# COTIZACIONES
# =========================

@router.get("/")
def get_cotizaciones(
    db: Session = Depends(get_db)
):
    return db.query(Cotizacion).all()


@router.post("/")
def crear_cotizacion(
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db)
):
    db_cotizacion = Cotizacion(**cotizacion.dict())

    db.add(db_cotizacion)
    db.commit()
    db.refresh(db_cotizacion)

    return db_cotizacion


@router.get("/{cotizacion_id}")
def get_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.id == cotizacion_id
    ).first()

    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    return cotizacion


@router.put("/{cotizacion_id}")
def modificar_cotizacion(
    cotizacion_id: int,
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db)
):
    db_cotizacion = db.query(Cotizacion).filter(
        Cotizacion.id == cotizacion_id
    ).first()

    if not db_cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    for key, value in cotizacion.dict().items():
        setattr(db_cotizacion, key, value)

    db.commit()
    db.refresh(db_cotizacion)

    return db_cotizacion


@router.delete("/{cotizacion_id}")
def eliminar_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.id == cotizacion_id
    ).first()

    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    db.delete(cotizacion)
    db.commit()

    return {
        "mensaje": "Cotización eliminada"
    }

