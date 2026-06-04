from fastapi import APIRouter, Depends
from models.usuario import Usuario
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *
from functions.auth import *
from fastapi.responses import JSONResponse
from passlib.context import CryptContext

router = APIRouter()

# ================================
# LOGIN
# ================================

@router.post("/login")
def login(
    login_data: LoginData,
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.username == login_data.username
    ).first()

    if not usuario:
        return JSONResponse(
            status_code=401,
            content={
                "error": "Usuario no encontrado"
            }
        )

    if not verificar_password(
        login_data.password,
        usuario.password_hash
    ):
        return JSONResponse(
            status_code=401,
            content={
                "error": "Contraseña incorrecta"
            }
        )

    if not usuario.activo:
        return JSONResponse(
            status_code=401,
            content={
                "error": "Usuario inactivo"
            }
        )

    token = crear_token_acceso(
        data={
            "sub": usuario.username,
            "id": usuario.id
        }
    )

    return {
        "token": token,
        "usuario": {
            "id": usuario.id,
            "username": usuario.username,
            "nombre_completo": usuario.nombre_completo,
            "email": usuario.email
        }
    }



# ================================
# USUARIOS
# ================================

@router.post("/usuarios")
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

    password_hash = hash_password(usuario.password)

    db_usuario = Usuario(
        username=usuario.username,
        email=usuario.email,
        password_hash=password_hash,
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

  

@router.get("/users")
def listar_usuarios(
    db: Session = Depends(get_db)
):
    return db.query(Usuario).all()