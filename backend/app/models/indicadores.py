from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey, Text
from database.db import Base

class Intervencion(Base):
    __tablename__ = "intervenciones"
    
    id = Column(Integer, primary_key=True, index=True)
    equipo_id = Column(Integer, ForeignKey("cronogramas.id"), nullable=False)
    reporte_id = Column(Integer, nullable=True)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(String(10), nullable=False)
    hora_fin = Column(String(10), nullable=False)
    tipo_intervencion = Column(String(50))
    descripcion = Column(Text)
    tecnico = Column(String(100))
    horas_parada = Column(Float, default=0)
    costo_mano_obra = Column(Float, default=0)
    costo_repuestos = Column(Float, default=0)
    costo_total = Column(Float, default=0)
    ingreso_generado = Column(Float, default=0)
    ahorro_fallos = Column(Float, default=0)
    completado = Column(Integer, default=0)

class IndicadorMensual(Base):
    __tablename__ = "indicadores_mensuales"
    
    id = Column(Integer, primary_key=True, index=True)
    equipo_id = Column(Integer, ForeignKey("cronogramas.id"), nullable=False)
    año = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    
    tiempo_medio_fallo = Column(Float, default=0)
    tiempo_medio_reparacion = Column(Float, default=0)
    tiempo_medio_fuera_servicio = Column(Float, default=0)
    tiempo_medio_en_servicio = Column(Float, default=0)
    tasa_fallo = Column(Float, default=0)
    disponibilidad = Column(Float, default=0)
    roi_mantenimiento = Column(Float, default=0)
    beneficio_total = Column(Float, default=0)
    inversion_total = Column(Float, default=0)
    
    total_horas_operacion = Column(Float, default=0)
    total_horas_parada = Column(Float, default=0)
    num_intervenciones = Column(Integer, default=0)
    costo_total_mantenimiento = Column(Float, default=0)
    ingresos_generados = Column(Float, default=0)
    ahorros_generados = Column(Float, default=0)
