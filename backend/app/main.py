from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles  # ← AGREGADO
from sqlalchemy.orm import Session
from database.db import Base, engine, SessionLocal
from models.cronograma import Cronograma
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
import os
import json
from jinja2 import Template
import pdfkit
from weasyprint import HTML

app = FastAPI(title="Software Administrativo - Equipos Médicos")  # ← ELIMINADA LA LÍNEA DUPLICADA

# ===== MONTAJE DE ARCHIVOS ESTÁTICOS =====
# Ruta corregida: desde backend/app/ subimos 2 niveles hasta sistema_control/
ruta_correcta = "../../frontend-web/assets"

if os.path.exists(ruta_correcta):
    app.mount("/assets", StaticFiles(directory=ruta_correcta), name="assets")
    print(f"✅ Assets montados en: {os.path.abspath(ruta_correcta)}")
else:
    print(f"⚠️ No se encontró la carpeta assets en: {os.path.abspath(ruta_correcta)}")
# ==========================================

# 🔧 CONFIGURACIÓN CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Crear tablas en la BD
Base.metadata.create_all(bind=engine)

# Dependencia para BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema para recibir datos (ACTUALIZADO con nuevos campos)
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

@app.get("/")
def root():
    return {"status": "Sistema activo"}

@app.get("/equipos")
def get_equipos(db: Session = Depends(get_db)):
    try:
        print("="*50)
        print("📥 GET /equipos - Solicitando lista de equipos")
        equipos = db.query(Cronograma).all()
        print(f"✅ Encontrados {len(equipos)} equipos")
        for eq in equipos:
            print(f"   - ID: {eq.id}, Equipo: {eq.equipo}, Cliente: {eq.cliente}")
        print("="*50)
        return equipos
    except Exception as e:
        print(f"❌ ERROR en GET /equipos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/equipos")
def crear_equipo(equipo: EquipoCreate, db: Session = Depends(get_db)):
    try:
        print("="*50)
        print("📥 POST /equipos - Creando nuevo equipo")
        print(f"Datos: {equipo}")
        db_equipo = Cronograma(**equipo.dict())
        db.add(db_equipo)
        db.commit()
        db.refresh(db_equipo)
        print(f"✅ Equipo creado con ID: {db_equipo.id}")
        print("="*50)
        return db_equipo
    except Exception as e:
        print(f"❌ ERROR en POST /equipos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/equipos/{equipo_id}")
def get_equipo(equipo_id: int, db: Session = Depends(get_db)):
    try:
        print(f"📥 GET /equipos/{equipo_id} - Buscando equipo")
        equipo = db.query(Cronograma).filter(Cronograma.id == equipo_id).first()
        if equipo is None:
            print(f"❌ Equipo {equipo_id} no encontrado")
            return {"error": "Equipo no encontrado"}
        print(f"✅ Equipo encontrado: {equipo.equipo}")
        return equipo
    except Exception as e:
        print(f"❌ ERROR en GET /equipos/{equipo_id}: {str(e)}")
        return {"error": str(e)}

# ✏️ ENDPOINT PARA MODIFICAR (ACTUALIZADO)
@app.put("/equipos/{equipo_id}")
def modificar_equipo(equipo_id: int, equipo: EquipoCreate, db: Session = Depends(get_db)):
    try:
        print(f"📥 PUT /equipos/{equipo_id} - Modificando equipo")
        db_equipo = db.query(Cronograma).filter(Cronograma.id == equipo_id).first()
        if db_equipo is None:
            print(f"❌ Equipo {equipo_id} no encontrado")
            return {"error": "Equipo no encontrado"}
        
        # Actualizar cada campo
        db_equipo.equipo = equipo.equipo
        db_equipo.cliente = equipo.cliente
        db_equipo.ubicacion = equipo.ubicacion
        db_equipo.garantia_inicio = equipo.garantia_inicio
        db_equipo.garantia_fin = equipo.garantia_fin
        db_equipo.mtto_inicio = equipo.mtto_inicio
        db_equipo.mtto_fin = equipo.mtto_fin
        db_equipo.importado = equipo.importado
        db_equipo.nacionalizado = equipo.nacionalizado
        db_equipo.mtos_pendientes = equipo.mtos_pendientes
        db_equipo.mtos_realizados = equipo.mtos_realizados
        db_equipo.observaciones = equipo.observaciones
        
        db.commit()
        db.refresh(db_equipo)
        print(f"✅ Equipo {equipo_id} modificado correctamente")
        return db_equipo
    except Exception as e:
        print(f"❌ ERROR en PUT /equipos/{equipo_id}: {str(e)}")
        return {"error": str(e)}

