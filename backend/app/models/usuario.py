from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from database.db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    # =========================
    # IDENTIFICACIÓN
    # =========================
    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    nombre_completo = Column(
        String(150),
        nullable=True
    )

    activo = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # =========================
    # PERMISOS
    # =========================
    permiso_cronograma = Column(Boolean, default=False, nullable=False)
    permiso_reportes = Column(Boolean, default=False, nullable=False)
    permiso_cotizaciones = Column(Boolean, default=False, nullable=False)
    permiso_clientes = Column(Boolean, default=False, nullable=False)
    permiso_productos = Column(Boolean, default=False, nullable=False)
    permiso_propuestas = Column(Boolean, default=False, nullable=False)
    permiso_usuarios = Column(Boolean, default=False, nullable=False)

    # =========================
    # FECHAS
    # =========================
    fecha_creacion = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    fecha_actualizacion = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # =========================
    # REPRESENTACIÓN
    # =========================
    def __repr__(self):
        return f"<Usuario(id={self.id}, username='{self.username}')>"
