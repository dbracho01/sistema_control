from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON
from database.db import Base

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Información básica
    nombre_producto = Column(String(200), nullable=False)
    numero_pieza = Column(String(100))
    transporte = Column(String(100))
    seguro = Column(String(100))
    valor_fob = Column(Float)
    
    # Categoría
    tipo_producto = Column(String(50))  # "producto" o "accesorio"
    linea = Column(String(50))  # ninguno, radiologia, cardiologia, dosimetria, radioterapia, neurologia, medicina nuclear
    referencia = Column(String(100))
    activo = Column(Boolean, default=True)
    
    # Precios (JSON para múltiples monedas)
    precios = Column(JSON)  # {"USD": 0, "EUR": 0, "COP": 0, "VES": 0}
    iva_porcentaje = Column(Float, default=19.0)
    
    # Stock
    cantidad_stock = Column(Integer, default=0)
    responsables = Column(JSON, default=[])  # Lista de nombres de responsables
    
    # Descripción
    descripcion = Column(Text)
    
    # Imagen
    imagen_url = Column(String(500))
