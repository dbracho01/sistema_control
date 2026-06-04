from fastapi import APIRouter, Depends, File, UploadFile, Request
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.index import *
from functions.auth import *
import aiofiles
import os, uuid
from models.indicadores import Intervencion
from fastapi.responses import (
    JSONResponse,
    FileResponse,
    HTMLResponse
)
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm

from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
router = APIRouter()

# ================================
# SUBIR IMÁGENES
# ================================
@router.post("/subir-imagen")
async def subir_imagen(request: Request, file: UploadFile = File(...)):
    # 1. Extraer extensión de forma segura y en minúsculas
    # Si el archivo no tiene extensión, por defecto asignamos 'jpg'
    partes_nombre = file.filename.split(".")
    extension = partes_nombre[-1].lower() if len(partes_nombre) > 1 else "jpg"

    # 2. Generar nombre único con UUID
    nombre_archivo = f"{uuid.uuid4()}.{extension}"

    # 3. Construir la ruta de destino
    ruta_archivo = os.path.join(request.app.state.UPLOADS_DIR, nombre_archivo)

    # 4. Escritura ASÍNCRONA usando 'aiofiles' y chunks (pedazos) de memoria
    # 'file.file' es un archivo temporal, usamos un bucle para no saturar la RAM
    async with aiofiles.open(ruta_archivo, "wb") as out_file:
        while content := await file.read(1024 * 1024): # Lee bloques de 1MB
            await out_file.write(content)

    # 5. Retornar la URL relativa para el frontend
    return {
        "imagen_url": f"/uploads/{nombre_archivo}"
    }

# @router.post("/subir-imagen")
# async def subir_imagen( file: UploadFile = File(...) ):

#     extension = file.filename.split(".")[-1]

#     nombre_archivo = (
#         f"{uuid.uuid4()}.{extension}"
#     )

#     ruta_archivo = os.path.join(
#         UPLOADS_DIR,
#         nombre_archivo
#     )

#     with open(ruta_archivo, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     return {
#         "imagen_url": f"/uploads/{nombre_archivo}"
#     }

# ================================
# PDF SIMPLE
# ================================

@router.post("/generar-reporte")
async def generar_reporte(
    request: Request, 
    datos: dict
):
    try:
        filename = (
            f"reporte_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        filepath = os.path.join(
            request.app.state.TEMP_DIR,
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

@router.get("/ver-reporte/{reporte_id}")
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