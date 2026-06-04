from fastapi import APIRouter, HTTPException, Depends
from models.producto import Producto
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *

router = APIRouter(
    prefix="/productos",
    tags=["productos"]
)

# ================================
# PRODUCTOS
# ================================

@router.get("/")
def get_productos(
    db: Session = Depends(get_db)
):
    return db.query(Producto).all()

@router.post("/productos")
def crear_producto(
    producto: ProductoCreate,
    db: Session = Depends(get_db)
):
    db_producto = Producto(**producto.dict())

    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)

    return db_producto

@router.get("/productos/{producto_id}")
def get_producto(
    producto_id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(
        Producto.id == producto_id
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return producto

@router.put("/productos/{producto_id}")
def modificar_producto(
    producto_id: int,
    producto: ProductoCreate,
    db: Session = Depends(get_db)
):
    db_producto = db.query(Producto).filter(
        Producto.id == producto_id
    ).first()

    if not db_producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    for key, value in producto.dict().items():
        setattr(db_producto, key, value)

    db.commit()
    db.refresh(db_producto)

    return db_producto

@router.delete("/productos/{producto_id}")
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(
        Producto.id == producto_id
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    db.delete(producto)
    db.commit()

    return {
        "mensaje": "Producto eliminado"
    }