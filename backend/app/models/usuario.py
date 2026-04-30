from sqlalchemy import Column, Integer, String, Boolean
from database.db import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    nombre_completo = Column(String(100), nullable=True)
    activo = Column(Boolean, default=True)
    
    # Permisos de módulos
    permiso_cronograma = Column(Boolean, default=False)
    permiso_reportes = Column(Boolean, default=False)
    permiso_cotizaciones = Column(Boolean, default=False)
    permiso_clientes = Column(Boolean, default=False)
    permiso_productos = Column(Boolean, default=False)
    permiso_propuestas = Column(Boolean, default=False)
    permiso_usuarios = Column(Boolean, default=False)  # Solo administradores
