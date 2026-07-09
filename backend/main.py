# ================================
# main.py COMPLETO Y CORREGIDO
# ================================

import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from reportlab.lib import colors
# ================================
# DATABASE
# ================================
from database.db import Base, engine

# ================================
# ROUTERS
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
# MIDDLEWARE PARA CLOUDFLARE / HTTPS
# ================================
# Solo intercepta y fuerza HTTPS si estamos en producción
@app.middleware("http")
async def fix_proxy_headers(request, call_next):
    if settings.ENV == "production" or request.headers.get("x-forwarded-proto") == "https":
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

# ================================
# CORS (Configurado dinámicamente)
# ================================
# Convertimos el string de orígenes separados por comas en una lista real de Python
origins_list = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,  # Usa la lista dinámica en lugar de ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ================================
# ROUTERS ROUTING
# ================================
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
# Variables Globales
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
        "status": "Sistema activo",
        "environment": settings.ENV
    }