from fastapi import APIRouter, Depends
from models.cronograma import Cronograma
from sqlalchemy.orm import Session
from database.db import get_db
from schemas import *

router = APIRouter(
    prefix="/metricas",
    tags=["metricas"]
)
# ================================
# MÉTRICAS
# ================================

@router.get("/resumen")
async def get_metricas_resumen(
    db: Session = Depends(get_db)
):
    equipos = db.query(Cronograma).all()

    intervenciones = db.query(
        Intervencion
    ).all()

    return {
        "total_equipos": len(equipos),
        "total_intervenciones": len(intervenciones),
        "total_horas_parada": sum(
            i.horas_parada or 0
            for i in intervenciones
        ),
        "total_costo_mantenimiento": sum(
            i.costo_total or 0
            for i in intervenciones
        )
    }
