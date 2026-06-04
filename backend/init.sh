#!/bin/bash

# --- Configuración ---
VENV_DIR=".venv"
REQ_FILE="requirements.txt"
APP_MODULE="main:app" # Cambia 'main' por el nombre de tu archivo principal si es diferente
HOST="127.0.0.1"
PORT="8000"

echo "🚀 Iniciando el proceso de arranque de FastAPI..."

# 1. Verificar o crear el entorno virtual
if [ -d "$VENV_DIR" ]; then
    echo "📦 Entorno virtual detectado. Activando..."
    source "$VENV_DIR/bin/activate"
else
    echo "✨ No se encontró el entorno virtual. Creando uno nuevo en '$VENV_DIR'..."
    python3 -m venv "$VENV_DIR"
    
    if [ $? -eq 0 ]; then
        echo "✅ Entorno virtual creado con éxito. Activando..."
        source "$VENV_DIR/bin/activate"
    else
        echo "❌ Error crítico: No se pudo crear el entorno virtual. Asegúrate de tener python3-venv instalado."
        exit 1
    fi
fi

# 2. Instalar o actualizar dependencias si existe requirements.txt
if [ -f "$REQ_FILE" ]; then
    echo "⏳ Instalando/Actualizando dependencias desde $REQ_FILE..."
    pip install --upgrade pip
    pip install -r "$REQ_FILE"
else
    echo "⚠️ Advertencia: No se encontró el archivo $REQ_FILE. Saltando instalación de dependencias."
fi

# 3. Arrancar el servidor Uvicorn
echo "🔥 Arrancando Uvicorn en http://$HOST:$PORT..."
uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT" --reload