# 🗑️ ENDPOINT PARA ELIMINAR
@app.delete("/equipos/{equipo_id}")
def eliminar_equipo(equipo_id: int, db: Session = Depends(get_db)):
    try:
        print(f"📥 DELETE /equipos/{equipo_id} - Eliminando equipo")
        equipo = db.query(Cronograma).filter(Cronograma.id == equipo_id).first()
        if equipo is None:
            print(f"❌ Equipo {equipo_id} no encontrado")
            return {"error": "Equipo no encontrado"}
        db.delete(equipo)
        db.commit()
        print(f"✅ Equipo {equipo_id} eliminado correctamente")
        return {"mensaje": "Equipo eliminado correctamente"}
    except Exception as e:
        print(f"❌ ERROR en DELETE /equipos/{equipo_id}: {str(e)}")
        return {"error": str(e)}

# ============================================
# ENDPOINT PARA GENERAR REPORTES PDF CON REPORTLAB
# ============================================
@app.post("/generar-reporte")
async def generar_reporte(datos: dict):
    """
    Recibe los datos del formulario y genera un PDF profesional usando ReportLab
    """
    try:
        # ===== DEPURACIÓN =====
        print("="*50)
        print("📥 DATOS RECIBIDOS EN EL BACKEND:")
        print(f"servicio_instalacion: {datos.get('servicio_instalacion')}")
        print(f"servicio_preventivo: {datos.get('servicio_preventivo')}")
        print(f"servicio_correctivo: {datos.get('servicio_correctivo')}")
        print(f"servicio_asesoria: {datos.get('servicio_asesoria')}")
        print(f"servicio_consulta: {datos.get('servicio_consulta')}")
        print(f"servicio_otros: {datos.get('servicio_otros')}")
        print(f"equipo_nuevo: {datos.get('equipo_nuevo')}")
        print(f"equipo_usado: {datos.get('equipo_usado')}")
        print(f"institucion: {datos.get('institucion')}")
        print(f"servicio_texto: {datos.get('servicio_texto')}")
        print(f"responsable_texto: {datos.get('responsable_texto')}")
        print(f"equipo_nombre: {datos.get('equipo_nombre')}")
        print(f"equipo_marca: {datos.get('equipo_marca')}")
        print(f"equipo_modelo: {datos.get('equipo_modelo')}")
        print(f"equipo_serie: {datos.get('equipo_serie')}")
        print("="*50)
        # ===== FIN DEPURACIÓN =====
        
        # Crear carpeta temporal si no existe
        os.makedirs("temp", exist_ok=True)
        
        # Nombre del archivo
        filename = f"reporte_{datos['numero_reporte']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join("temp", filename)
        
        # Crear el documento PDF
        doc = SimpleDocTemplate(filepath, pagesize=A4,
                               topMargin=1.5*cm, bottomMargin=1.5*cm,
                               leftMargin=2*cm, rightMargin=2*cm)
        
        elementos = []
        styles = getSampleStyleSheet()
        
        # Estilo para texto normal
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            leading=12,
            fontName='Helvetica'
        )
        
        # Estilo para texto en negrita
        bold_style = ParagraphStyle(
            'CustomBold',
            parent=styles['Normal'],
            fontSize=10,
            leading=12,
            fontName='Helvetica-Bold'
        )
        
        # Estilo para el número de reporte (ROJO)
        numero_reporte_style = ParagraphStyle(
            'NumeroReporte',
            parent=styles['Normal'],
            fontSize=14,
            alignment=1,  # Centro
            textColor=colors.HexColor('#ef4444'),  # ROJO
            spaceAfter=2,
            fontName='Helvetica-Bold'
        )
        
        # ===== ENCABEZADO CON LOGO =====
        try:
            from reportlab.platypus import Image
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            logo_path = os.path.join(base_dir, "frontend-web", "assets", "logo.png")
            
            if os.path.exists(logo_path):
                logo = Image(logo_path, width=140, height=50)
                logo.hAlign = 'LEFT'
            else:
                logo = Paragraph("<b>ADVANCED RADIOTHERAPY</b>", bold_style)
        except:
            logo = Paragraph("<b>ADVANCED RADIOTHERAPY</b>", bold_style)
        
        # Número de reporte (ROJO)
        numero_reporte = Paragraph(f"<b>{datos['numero_reporte']}</b>", numero_reporte_style)
        
        # Fecha, horas y días
        fecha_texto = Paragraph(f"<b>FECHA:</b> <font size=11><b>{datos['fecha']}</b></font>", normal_style)
        horas_texto = Paragraph(f"<b>HORAS:</b> <font size=11><b>{datos.get('horas', 'N/A')}</b></font>", normal_style)
        dias_texto = Paragraph(f"<b>DÍAS:</b> <font size=11><b>{datos.get('dias', 'N/A')}</b></font>", normal_style)
        
        # Creamos una tabla para la columna derecha
        info_derecha_data = [
            [numero_reporte],
            [fecha_texto],
            [horas_texto],
            [dias_texto]
        ]
        
        tabla_derecha = Table(info_derecha_data, colWidths=[320])
        tabla_derecha.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 25),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        
        # Tabla principal de encabezado
        encabezado_data = [[logo, tabla_derecha]]
        encabezado_tabla = Table(encabezado_data, colWidths=[180, 360])
        encabezado_tabla.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('RIGHTPADDING', (0, 0), (0, 0), 30),
        ]))
        elementos.append(encabezado_tabla)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ===== PRIMERA LÍNEA: TIPO DE SERVICIO =====
        servicios_texto = ""
        
        # Instalación
        if datos.get('servicio_instalacion'):
            servicios_texto += "⚫ INSTALACION    "
        else:
            servicios_texto += "⚪ INSTALACION    "
        
        # MTTO. PREVENTIVO
        if datos.get('servicio_preventivo'):
            servicios_texto += "⚫ MTTO. PREVENTIVO    "
        else:
            servicios_texto += "⚪ MTTO. PREVENTIVO    "
        
        # MTTO. CORRECTIVO
        if datos.get('servicio_correctivo'):
            servicios_texto += "⚫ MTTO. CORRECTIVO    "
        else:
            servicios_texto += "⚪ MTTO. CORRECTIVO    "
        
        # Asesoría
        if datos.get('servicio_asesoria'):
            servicios_texto += "⚫ Asesoría    "
        else:
            servicios_texto += "⚪ Asesoría    "
        
        # Consulta
        if datos.get('servicio_consulta'):
            servicios_texto += "⚫ Consulta    "
        else:
            servicios_texto += "⚪ Consulta    "
        
        # Otros
        if datos.get('servicio_otros'):
            servicios_texto += "⚫ Otros"
        else:
            servicios_texto += "⚪ Otros"
        
        servicios_para = Paragraph(servicios_texto, normal_style)
        elementos.append(servicios_para)
        elementos.append(Spacer(1, 0.3*cm))
        
        # ===== SEGUNDA LÍNEA: EQUIPO, NUEVO, USADO =====
        segunda_linea = "<b>Equipo</b>    "
        
        # Nuevo
        if datos.get('equipo_nuevo'):
            segunda_linea += "⚫ Nuevo    "
        else:
            segunda_linea += "⚪ Nuevo    "
        
        # Usado
        if datos.get('equipo_usado'):
            segunda_linea += "⚫ Usado"
        else:
            segunda_linea += "⚪ Usado"
        
        segunda_linea_para = Paragraph(segunda_linea, normal_style)
        elementos.append(segunda_linea_para)
        elementos.append(Spacer(1, 0.5*cm))
        
        # ===== Institución, Servicio, Responsable =====
        if datos.get('institucion') or datos.get('servicio_texto') or datos.get('responsable_texto'):
            inst_serv_resp = ""
            if datos.get('institucion'):
                inst_serv_resp += f"<b>Institución:</b> {datos['institucion']}    "
            if datos.get('servicio_texto'):
                inst_serv_resp += f"<b>Servicio:</b> {datos['servicio_texto']}    "
            if datos.get('responsable_texto'):
                inst_serv_resp += f"<b>Responsable:</b> {datos['responsable_texto']}"
            
            inst_serv_resp_para = Paragraph(inst_serv_resp, normal_style)
            elementos.append(inst_serv_resp_para)
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== Equipo, Marca, Modelo, Serie =====
        if datos.get('equipo_nombre') or datos.get('equipo_marca') or datos.get('equipo_modelo') or datos.get('equipo_serie'):
            equipo_detalle = ""
            if datos.get('equipo_nombre'):
                equipo_detalle += f"<b>Equipo:</b> {datos['equipo_nombre']}    "
            if datos.get('equipo_marca'):
                equipo_detalle += f"<b>Marca:</b> {datos['equipo_marca']}    "
            if datos.get('equipo_modelo'):
                equipo_detalle += f"<b>Modelo:</b> {datos['equipo_modelo']}    "
            if datos.get('equipo_serie'):
                equipo_detalle += f"<b>Serie:</b> {datos['equipo_serie']}"
            
            equipo_detalle_para = Paragraph(equipo_detalle, normal_style)
            elementos.append(equipo_detalle_para)
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== Comentarios (centrado) =====
        if datos.get('comentarios'):
            elementos.append(Paragraph("Comentarios", bold_style))
            elementos.append(Paragraph(datos['comentarios'], normal_style))
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== Descripción del Problema / Falla =====
        if datos.get('descripcion_problema'):
            elementos.append(Paragraph("<b>Descripción del Problema / Falla:</b>", bold_style))
            elementos.append(Paragraph(datos['descripcion_problema'], normal_style))
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== Accesorios y/o Partes =====
        if datos.get('accesorios'):
            elementos.append(Paragraph("<b>Accesorios y/o Partes:</b>", bold_style))
            elementos.append(Paragraph(datos['accesorios'], normal_style))
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== Observaciones =====
        if datos.get('observaciones'):
            elementos.append(Paragraph("<b>Observaciones:</b>", bold_style))
            elementos.append(Paragraph(datos['observaciones'], normal_style))
            elementos.append(Spacer(1, 0.3*cm))
        
        # ===== MATERIALES =====
        if datos.get('materiales') and len(datos['materiales']) > 0:
            elementos.append(Paragraph("<b>Materiales Utilizados</b>", bold_style))
            for mat in datos['materiales']:
                if mat.get('descripcion'):
                    material_texto = f"• {mat['descripcion']}"
                    if mat.get('cantidad'):
                        material_texto += f" (Cant: {mat['cantidad']})"
                    if mat.get('referencia'):
                        material_texto += f" - Ref: {mat['referencia']}"
                    elementos.append(Paragraph(material_texto, normal_style))
            elementos.append(Spacer(1, 0.2*cm))
        
        # ===== FIRMAS =====
        elementos.append(Spacer(1, 0.5*cm))
        
        firmas_data = [
            ["Responsable técnico", "OPR (Cuando aplique)", "Responsable de la Institución"],
            ["_________________________", "_________________________", "_________________________"],
            [datos.get('firma_tecnico', ''), datos.get('firma_opr', ''), ""]
        ]
        
        tabla_firmas = Table(firmas_data, colWidths=[166, 166, 166])
        tabla_firmas.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        elementos.append(tabla_firmas)
        
        # Construir el PDF
        doc.build(elementos)
        
        # Devolver el archivo
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generando PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# ============================================
# ENDPOINT: GENERAR PDF DESDE PLANTILLA HTML CON PDFKIT
# ============================================
@app.post("/generar-pdf-desde-plantilla")
async def generar_pdf_desde_plantilla(datos: dict):
    """
    Genera PDF usando plantilla HTML + datos con pdfkit
    """
    try:
        print("="*60)
        print("🔥 NUEVO ENDPOINT LLAMADO")
        print(f"Datos recibidos: {json.dumps(datos, indent=2)}")
        print("="*60)
        
        # Crear carpeta temporal si no existe
        os.makedirs("temp", exist_ok=True)
        
        # Cargar la plantilla
        template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "plantilla_reporte.html")
        
        if not os.path.exists(template_path):
            print(f"❌ ERROR: No se encuentra la plantilla en {template_path}")
            return {"error": "Plantilla no encontrada"}
        
        with open(template_path, 'r', encoding='utf-8') as f:
            template_html = f.read()
        
        # Crear template con Jinja2
        template = Template(template_html)
        
        # Preparar datos para los checkboxes
        datos_con_clases = {}
        for key, value in datos.items():
            datos_con_clases[key] = value
        
        # Agregar clases para los círculos de servicios
        servicios = ['instalacion', 'preventivo', 'correctivo', 'asesoria', 'consulta', 'otros']
        for servicio in servicios:
            key = f'servicio_{servicio}'
            if datos.get(key):
                datos_con_clases[f'{key}_marcado'] = 'marcado'
                datos_con_clases[f'{key}_clase'] = 'servicio-item marcado'
            else:
                datos_con_clases[f'{key}_marcado'] = 'no-marcado'
                datos_con_clases[f'{key}_clase'] = 'servicio-item'
        
        # Equipo nuevo/usado
        datos_con_clases['equipo_nuevo_marcado'] = 'marcado' if datos.get('equipo_nuevo') else 'no-marcado'
        datos_con_clases['equipo_usado_marcado'] = 'marcado' if datos.get('equipo_usado') else 'no-marcado'
        
        # Asegurar que los campos tengan valores por defecto
        campos_obligatorios = [
            'numero_reporte', 'fecha', 'horas', 'dias', 'tecnico',
            'institucion', 'servicio_texto', 'responsable_texto',
            'equipo_nombre', 'equipo_marca', 'equipo_modelo', 'equipo_serie',
            'comentarios', 'descripcion_problema', 'accesorios', 'observaciones',
            'firma_tecnico', 'firma_opr', 'firma_cliente'
        ]
        
        for campo in campos_obligatorios:
            if campo not in datos_con_clases or not datos_con_clases[campo]:
                datos_con_clases[campo] = ''
        
        # Materiales
        datos_con_clases['materiales'] = datos.get('materiales', [])
        
        # Renderizar HTML con los datos
        html_renderizado = template.render(**datos_con_clases)
        
        # Guardar HTML intermedio para depuración
        html_path = os.path.join("temp", f"reporte_{datos['numero_reporte']}.html")
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_renderizado)
        print(f"✅ HTML guardado en: {html_path}")
        
        # Configurar opciones para wkhtmltopdf
        options = {
            'page-size': 'A4',
            'margin-top': '1.5cm',
            'margin-right': '1.5cm',
            'margin-bottom': '1.5cm',
            'margin-left': '1.5cm',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None  # Permitir acceso a archivos locales (para el logo)
        }
        
        # Generar PDF
        pdf_path = os.path.join("temp", f"reporte_{datos['numero_reporte']}.pdf")
        print(f"📄 Generando PDF en: {pdf_path}")
        
        pdfkit.from_string(html_renderizado, pdf_path, options=options)
        print(f"✅ PDF generado correctamente")
        
        # Verificar que el PDF existe
        if os.path.exists(pdf_path):
            print(f"✅ PDF verificado: {os.path.getsize(pdf_path)} bytes")
        else:
            print(f"❌ ERROR: No se pudo crear el PDF")
            return {"error": "No se pudo crear el PDF"}
        
        # Devolver el PDF
        return FileResponse(
            path=pdf_path,
            filename=f"Reporte_{datos['numero_reporte']}.pdf",
            media_type='application/pdf'
        )
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# ============================================
# ENDPOINTS PARA PRODUCTOS
# ============================================
from models.producto import Producto

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
    precios: dict = {"USD": 0, "EUR": 0, "COP": 0, "VES": 0}
    iva_porcentaje: float = 19.0
    cantidad_stock: int = 0
    responsables: list = []
    descripcion: Optional[str] = ""
    imagen_url: Optional[str] = ""

