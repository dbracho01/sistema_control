from sqlalchemy import Column, Integer, String, Date, Text, Boolean
from database.db import Base

class Cronograma(Base):
    __tablename__ = "cronogramas"

    id = Column(Integer, primary_key=True, index=True)

    cliente = Column(String(150), nullable=False)
    equipo = Column(String(150), nullable=False)
    ubicacion = Column(String(150), nullable=False)

    garantia_inicio = Column(Date, nullable=False)
    garantia_fin = Column(Date, nullable=False)

    # CAMBIADO: mantenimiento_inicio -> mtto_inicio
    mtto_inicio = Column(Date, nullable=True)
    mtto_fin = Column(Date, nullable=True)

    # NUEVOS CAMPOS
    importado = Column(Boolean, default=False, nullable=True)
    nacionalizado = Column(Boolean, default=False, nullable=True)
    mtos_pendientes = Column(Integer, default=0, nullable=True)
    mtos_realizados = Column(Integer, default=0, nullable=True)

    observaciones = Column(Text, nullable=True)
