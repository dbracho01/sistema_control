# ================================
# main.py COMPLETO Y CORREGIDO
# ================================

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from reportlab.lib import colors
import os
# ================================
    # DATABASE
# ================================
from database.db import Base, engine
# ================================
    #ROUTERS
# ================================
from routers import clientes, cotizaciones, equipos, intervensiones, metricas, productos, propuestas, usuarios, reportes
from config.index import *
from functions.auth import *
from functions.users import *
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


# Define la lista de URLs exactas de tus frontends

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

api_router = APIRouter(prefix="/api")
api_router.include_router(equipos.router)
api_router.include_router(clientes.router)
api_router.include_router(cotizaciones.router)
api_router.include_router(intervensiones.router)
api_router.include_router(metricas.router)
api_router.include_router(productos.router)
api_router.include_router(propuestas.router)
api_router.include_router(usuarios.router)
api_router.include_router(reportes.router)

app.include_router(api_router)

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

# ==============================
# Varaibles Globales
# =====================

app.state.UPLOADS_DIR = UPLOADS_DIR
app.state.TEMP_DIR = TEMP_DIR

# ================================
# CREAR TABLAS
# ================================

Base.metadata.create_all(bind=engine)

inicializar_admin()
# ================================
# ROOT
# ================================

@app.get("/api/status")
def root():
    return {
        "status": "Sistema activo"
    }



