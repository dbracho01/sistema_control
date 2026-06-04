from sqlalchemy import Column, Integer, String, Boolean, Text
from database.db import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)

    # Información básica
    nombre = Column(String(200), nullable=False)
    identificacion = Column(String(50), unique=True, nullable=True)

    # Contacto
    email = Column(String(100), nullable=True)
    telefono = Column(String(50), nullable=True)
    direccion = Column(String(200), nullable=True)
    ciudad = Column(String(100), nullable=True)

    # Comercial
    contacto = Column(String(100), nullable=True)
    asignado_a = Column(String(100), nullable=True)

    # Estado
    activo = Column(Boolean, default=True)

    # Extras
    notas = Column(Text, nullable=True)
