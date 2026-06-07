# Tus importaciones locales
from models.usuario import Usuario
from database.db import SessionLocal  
from schemas.index import *
from functions.auth import *


def inicializar_admin():
    # SOLUCIÓN: Usamos SessionLocal() directamente, NO Depends
    db = SessionLocal()
    
    try:
        # Buscamos si existe el usuario admin
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        
        # Si NO existe, lo creamos con datos básicos
        if not admin:
            admin_por_defecto = Usuario(
                username="admin",
                email="admin@correo.com",
                password_hash=hash_password("123456"),  # Usa tu función de hash
                nombre_completo="Admin General",
                activo=True,
                # Te recomiendo dejar todos sus permisos en True por ser el primer admin
                permiso_cronograma=True,
                permiso_reportes=True,
                permiso_cotizaciones=True,
                permiso_clientes=True,
                permiso_productos=True,
                permiso_propuestas=True,
                permiso_usuarios=True  
            )
            db.add(admin_por_defecto)
            db.commit()
            print("✅ Usuario 'admin' registrado con éxito de forma automática.")
        else:
            print("ℹ️ El usuario 'admin' ya existe en la base de datos.")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error al intentar crear el admin: {e}")
        
    finally:
        # Cerramos la sesión de forma segura
        db.close()