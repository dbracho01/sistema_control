from database.db import engine
from models.indicadores import Intervencion, IndicadorMensual

print("Creando tablas de indicadores...")
Intervencion.__table__.create(engine, checkfirst=True)
IndicadorMensual.__table__.create(engine, checkfirst=True)
print("✅ Tablas de indicadores creadas exitosamente")
