from fastapi import APIRouter, HTTPException, Depends
from models.cliente import Cliente
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *
# =========================
# CLIENTES
# =========================

router = APIRouter(
    prefix="/clientes",
    tags=["clientes"]
)

@router.get("/")
def get_clientes(
    db: Session = Depends(get_db)
):
    return db.query(Cliente).all()


@router.post("/")
def crear_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db)
):
    db_cliente = Cliente(**cliente.dict())

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)

    return db_cliente


@router.get("/{cliente_id}")
def get_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado"
        )

    return cliente


@router.put("/{cliente_id}")
def modificar_cliente(
    cliente_id: int,
    cliente: ClienteCreate,
    db: Session = Depends(get_db)
):
    db_cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not db_cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado"
        )

    for key, value in cliente.dict().items():
        setattr(db_cliente, key, value)

    db.commit()
    db.refresh(db_cliente)

    return db_cliente


@router.delete("/{cliente_id}")
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado"
        )

    db.delete(cliente)
    db.commit()

    return {
        "mensaje": "Cliente eliminado"
    }

