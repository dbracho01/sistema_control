from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    Text,
    JSON,
    DateTime
)

from sqlalchemy.sql import func

from database.db import Base


class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    # =========================
    # IDENTIFICACIÓN
    # =========================
    id = Column(Integer, primary_key=True, index=True)

    numero_cotizacion = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    # =========================
    # FECHAS
    # =========================
    fecha_creacion = Column(
        Date,
        nullable=False
    )

    fecha_validez = Column(
        Date,
        nullable=True
    )

    # =========================
    # CLIENTE
    # =========================
    cliente_id = Column(
        Integer,
        nullable=True
    )

    cliente_nombre = Column(
        String(200),
        nullable=False,
        index=True
    )

    # =========================
    # ESTADO
    # =========================
    estado = Column(
        String(50),
        default="Pendiente",
        nullable=False
    )

    # =========================
    # TOTALES
    # =========================
    subtotal = Column(
        Float,
        default=0,
        nullable=False
    )

    iva = Column(
        Float,
        default=0,
        nullable=False
    )

    total = Column(
        Float,
        default=0,
        nullable=False
    )

    # =========================
    # PRODUCTOS
    # =========================
    productos = Column(
        JSON,
        default=list,
        nullable=False
    )

    # =========================
    # INFORMACIÓN ADICIONAL
    # =========================
    notas = Column(
        Text,
        default="",
        nullable=True
    )

    condiciones_generales = Column(
        Text,
        default="",
        nullable=True
    )

    firma_digital = Column(
        String(500),
        default="",
        nullable=True
    )

    # =========================
    # TIMESTAMPS
    # =========================
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # =========================
    # REPRESENTACIÓN
    # =========================
    def __repr__(self):
        return f"<Cotizacion(id={self.id}, numero='{self.numero_cotizacion}')>"
