from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, date
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