cd ~/Escritorio/sistema_control/frontend-web && cat > validar_permisos.js << 'EOF'
// validar_permisos.js - Control central de autenticación y permisos

const API_URL = 'http://localhost:8000';

// Obtener datos del usuario logueado
function getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// Obtener token
function getToken() {
    return localStorage.getItem('token');
}

// Verificar si está autenticado
function isAuthenticated() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Verificar si tiene permiso para un módulo específico
function hasPermission(modulo) {
    const usuario = getUsuario();
    if (!usuario) return false;
    if (usuario.username === 'admin') return true;
    return usuario.permisos?.[modulo] || false;
}

// Aplicar permisos a los botones del menú
function applyPermissionsToTabs() {
    const usuario = getUsuario();
    if (!usuario) return;
    
    const permisoMap = {
        'Cronograma': 'cronograma',
        'Reportes': 'reportes',
        'Cotizaciones': 'cotizaciones',
        'Clientes': 'clientes',
        'Productos': 'productos',
        'Propuestas': 'propuestas',
        'Admin': 'usuarios'
    };
    
    document.querySelectorAll('.tab').forEach(tab => {
        const texto = tab.textContent.trim();
        
        // Siempre mostrar el botón de Cerrar Sesión
        if (texto.includes('Cerrar') || texto.includes('🔒')) {
            tab.style.display = 'inline-flex';
            return;
        }
        
        // Admin solo si tiene permiso
        if (texto === 'Admin') {
            if (!usuario.permisos?.usuarios && usuario.username !== 'admin') {
                tab.style.display = 'none';
            }
            return;
        }
        
        // Otros botones
        let mostrar = false;
        for (const [nombreModulo, permisoKey] of Object.entries(permisoMap)) {
            if (texto.includes(nombreModulo)) {
                mostrar = usuario.permisos?.[permisoKey] === true || usuario.username === 'admin';
                break;
            }
        }
        
        if (!mostrar) {
            tab.style.display = 'none';
        }
    });
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Inicializar validación
function initPage(moduloRequerido) {
    if (!isAuthenticated()) return false;
    
    // Si no tiene permiso, simplemente no hace nada (no muestra error, no redirige)
    if (moduloRequerido && !hasPermission(moduloRequerido)) {
        return false;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() { applyPermissionsToTabs(); }, 100);
        });
    } else {
        setTimeout(function() { applyPermissionsToTabs(); }, 100);
    }
    
    return true;

EOF
