# 🏥 Sistema de Gestión ART - Software Administrativo para Equipos Médicos

## 📋 Descripción General

Sistema web completo para la gestión de equipos médicos, que incluye:

- ✅ **Cronograma de mantenimiento** con dashboard de estadísticas
- ✅ **CRUD completo** de equipos, clientes, productos y cotizaciones
- ✅ **Generación de reportes PDF** profesionales con ReportLab
- ✅ **Módulo de propuestas comerciales** (en desarrollo)
- ✅ **Firma digital** integración pendiente con DocuSeal (self-hosted)

## 🏗️ Arquitectura Actual
Frontend (HTML/CSS/JS) → Backend (FastAPI) → Base de Datos (SQLite)
↓ ↓
Reportes.html Plantillas Jinja2
↓ ↓
Formularios PDF (ReportLab)

text

## 📁 Estructura del Proyecto
sistema_control/
├── backend/
│ ├── app/
│ │ ├── main.py # API principal (FastAPI)
│ │ ├── models/ # Modelos SQLAlchemy
│ │ │ ├── cronograma.py
│ │ │ ├── cliente.py
│ │ │ ├── producto.py
│ │ │ ├── cotizacion.py
│ │ │ └── propuesta.py
│ │ ├── database/
│ │ │ └── db.py # Conexión a BD
│ │ └── uploads/ # Imágenes subidas
│ └── templates/
│ └── plantilla_reporte.html
├── frontend-web/
│ ├── index.html # Cronograma principal
│ ├── clientes.html # Gestión de clientes
│ ├── cotizaciones.html # Gestión de cotizaciones
│ ├── productos.html # Gestión de productos
│ ├── reportes.html # Generación de reportes
│ ├── propuestas.html # Propuestas comerciales
│ ├── style.css # Estilos globales
│ ├── script.js # Lógica principal
│ └── assets/
│ └── logo.png
├── venv/ # Entorno virtual (no se sube a Git)
├── .gitignore
├── requirements.txt
└── README.md

text

## 🚀 Funcionalidades Implementadas

### ✅ Módulos Completos

| Módulo | Estado | Características |
|--------|--------|-----------------|
| **Cronograma** | ✅ 100% | Tabla de equipos, dashboard, paginación, modal de detalles |
| **Clientes** | ✅ 100% | CRUD completo, búsqueda, paginación, botones elegantes |
| **Productos** | ✅ 100% | CRUD, precios múltiples monedas, stock, responsables |
| **Cotizaciones** | ✅ 100% | CRUD, productos dinámicos, cálculo de IVA, firma digital |
| **Reportes PDF** | ✅ 100% | Generación con ReportLab, campos dinámicos, formato profesional |
| **Propuestas** | ⏳ 80% | Listado, tarjetas, formulario modal (falta integración firma) |

### 🎨 Diseño y Estilos

- **Botones elegantes**: Gradientes, sombras, efectos hover (azul, naranja, rojo)
- **Tabs navegación**: Mismo estilo en todos los módulos
- **Logo fijo**: Esquina superior izquierda en todas las páginas
- **Responsive**: Tablas adaptables, paginación
- **Modales**: Para ver detalles de equipos, clientes, cotizaciones

### 📊 Dashboard (Sidebar)

- Equipos en garantía (verde)
- Próximos a vencer (amarillo)
- Garantías vencidas (rojo)

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Python** | 3.13 | Backend |
| **FastAPI** | 0.115.6 | API REST |
| **SQLAlchemy** | 2.0.36 | ORM |
| **SQLite** | - | Base de datos |
| **Uvicorn** | 0.34.0 | Servidor ASGI |
| **ReportLab** | 4.2.5 | Generación PDF |
| **Jinja2** | 3.1.4 | Plantillas HTML |
| **HTML5/CSS3** | - | Frontend |
| **JavaScript** | ES6 | Lógica cliente |

## 📦 Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/dbracho01/sistema_control.git
cd sistema_control
2. Crear entorno virtual
bash
python3 -m venv venv
source venv/bin/activate
3. Instalar dependencias
bash
pip install -r requirements.txt
4. Configurar base de datos
bash
cd backend/app
python3 -c "from database.db import Base, engine; Base.metadata.create_all(bind=engine)"
5. Levantar el backend
bash
cd backend/app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
6. Levantar el frontend (otra terminal)
bash
cd frontend-web
python3 -m http.server 5500
7. Acceder al sistema
text
http://localhost:5500/index.html
🔄 Comandos Rápidos
Backend
bash
cd ~/Escritorio/sistema_control/backend/app && source ~/Escritorio/sistema_control/venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000
Frontend
bash
cd ~/Escritorio/sistema_control/frontend-web && python3 -m http.server 5500
🐛 Problemas Conocidos
Problema	Estado	Solución
Logo no aparece en PDFs	✅ Resuelto	Montar assets estáticos en FastAPI
Botones sin colores	✅ Resuelto	Agregar clases .btn-accion.ver/editar/eliminar
Vista previa en propuestas	⏳ Pendiente	Eliminar o rediseñar
Firma digital	📋 Planificado	Integrar DocuSeal self-hosted
📋 Pendientes
Eliminar vista previa en vivo del formulario de propuestas

Integrar DocuSeal para firmas digitales (self-hosted)

Desplegar en servidor Hetzner

Configurar dominio propio (artcorporationsa.com)

Agregar autenticación de usuarios

Reportes avanzados con gráficos

📊 Estado de la Base de Datos
Tabla	Estado	Registros (ejemplo)
cronograma	✅ Activa	Equipos médicos
clientes	✅ Activa	Información de clientes
productos	✅ Activa	Catálogo de productos
cotizaciones	✅ Activa	Cotizaciones generadas
propuestas	✅ Activa	Propuestas comerciales
🔐 Git y Repositorio
Repositorio: https://github.com/dbracho01/sistema_control

Rama principal: main

Tamaño del código fuente: ~3.3 MB (sin incluir venv, BD, uploads)

Archivos ignorados (.gitignore)
text
venv/
__pycache__/
*.pyc
*.db
*.sqlite
temp/
uploads/
.env
*.log
*.backup
*.save
.DS_Store
🚀 Próximos Pasos
Desplegar en Hetzner VPS

Configurar dominio (artcorporationsa.com)

Integrar DocuSeal para firmas (self-hosted)

Mejorar módulo de propuestas

Agregar reportes con gráficos

👨‍💻 Autor
Desarrollador: David Bracho

Empresa: Advanced Radiotherapy Corporation

Email: servicio.tecnico1@artcorporationsa.com

📄 Licencia
Privado - Uso interno de Advanced Radiotherapy Corporation

Última actualización: Abril 2026

text

## 📝 Cómo crear el archivo:

```bash
cd ~/Escritorio/sistema_control
nano README.md
Pega todo el contenido de arriba (Ctrl + Shift + V), luego guarda:

Ctrl + O (guardar)

Enter (confirmar)

Ctrl + X (salir)

🔄 Subir a GitHub:
bash
git add README.md
git commit -m "Actualizar README con resumen completo del sistema"
git push
