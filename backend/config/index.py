# ==========================================
# config/index.py
# ==========================================
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Variables de entorno base
    ENV: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Tus otras claves y variables (Base de datos, JWT, APIs externas, etc.)
    # Puedes ponerles valores por defecto para desarrollo local
    SECRET_KEY: str = "x1jZT1bcEkYVKFrlq2LUNoO"
    ALGORITHM: str = "HS256"
    TOKEN_EXPIRE_MINUTES: int = 480
    
    # Busca automáticamente el archivo .env
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()