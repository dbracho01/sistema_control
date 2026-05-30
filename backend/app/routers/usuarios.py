from fastapi import APIRouter, Depends
from models.usuario import Usuario
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *
from functions.auth import *


router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"]
)

# ================================
# USUARIOS
# ================================

@router.post("/")
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    
    existe = db.query(Usuario).filter(
        Usuario.username == usuario.username
    ).first()

    if existe:
        return JSONResponse(
            status_code=400,
            content={
                "error": "El usuario ya existe"
            }
        )

    db_usuario = Usuario(
        username=usuario.username,
        email=usuario.email,
        password_hash=hash_password(usuario.password),
        nombre_completo=usuario.nombre_completo,
        permiso_cronograma=usuario.permiso_cronograma,
        permiso_reportes=usuario.permiso_reportes,
        permiso_cotizaciones=usuario.permiso_cotizaciones,
        permiso_clientes=usuario.permiso_clientes,
        permiso_productos=usuario.permiso_productos,
        permiso_propuestas=usuario.permiso_propuestas,
        permiso_usuarios=usuario.permiso_usuarios
    )

    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)

    return {
        "mensaje": "Usuario creado correctamente",
        "id": db_usuario.id
    }

@router.get("/")
def listar_usuarios(
    db: Session = Depends(get_db)
):
    return db.query(Usuario).all()