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
from datetime import datetime
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

import os,json,uuid,shutil,pdfkit

# ================================
# DATABASE
# ================================

from database.db import Base, engine, SessionLocal, get_db

# ================================
# MODELOS
# ================================

from models.usuario import Usuario
from models.indicadores import Intervencion

#ROUTERS
from routers import clientes, cotizaciones, equipos, intervensiones, metricas, productos, propuestas, usuarios 
from config.index import *
from functions.auth import *
from schemas.index import *

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

app.include_router(clientes.router)
app.include_router(cotizaciones.router)
app.include_router(equipos.router)
app.include_router(intervensiones.router)
app.include_router(metricas.router)
app.include_router(productos.router)
app.include_router(propuestas.router)
app.include_router(usuarios.router)

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
# ROOT
# ================================

@app.get("/")
def root():
    return {
        "status": "Sistema activo"
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