from sqlalchemy import Column, Integer, String, Float, Date, Text, JSON
from database.db import Base

class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id = Column(Integer, primary_key=True, index=True)
    numero_cotizacion = Column(String(50), unique=True, nullable=False)
    fecha_creacion = Column(Date, nullable=False)
    fecha_validez = Column(Date, nullable=True)
    cliente_id = Column(Integer, nullable=True)
    cliente_nombre = Column(String(200), nullable=False)
    estado = Column(String(50), default="Pendiente")
    subtotal = Column(Float, default=0)
    iva = Column(Float, default=0)
    total = Column(Float, default=0)
    productos = Column(JSON, default=[])
    notas = Column(Text, default="")
    condiciones_generales = Column(Text, default="")
    firma_digital = Column(String(500), default="")
