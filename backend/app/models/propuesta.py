from sqlalchemy import Column, Integer, String, Float, Date, Text
from database.db import Base

class Propuesta(Base):
    __tablename__ = "propuestas"
    
    id = Column(Integer, primary_key=True, index=True)
    numero_propuesta = Column(String(50), nullable=False, unique=True)
    fecha_emision = Column(Date, nullable=False)
    fecha_validez = Column(Date, nullable=True)
    cliente_id = Column(Integer, nullable=True)
    cliente_nombre = Column(String(200), nullable=False)
    cliente_contacto = Column(String(100), nullable=True)
    cliente_email = Column(String(100), nullable=True)
    cliente_telefono = Column(String(50), nullable=True)
    cliente_direccion = Column(String(200), nullable=True)
    vendedor = Column(String(100), nullable=True)
    estado = Column(String(20), default="Borrador")
    subtotal = Column(Float, default=0)
    iva = Column(Float, default=0)
    total = Column(Float, default=0)
    productos = Column(Text, default="[]")  # Almacenar como JSON string
    notas = Column(Text, nullable=True)
    terminos = Column(Text, nullable=True)
    logo_personalizado = Column(Text, nullable=True)  # Base64