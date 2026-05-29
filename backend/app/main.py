# ================================
# main.py COMPLETO Y CORREGIDO
# ================================

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    JSONResponse,
    FileResponse,
    HTMLResponse
)
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session

from pydantic import BaseModel

from passlib.context import CryptContext
from jose import JWTError, jwt

from datetime import datetime, timedelta, date

from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image
)
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib.units import cm

from jinja2 import Template

import os
import json
import uuid
import shutil
import pdfkit

# ================================
# DATABASE
# ================================

from database.db import Base, engine, SessionLocal

# ================================
# MODELOS
# ================================

from models.cronograma import Cronograma
from models.producto import Producto
from models.cotizacion import Cotizacion
from models.usuario import Usuario
from models.indicadores import Intervencion
from models.cliente import Cliente
from models.propuesta import Propuesta

# ================================
# APP
# ================================

app = FastAPI(
    title="Software Administrativo - Equipos Médicos"
)

# ================================
# CORS
# ================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ================================
# STATIC FILES
# ================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

ASSETS_DIR = os.path.join(BASE_DIR, "frontend-web", "assets")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

if os.path.exists(ASSETS_DIR):
    app.mount(
        "/assets",
        StaticFiles(directory=ASSETS_DIR),
        name="assets"
    )
    print(f"✅ Assets montados: {ASSETS_DIR}")

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads"
)

# ================================
# CREAR TABLAS
# ================================

Base.metadata.create_all(bind=engine)

# ================================
# DEPENDENCIA DB
# ================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================================
# SEGURIDAD
# ================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = "tu-clave-secreta-cambiala"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

def hash_password(password):
    return pwd_context.hash(password)

def verificar_password(
    plain_password,
    hashed_password
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )

def crear_token_acceso(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

# ================================
# SCHEMAS
# ================================

class EquipoCreate(BaseModel):
    equipo: str
    cliente: str
    ubicacion: str
    garantia_inicio: date
    garantia_fin: date
    mtto_inicio: Optional[date] = None
    mtto_fin: Optional[date] = None
    importado: Optional[bool] = False
    nacionalizado: Optional[bool] = False
    mtos_pendientes: Optional[int] = 0
    mtos_realizados: Optional[int] = 0
    observaciones: Optional[str] = None

class ProductoCreate(BaseModel):
    nombre_producto: str
    numero_pieza: Optional[str] = ""
    transporte: Optional[str] = ""
    seguro: Optional[str] = ""
    valor_fob: Optional[float] = 0
    tipo_producto: Optional[str] = "producto"
    linea: Optional[str] = "ninguno"
    referencia: Optional[str] = ""
    activo: bool = True
    precios: dict = {
        "USD": 0,
        "EUR": 0,
        "COP": 0,
        "VES": 0
    }
    iva_porcentaje: float = 19.0
    cantidad_stock: int = 0
    responsables: list = []
    descripcion: Optional[str] = ""
    imagen_url: Optional[str] = ""

class ClienteCreate(BaseModel):
        nombre: str
        identificacion: Optional[str] = ""
        email: Optional[str] = ""
        telefono: Optional[str] = ""
        direccion: Optional[str] = ""
        ciudad: Optional[str] = ""
        contacto: Optional[str] = ""
        asignado_a: Optional[str] = ""
        activo: bool = True
        notas: Optional[str] = ""
class PropuestaCreate(BaseModel):
        titulo: str
        descripcion: Optional[str] = ""
        cliente_id: Optional[int] = None
        estado: str = "Pendiente"

class CotizacionCreate(BaseModel):
        numero_cotizacion: str
        fecha_creacion: date
        fecha_validez: Optional[date] = None
        cliente_id: Optional[int] = None
        cliente_nombre: str
        estado: str = "Pendiente"
        subtotal: float = 0
        iva: float = 0
        total: float = 0
        productos: list = []
        notas: Optional[str] = ""
        condiciones_generales: Optional[str] = ""
        firma_digital: Optional[str] = ""


class UsuarioCreate(BaseModel):
        username: str
        email: str
        password: str
        nombre_completo: Optional[str] = ""
        permiso_cronograma: bool = False
        permiso_reportes: bool = False
        permiso_cotizaciones: bool = False
        permiso_clientes: bool = False
        permiso_productos: bool = False
        permiso_propuestas: bool = False
        permiso_usuarios: bool = False

class LoginData(BaseModel):
        username: str
        password: str

class IntervencionCreate(BaseModel):
        equipo_id: int
        fecha: date
        hora_inicio: str
        hora_fin: str
        tipo_intervencion: str
        descripcion: Optional[str] = ""
        tecnico: str
        costo_mano_obra: float = 0
        costo_repuestos: float = 0
        ingreso_generado: float = 0
        ahorro_fallos: float = 0
        materiales: Optional[list] = []

# ================================
# ROOT
# ================================

@app.get("/")
def root():
    return {
        "status": "Sistema activo"
    }

# ================================
# EQUIPOS
# ================================

@app.get("/equipos")
def get_equipos(
    db: Session = Depends(get_db)
):
    return db.query(Cronograma).all()

@app.post("/equipos")
def crear_equipo(
    equipo: EquipoCreate,
    db: Session = Depends(get_db)
):
    db_equipo = Cronograma(**equipo.dict())

    db.add(db_equipo)
    db.commit()
    db.refresh(db_equipo)

    return db_equipo

@app.get("/equipos/{equipo_id}")
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

@app.put("/equipos/{equipo_id}")
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

@app.delete("/equipos/{equipo_id}")
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

# ================================
# PRODUCTOS
# ================================

@app.get("/productos")
def get_productos(
    db: Session = Depends(get_db)
):
    return db.query(Producto).all()

@app.post("/productos")
def crear_producto(
    producto: ProductoCreate,
    db: Session = Depends(get_db)
):
    db_producto = Producto(**producto.dict())

    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)

    return db_producto

