from sqlalchemy import Column, Integer, String, Boolean, Text
from database.db import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    identificacion = Column(String(50))
    email = Column(String(100))
    telefono = Column(String(50))
    direccion = Column(String(200))
    ciudad = Column(String(100))
    contacto = Column(String(100))
    asignado_a = Column(String(100))  # Comercial a cargo
    activo = Column(Boolean, default=True)
    notas = Column(Text)
