const API_URL = 'http://127.0.0.1:8001';

// Variables para paginación
let todosLosEquipos = [];
let paginaActual = 1;
const equiposPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    cargarEquipos();
    
    // Configurar cierre del modal
    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('detalleModal');
        if (e.target === modal) cerrarModal();
    });
    
    // Eventos de paginación
    document.getElementById('prevPage').addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarPagina();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPaginas = Math.ceil(todosLosEquipos.length / equiposPorPagina);
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarPagina();
        }
    });
});

// Variable para controlar si estamos editando
let equipoEnEdicion = null;

// Evento para guardar o actualizar equipo
document.getElementById('equipoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const hoy = new Date();
    const fechaActual = hoy.toISOString().split('T')[0];
    
    const equipo = {
        equipo: document.getElementById('equipo').value,
        cliente: document.getElementById('cliente').value,
        ubicacion: document.getElementById('ubicacion').value,
        garantia_inicio: fechaActual,
        garantia_fin: document.getElementById('garantia_fin').value,
        mantenimiento_inicio: document.getElementById('mantenimiento').value || null,
        mantenimiento_fin: null,
        observaciones: document.getElementById('observaciones').value || ''
    };

    try {
        let response;
        if (equipoEnEdicion) {
            response = await fetch(`${API_URL}/equipos/${equipoEnEdicion}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(equipo)
            });
        } else {
            response = await fetch(`${API_URL}/equipos`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(equipo)
            });
        }

        if (response.ok) {
            alert(equipoEnEdicion ? '✅ Equipo actualizado' : '✅ Equipo guardado');
            document.getElementById('equipoForm').reset();
            equipoEnEdicion = null;
            document.querySelector('.btn-guardar').textContent = 'Guardar Equipo';
            await cargarEquipos();
            paginaActual = 1;
            renderizarPagina();
        } else {
            const error = await response.json();
            alert('❌ Error: ' + JSON.stringify(error.detail || error));
        }
    } catch (error) {
        alert('❌ Error de conexión');
        console.error(error);
    }
});

async function cargarEquipos() {
    try {
        const response = await fetch(`${API_URL}/equipos`);
        todosLosEquipos = await response.json();
        
        // Actualizar estadísticas
        let stats = { vigente: 0, proximo: 0, vencido: 0 };
        
        todosLosEquipos.forEach(equipo => {
            const diasGarantia = calcularDiasRestantes(equipo.garantia_fin);
            if (diasGarantia < 0) stats.vencido++;
            else if (diasGarantia <= 30) stats.proximo++;
            else stats.vigente++;
        });

        document.getElementById('stats-vigente').textContent = stats.vigente;
        document.getElementById('stats-proximo').textContent = stats.proximo;
        document.getElementById('stats-vencido').textContent = stats.vencido;
        
        // Renderizar primera página
        paginaActual = 1;
        renderizarPagina();
        
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        document.getElementById('cronogramaBody').innerHTML = 
            '<tr><td colspan="9" class="loading">❌ Error al cargar equipos</td></tr>';
    }
}

function renderizarPagina() {
    const tbody = document.getElementById('cronogramaBody');
    const totalPaginas = Math.ceil(todosLosEquipos.length / equiposPorPagina);
    
    if (todosLosEquipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No hay equipos registrados</td></tr>';
        actualizarPaginacion(0, 0);
        return;
    }
    
    const inicio = (paginaActual - 1) * equiposPorPagina;
    const fin = Math.min(inicio + equiposPorPagina, todosLosEquipos.length);
    const equiposPagina = todosLosEquipos.slice(inicio, fin);
    
    tbody.innerHTML = '';
    equiposPagina.forEach(equipo => {
        const fila = crearFilaEquipo(equipo);
        tbody.appendChild(fila);
    });
    
    actualizarPaginacion(inicio + 1, fin, todosLosEquipos.length);
    renderizarNumerosPagina(totalPaginas);
}

function actualizarPaginacion(inicio, fin, total) {
    document.getElementById('paginationInfo').textContent = 
        total === 0 ? 'Mostrando 0-0 de 0 equipos' : `Mostrando ${inicio}-${fin} de ${total} equipos`;
    
    document.getElementById('prevPage').disabled = paginaActual === 1;
    document.getElementById('nextPage').disabled = paginaActual === Math.ceil(todosLosEquipos.length / equiposPorPagina);
}

function renderizarNumerosPagina(totalPaginas) {
    const container = document.getElementById('paginationNumbers');
    container.innerHTML = '';
    
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-number ${i === paginaActual ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            paginaActual = i;
            renderizarPagina();
        };
        container.appendChild(btn);
    }
}

// Las funciones crearFilaEquipo, editarEquipo, eliminarEquipo, verDetalle, etc.
// se mantienen IGUAL que en el código anterior

function crearFilaEquipo(equipo) {
    const tr = document.createElement('tr');
    
    const diasGarantia = calcularDiasRestantes(equipo.garantia_fin);
    const estadoGarantia = getEstadoGarantia(diasGarantia);
    
    const diasManto = calcularDiasRestantes(equipo.mantenimiento_inicio);
    let claseManto = '';
    let tooltipManto = '';
    
    if (diasManto < 0) {
        claseManto = 'urgente';
        tooltipManto = '⚠️ Mantenimiento vencido';
    } else if (diasManto <= 7) {
        claseManto = 'proximo';
        tooltipManto = `🔔 Vence en ${diasManto} días`;
    } else if (diasManto === 999) {
        tooltipManto = '📅 No programado';
    } else {
        tooltipManto = `📅 Próximo: ${diasManto} días`;
    }
    
    const observaciones = equipo.observaciones ? 
        (equipo.observaciones.length > 30 ? 
            equipo.observaciones.substring(0, 30) + '...' : 
            equipo.observaciones) : '-';
    
    tr.innerHTML = `
        <td>${equipo.id || ''}</td>
        <td><strong>${equipo.equipo || ''}</strong></td>
        <td>${equipo.cliente || ''}</td>
        <td>${equipo.ubicacion || ''}</td>
        <td>${equipo.garantia_fin ? new Date(equipo.garantia_fin).toLocaleDateString('es-ES') : ''}</td>
        <td><span class="estado-garantia ${estadoGarantia.clase}">${estadoGarantia.texto}</span></td>
        <td>
            <span class="fecha-manto ${claseManto}" data-tooltip="${tooltipManto}">
                ${equipo.mantenimiento_inicio ? new Date(equipo.mantenimiento_inicio).toLocaleDateString('es-ES') : '📅 No programado'}
            </span>
        </td>
        <td class="observaciones-cell" title="${equipo.observaciones || ''}">
            ${observaciones}
        </td>
        <td>
            <button class="btn-accion editar" onclick="editarEquipo(${equipo.id})">✏️ Editar</button>
            <button class="btn-accion eliminar" onclick="eliminarEquipo(${equipo.id})">🗑️ Eliminar</button>
            <button class="btn-accion ver" onclick="verDetalle(${equipo.id})">👁️ Ver</button>
        </td>
    `;
    
    return tr;
}

// Funciones auxiliares (se mantienen igual)
async function editarEquipo(id) {
    try {
        const response = await fetch(`${API_URL}/equipos/${id}`);
        const equipo = await response.json();
        
        document.getElementById('equipo').value = equipo.equipo || '';
        document.getElementById('cliente').value = equipo.cliente || '';
        document.getElementById('ubicacion').value = equipo.ubicacion || '';
        document.getElementById('garantia_fin').value = equipo.garantia_fin || '';
        document.getElementById('mantenimiento').value = equipo.mantenimiento_inicio || '';
        document.getElementById('observaciones').value = equipo.observaciones || '';
        
        equipoEnEdicion = id;
        document.querySelector('.btn-guardar').textContent = 'Actualizar Equipo';
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('❌ Error al cargar equipo para editar');
        console.error(error);
    }
}

async function eliminarEquipo(id) {
    if (!confirm('¿Estás seguro de eliminar este equipo?')) return;
    
    try {
        const response = await fetch(`${API_URL}/equipos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('✅ Equipo eliminado');
            await cargarEquipos();
        } else {
            alert('❌ Error al eliminar');
        }
    } catch (error) {
        alert('❌ Error de conexión');
        console.error(error);
    }
}

async function verDetalle(id) {
    const modal = document.getElementById('detalleModal');
    const detalleBody = document.getElementById('detalleBody');
    
    modal.classList.add('show');
    detalleBody.innerHTML = '<div class="loading">Cargando detalles...</div>';
    
    try {
        const response = await fetch(`${API_URL}/equipos/${id}`);
        const equipo = await response.json();
        
        const diasGarantia = calcularDiasRestantes(equipo.garantia_fin);
        const estadoGarantia = getEstadoGarantia(diasGarantia);
        
        const diasManto = calcularDiasRestantes(equipo.mantenimiento_inicio);
        let claseManto = '';
        let textoManto = '';
        
        if (diasManto < 0) {
            claseManto = 'urgente';
            textoManto = '⚠️ Mantenimiento vencido';
        } else if (diasManto <= 7) {
            claseManto = 'proximo';
            textoManto = `🔔 Vence en ${diasManto} días`;
        } else if (diasManto === 999) {
            textoManto = '📅 No programado';
        } else {
            textoManto = `📅 Próximo: ${diasManto} días`;
        }
        
        detalleBody.innerHTML = `
            <div class="detalle-card">
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">ID del Equipo</div>
                        <div class="detalle-valor"><strong>#${equipo.id}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Estado de Garantía</div>
                        <div class="detalle-valor">
                            <span class="estado-badge ${estadoGarantia.clase}">${estadoGarantia.texto}</span>
                        </div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Equipo</div>
                        <div class="detalle-valor"><strong>${equipo.equipo || 'No especificado'}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Cliente</div>
                        <div class="detalle-valor">${equipo.cliente || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Ubicación</div>
                        <div class="detalle-valor">${equipo.ubicacion || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Garantía Inicio</div>
                        <div class="detalle-valor">${equipo.garantia_inicio ? new Date(equipo.garantia_inicio).toLocaleDateString('es-ES') : 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Garantía Fin</div>
                        <div class="detalle-valor">${equipo.garantia_fin ? new Date(equipo.garantia_fin).toLocaleDateString('es-ES') : 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Próximo Mantenimiento</div>
                        <div class="detalle-valor fecha-manto ${claseManto}">
                            ${equipo.mantenimiento_inicio ? new Date(equipo.mantenimiento_inicio).toLocaleDateString('es-ES') : 'No programado'}
                            ${textoManto !== '📅 No programado' ? `<br><small>${textoManto}</small>` : ''}
                        </div>
                    </div>
                    <div class="detalle-item full-width">
                        <div class="detalle-label">Observaciones</div>
                        <div class="detalle-valor">${equipo.observaciones || 'Sin observaciones'}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        detalleBody.innerHTML = '<div class="loading" style="color: var(--danger);">❌ Error al cargar detalles</div>';
        console.error(error);
    }
}

function cerrarModal() {
    document.getElementById('detalleModal').classList.remove('show');
}

function calcularDiasRestantes(fechaStr) {
    if (!fechaStr) return 999;
    const hoy = new Date();
    const fecha = new Date(fechaStr);
    const diff = fecha - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getEstadoGarantia(dias) {
    if (dias < 0) return { clase: 'vencido', texto: 'Vencido' };
    if (dias <= 30) return { clase: 'proximo', texto: 'Por vencer' };
    return { clase: 'vigente', texto: 'Vigente' };
}