@app.get("/productos/{producto_id}")
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

@app.put("/productos/{producto_id}")
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

@app.delete("/productos/{producto_id}")
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
# =========================
# CLIENTES
# =========================

@app.get("/clientes")
def get_clientes(
    db: Session = Depends(get_db)
):
    return db.query(Cliente).all()


@app.post("/clientes")
def crear_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db)
):
    db_cliente = Cliente(**cliente.dict())

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)

    return db_cliente


@app.get("/clientes/{cliente_id}")
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


@app.put("/clientes/{cliente_id}")
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


@app.delete("/clientes/{cliente_id}")
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


# =========================
# COTIZACIONES
# =========================

@app.get("/cotizaciones")
def get_cotizaciones(
    db: Session = Depends(get_db)
):
    return db.query(Cotizacion).all()


@app.post("/cotizaciones")
def crear_cotizacion(
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db)
):
    db_cotizacion = Cotizacion(**cotizacion.dict())

    db.add(db_cotizacion)
    db.commit()
    db.refresh(db_cotizacion)

    return db_cotizacion


@app.get("/cotizaciones/{cotizacion_id}")
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


@app.put("/cotizaciones/{cotizacion_id}")
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


@app.delete("/cotizaciones/{cotizacion_id}")
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


# =========================
# PROPUESTAS
# =========================

@app.get("/propuestas")
def get_propuestas(
    db: Session = Depends(get_db)
):
    return db.query(Propuesta).all()


@app.post("/propuestas")
def crear_propuesta(
    propuesta: PropuestaCreate,
    db: Session = Depends(get_db)
):
    db_propuesta = Propuesta(**propuesta.dict())

    db.add(db_propuesta)
    db.commit()
    db.refresh(db_propuesta)

    return db_propuesta


@app.get("/propuestas/{propuesta_id}")
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


@app.put("/propuestas/{propuesta_id}")
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


@app.delete("/propuestas/{propuesta_id}")
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


# ================================
# LOGIN
# ================================

@app.post("/login")
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

@app.post("/usuarios")
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
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

@app.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(get_db)
):
    return db.query(Usuario).all()

# ================================
# SUBIR IMÁGENES
# ================================

@app.post("/subir-imagen")
async def subir_imagen(
    file: UploadFile = File(...)
):
    extension = file.filename.split(".")[-1]

    nombre_archivo = (
        f"{uuid.uuid4()}.{extension}"
    )

    ruta_archivo = os.path.join(
        UPLOADS_DIR,
        nombre_archivo
    )

    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "imagen_url": f"/uploads/{nombre_archivo}"
    }

# ================================
# INTERVENCIONES
# ================================

@app.post("/intervenciones")
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

@app.get("/intervenciones")
def obtener_intervenciones(
    db: Session = Depends(get_db)
):
    return db.query(
        Intervencion
    ).order_by(
        Intervencion.fecha.desc()
    ).all()

@app.get("/intervenciones/{intervencion_id}")
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

@app.put("/intervenciones/{intervencion_id}")
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

@app.delete("/intervenciones/{intervencion_id}")
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

# ================================
# MÉTRICAS
# ================================

@app.get("/metricas/resumen")
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

# ================================
# PDF SIMPLE
# ================================

@app.post("/generar-reporte")
async def generar_reporte(
    datos: dict
):
    try:
        filename = (
            f"reporte_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        filepath = os.path.join(
            TEMP_DIR,
            filename
        )

        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
            leftMargin=2 * cm,
            rightMargin=2 * cm
        )

        elementos = []

        styles = getSampleStyleSheet()

        titulo = Paragraph(
            "<b>REPORTE TÉCNICO</b>",
            styles["Title"]
        )

        elementos.append(titulo)
        elementos.append(Spacer(1, 1 * cm))

        for key, value in datos.items():
            texto = Paragraph(
                f"<b>{key}:</b> {value}",
                styles["BodyText"]
            )

            elementos.append(texto)
            elementos.append(Spacer(1, 0.2 * cm))

        doc.build(elementos)

        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/pdf"
        )

    except Exception as e:
        return {
            "error": str(e)
        }

# ================================
# VER REPORTE HTML
# ================================

@app.get("/ver-reporte/{reporte_id}")
async def ver_reporte(
    reporte_id: int,
    db: Session = Depends(get_db)
):
    reporte = db.query(
        Intervencion
    ).filter(
        Intervencion.id == reporte_id
    ).first()

    if not reporte:
        return {
            "error": "Reporte no encontrado"
        }

    html = f"""
    <html>
    <head>
        <title>Reporte {reporte.id}</title>
    </head>
    <body style="font-family: Arial; margin:40px;">
        <h1>Reporte ST-{reporte.id}</h1>

        <p><b>Fecha:</b> {reporte.fecha}</p>
        <p><b>Técnico:</b> {reporte.tecnico}</p>
        <p><b>Tipo:</b> {reporte.tipo_intervencion}</p>

        <hr>

        <h3>Descripción</h3>

        <p>{reporte.descripcion}</p>
    </body>
    </html>
    """

    return HTMLResponse(content=html)