@app.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    return productos

@app.post("/productos")
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = Producto(**producto.dict())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto

@app.get("/productos/{producto_id}")
def get_producto(producto_id: int, db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.id == producto_id).first()

@app.put("/productos/{producto_id}")
def modificar_producto(producto_id: int, producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = db.query(Producto).filter(Producto.id == producto_id).first()
    for key, value in producto.dict().items():
        setattr(db_producto, key, value)
    db.commit()
    db.refresh(db_producto)
    return db_producto

@app.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado"}


# ============================================
# ENDPOINT PARA SUBIR IMÁGENES
# ============================================
from fastapi import UploadFile, File
import shutil
import uuid

@app.post("/subir-imagen")
async def subir_imagen(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    extension = file.filename.split(".")[-1]
    nombre_archivo = f"{uuid.uuid4()}.{extension}"
    ruta_archivo = os.path.join("uploads", nombre_archivo)
    
    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    
    return {"imagen_url": f"/uploads/{nombre_archivo}"}
@app.get("/imagen/{nombre_archivo}")
async def get_imagen(nombre_archivo: str):
    from fastapi.responses import FileResponse
    ruta = os.path.join("uploads", nombre_archivo)
    if os.path.exists(ruta):
        return FileResponse(ruta)
    return {"error": "Imagen no encontrada"}

# ============================================
# MODELO Y ENDPOINTS PARA CLIENTES
# ============================================

class ClienteCreate(BaseModel):
    nombre: str
    identificacion: Optional[str] = ""
    email: Optional[str] = ""
    telefono: Optional[str] = ""
    direccion: Optional[str] = ""
    ciudad: Optional[str] = ""
    contacto: Optional[str] = ""
    asignado_a: Optional[str] = ""  # Comercial a cargo
    activo: bool = True
    notas: Optional[str] = ""

@app.get("/clientes")
def get_clientes(db: Session = Depends(get_db)):
    from models.cliente import Cliente
    clientes = db.query(Cliente).all()
    return clientes

@app.post("/clientes")
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    from models.cliente import Cliente
    db_cliente = Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@app.get("/clientes/{cliente_id}")
def get_cliente(cliente_id: int, db: Session = Depends(get_db)):
    from models.cliente import Cliente
    return db.query(Cliente).filter(Cliente.id == cliente_id).first()

@app.put("/clientes/{cliente_id}")
def modificar_cliente(cliente_id: int, cliente: ClienteCreate, db: Session = Depends(get_db)):
    from models.cliente import Cliente
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    for key, value in cliente.dict().items():
        setattr(db_cliente, key, value)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@app.delete("/clientes/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    from models.cliente import Cliente
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    db.delete(cliente)
    db.commit()
    return {"mensaje": "Cliente eliminado"}
# ============================================
# MODELO Y ENDPOINTS PARA COTIZACIONES
# ============================================
from models.cotizacion import Cotizacion
from datetime import date

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

@app.get("/cotizaciones")
def get_cotizaciones(db: Session = Depends(get_db)):
    cotizaciones = db.query(Cotizacion).all()
    return cotizaciones

@app.post("/cotizaciones")
def crear_cotizacion(cotizacion: CotizacionCreate, db: Session = Depends(get_db)):
    db_cotizacion = Cotizacion(**cotizacion.dict())
    db.add(db_cotizacion)
    db.commit()
    db.refresh(db_cotizacion)
    return db_cotizacion

@app.get("/cotizaciones/{cotizacion_id}")
def get_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    return db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()

@app.put("/cotizaciones/{cotizacion_id}")
def modificar_cotizacion(cotizacion_id: int, cotizacion: CotizacionCreate, db: Session = Depends(get_db)):
    db_cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    for key, value in cotizacion.dict().items():
        setattr(db_cotizacion, key, value)
    db.commit()
    db.refresh(db_cotizacion)
    return db_cotizacion

@app.delete("/cotizaciones/{cotizacion_id}")
def eliminar_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    db.delete(cotizacion)
    db.commit()
    return {"mensaje": "Cotización eliminada"}

# ============================================
# ENDPOINT PARA VER COTIZACIÓN (HTML)
# ============================================
from fastapi.responses import HTMLResponse
from jinja2 import Template

@app.get("/ver-cotizacion/{cotizacion_id}")
async def ver_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    cotizacion = db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        return {"error": "Cotización no encontrada"}
    
    # Plantilla HTML
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Cotización {{ cotizacion.numero_cotizacion }}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2cm; background: white; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 140px; }
            .numero { font-size: 24px; font-weight: bold; color: #ef4444; }
            .cliente-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f1f5f9; }
            .totales { text-align: right; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
            .total-final { font-size: 18px; font-weight: bold; color: #2563eb; }
            .condiciones { margin-top: 40px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            .firma { margin-top: 50px; text-align: right; }
            .btn-imprimir { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
            .btn-imprimir:hover { background: #1d4ed8; }
            @media print { .btn-imprimir { display: none; } }
        </style>
    </head>
    <body>
        <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        
        <div class="header">
            <img src="/assets/logo.png" class="logo">  <!-- ← CORREGIDO: ruta relativa -->
            <div class="numero">COTIZACIÓN {{ cotizacion.numero_cotizacion }}</div>
        </div>
        
        <div class="cliente-info">
            <h3>Cliente</h3>
            <p><strong>Nombre:</strong> {{ cotizacion.cliente_nombre }}</p>
            <p><strong>Fecha:</strong> {{ cotizacion.fecha_creacion }}</p>
            <p><strong>Válida hasta:</strong> {{ cotizacion.fecha_validez or 'No especificada' }}</p>
        </div>
        
        <h3>Productos</h3>
        <table>
            <thead>
                <tr><th>Producto</th><th>Referencia</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
                {% for p in cotizacion.productos %}
                <tr><td>{{ p.nombre }}</td><td>{{ p.referencia or '-' }}</td><td>{{ p.cantidad }}</td><td>${{ "%.2f"|format(p.precio_unitario) }}</td><td>${{ "%.2f"|format(p.subtotal) }}</td></tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="totales">
            <p><strong>Subtotal:</strong> ${{ "%.2f"|format(cotizacion.subtotal) }}</p>
            <p><strong>IVA (19%):</strong> ${{ "%.2f"|format(cotizacion.iva) }}</p>
            <p class="total-final"><strong>TOTAL:</strong> ${{ "%.2f"|format(cotizacion.total) }}</p>
        </div>
        
        {% if cotizacion.notas %}
        <div class="condiciones"><h4>Notas:</h4><p>{{ cotizacion.notas }}</p></div>
        {% endif %}
        
        {% if cotizacion.condiciones_generales %}
        <div class="condiciones"><h4>Condiciones Generales:</h4><p>{{ cotizacion.condiciones_generales }}</p></div>
        {% endif %}
        
        {% if cotizacion.firma_digital %}
        <div class="firma"><p><strong>Firma Digital:</strong></p><img src="http://localhost:8000{{ cotizacion.firma_digital }}" style="max-width: 150px; max-height: 80px;"></div>
        {% endif %}
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(cotizacion=cotizacion)
    
    return HTMLResponse(content=html_content)


# ============================================
# ENDPOINTS PARA PROPUESTAS COMERCIALES
# ============================================

class PropuestaCreate(BaseModel):
    numero_propuesta: str
    fecha_emision: date
    fecha_validez: Optional[date] = None
    cliente_id: Optional[int] = None
    cliente_nombre: str
    cliente_contacto: Optional[str] = ""
    cliente_email: Optional[str] = ""
    cliente_telefono: Optional[str] = ""
    cliente_direccion: Optional[str] = ""
    vendedor: Optional[str] = ""
    estado: str = "Borrador"
    subtotal: float = 0
    iva: float = 0
    total: float = 0
    productos: list = []
    notas: Optional[str] = ""
    terminos: Optional[str] = ""
    logo_personalizado: Optional[str] = None

@app.get("/propuestas")
def get_propuestas(db: Session = Depends(get_db)):
    try:
        from models.propuesta import Propuesta
        propuestas = db.query(Propuesta).all()
        return propuestas
    except Exception as e:
        print(f"Error en GET /propuestas: {e}")
        return []

@app.post("/propuestas")
def crear_propuesta(propuesta: PropuestaCreate, db: Session = Depends(get_db)):
    try:
        from models.propuesta import Propuesta
        import json
        db_propuesta = Propuesta(
            numero_propuesta=propuesta.numero_propuesta,
            fecha_emision=propuesta.fecha_emision,
            fecha_validez=propuesta.fecha_validez,
            cliente_id=propuesta.cliente_id,
            cliente_nombre=propuesta.cliente_nombre,
            cliente_contacto=propuesta.cliente_contacto,
            cliente_email=propuesta.cliente_email,
            cliente_telefono=propuesta.cliente_telefono,
            cliente_direccion=propuesta.cliente_direccion,
            vendedor=propuesta.vendedor,
            estado=propuesta.estado,
            subtotal=propuesta.subtotal,
            iva=propuesta.iva,
            total=propuesta.total,
            productos=json.dumps(propuesta.productos),
            notas=propuesta.notas,
            terminos=propuesta.terminos,
            logo_personalizado=propuesta.logo_personalizado
        )
        db.add(db_propuesta)
        db.commit()
        db.refresh(db_propuesta)
        return db_propuesta
    except Exception as e:
        print(f"Error en POST /propuestas: {e}")
        return {"error": str(e)}

@app.get("/propuestas/{propuesta_id}")
def get_propuesta(propuesta_id: int, db: Session = Depends(get_db)):
    try:
        from models.propuesta import Propuesta
        import json
        propuesta = db.query(Propuesta).filter(Propuesta.id == propuesta_id).first()
        if propuesta:
            # Convertir productos de JSON string a lista
            if propuesta.productos:
                propuesta.productos = json.loads(propuesta.productos)
        return propuesta
    except Exception as e:
        print(f"Error en GET /propuestas/{propuesta_id}: {e}")
        return {"error": str(e)}

@app.put("/propuestas/{propuesta_id}")
def modificar_propuesta(propuesta_id: int, propuesta: PropuestaCreate, db: Session = Depends(get_db)):
    try:
        from models.propuesta import Propuesta
        import json
        db_propuesta = db.query(Propuesta).filter(Propuesta.id == propuesta_id).first()
        if db_propuesta is None:
            return {"error": "Propuesta no encontrada"}
        
        db_propuesta.numero_propuesta = propuesta.numero_propuesta
        db_propuesta.fecha_emision = propuesta.fecha_emision
        db_propuesta.fecha_validez = propuesta.fecha_validez
        db_propuesta.cliente_id = propuesta.cliente_id
        db_propuesta.cliente_nombre = propuesta.cliente_nombre
        db_propuesta.cliente_contacto = propuesta.cliente_contacto
        db_propuesta.cliente_email = propuesta.cliente_email
        db_propuesta.cliente_telefono = propuesta.cliente_telefono
        db_propuesta.cliente_direccion = propuesta.cliente_direccion
        db_propuesta.vendedor = propuesta.vendedor
        db_propuesta.estado = propuesta.estado
        db_propuesta.subtotal = propuesta.subtotal
        db_propuesta.iva = propuesta.iva
        db_propuesta.total = propuesta.total
        db_propuesta.productos = json.dumps(propuesta.productos)
        db_propuesta.notas = propuesta.notas
        db_propuesta.terminos = propuesta.terminos
        db_propuesta.logo_personalizado = propuesta.logo_personalizado
        
        db.commit()
        db.refresh(db_propuesta)
        return db_propuesta
    except Exception as e:
        print(f"Error en PUT /propuestas/{propuesta_id}: {e}")
        return {"error": str(e)}

@app.delete("/propuestas/{propuesta_id}")
def eliminar_propuesta(propuesta_id: int, db: Session = Depends(get_db)):
    try:
        from models.propuesta import Propuesta
        propuesta = db.query(Propuesta).filter(Propuesta.id == propuesta_id).first()
        if propuesta is None:
            return {"error": "Propuesta no encontrada"}
        db.delete(propuesta)
        db.commit()
        return {"mensaje": "Propuesta eliminada correctamente"}
    except Exception as e:
        print(f"Error en DELETE /propuestas/{propuesta_id}: {e}")
        return {"error": str(e)}