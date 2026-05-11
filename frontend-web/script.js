const API_URL = 'http://127.0.0.1:8000';

// Variables para paginación
let todosLosEquipos = [];
let paginaActual = 1;
const equiposPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    cargarEquipos();
    cargarClientesEnSelector();  // ← NUEVO: cargar clientes en el selector
    
    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('detalleModal');
        if (e.target === modal) cerrarModal();
    });
    
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

    // Hacer que los checkboxes de origen sean mutuamente excluyentes
    const importado = document.getElementById('importado');
    const nacionalizado = document.getElementById('nacionalizado');
    
    if (importado && nacionalizado) {
        importado.addEventListener('change', function() {
            if (this.checked) {
                nacionalizado.checked = false;
            }
        });
        
        nacionalizado.addEventListener('change', function() {
            if (this.checked) {
                importado.checked = false;
            }
        });
    }
});

let equipoEnEdicion = null;
document.getElementById('equipoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectCliente = document.getElementById('cliente_id');
    const inputCliente = document.getElementById('cliente_nuevo');
    const clienteId = selectCliente && selectCliente.value ? parseInt(selectCliente.value) : null;
    const clienteNombre = inputCliente ? inputCliente.value.trim() : '';
    
    const equipo = {
        equipo: document.getElementById('equipo').value,
        cliente: clienteNombre || (clienteId ? '' : ''),
        cliente_id: clienteId,
        ubicacion: document.getElementById('ubicacion').value,
        garantia_inicio: document.getElementById('garantia_inicio').value,
        garantia_fin: document.getElementById('garantia_fin').value,
        mtto_inicio: document.getElementById('mtto_inicio').value || null,
        mtto_fin: null,
        importado: document.getElementById('importado').checked,
        nacionalizado: document.getElementById('nacionalizado').checked,
        mtos_pendientes: parseInt(document.getElementById('mtos_pendientes').value) || 0,
        mtos_realizados: parseInt(document.getElementById('mtos_realizados').value) || 0,
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
        const data = await response.json();
        
        if (Array.isArray(data)) {
            todosLosEquipos = data;
        } else if (data.error) {
            console.error('Error del servidor:', data.error);
            todosLosEquipos = [];
            document.getElementById('cronogramaBody').innerHTML = 
                '<tr><td colspan="11" class="loading">❌ Error del servidor: ' + data.error + '</td><\/tr>';
            return;
        } else {
            todosLosEquipos = [];
        }
        
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
        
        paginaActual = 1;
        renderizarPagina();
        
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        document.getElementById('cronogramaBody').innerHTML = 
            '<tr><td colspan="11" class="loading">❌ Error al cargar equipos</td><\/tr>';
    }
}

function renderizarPagina() {
    const tbody = document.getElementById('cronogramaBody');
    const totalPaginas = Math.ceil(todosLosEquipos.length / equiposPorPagina);
    
    if (todosLosEquipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="loading">No hay equipos registrados</td><\/tr>';
        actualizarPaginacion(0, 0, 0);
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

function crearFilaEquipo(equipo) {
    const tr = document.createElement('tr');
    
    const diasGarantia = calcularDiasRestantes(equipo.garantia_fin);
    const estadoGarantia = getEstadoGarantia(diasGarantia);
    
    const diasManto = calcularDiasRestantes(equipo.mtto_inicio);
    let claseManto = '';
    let tooltipManto = '';
    
    if (diasManto < 0) {
        claseManto = 'urgente';
        tooltipManto = '⚠️ Mtto. vencido';
    } else if (diasManto <= 7) {
        claseManto = 'proximo';
        tooltipManto = `🔔 Vence en ${diasManto} días`;
    } else if (diasManto === 999) {
        tooltipManto = '📅 No programado';
    } else {
        tooltipManto = `📅 Próximo: ${diasManto} días`;
    }
    
    let origen = '-';
    if (equipo.importado) origen = '🌍 Importado';
    if (equipo.nacionalizado) origen = '🇨🇴 Nacional';
    
    const mtosTexto = `${equipo.mtos_realizados || 0}/${equipo.mtos_pendientes || 0}`;
    
    const observaciones = equipo.observaciones ? 
        (equipo.observaciones.length > 30 ? 
            equipo.observaciones.substring(0, 30) + '...' : 
            equipo.observaciones) : '-';
    
    tr.innerHTML = `
        <td>${equipo.id || ''}</td>
        <td><strong>${equipo.equipo || ''}</strong></td>
        <td>${equipo.cliente || ''}</td>
        <td>${equipo.ubicacion || ''}</td>
        <td>${origen}</td>
        <td>${mtosTexto}</td>
        <td>${equipo.garantia_fin ? new Date(equipo.garantia_fin).toLocaleDateString('es-ES') : ''}</td>
        <td><span class="estado-garantia ${estadoGarantia.clase}">${estadoGarantia.texto}</span></td>
        <td>
            <span class="fecha-manto ${claseManto}" data-tooltip="${tooltipManto}">
                ${equipo.mtto_inicio ? new Date(equipo.mtto_inicio).toLocaleDateString('es-ES') : '📅 No programado'}
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

async function editarEquipo(id) {
    try {
        const response = await fetch(`${API_URL}/equipos/${id}`);
        const equipo = await response.json();
        
        document.getElementById('equipo').value = equipo.equipo || '';
        document.getElementById('cliente').value = equipo.cliente || '';
        document.getElementById('ubicacion').value = equipo.ubicacion || '';
        document.getElementById('garantia_inicio').value = equipo.garantia_inicio || '';
        document.getElementById('garantia_fin').value = equipo.garantia_fin || '';
        document.getElementById('mtto_inicio').value = equipo.mtto_inicio || '';
        document.getElementById('importado').checked = equipo.importado || false;
        document.getElementById('nacionalizado').checked = equipo.nacionalizado || false;
        document.getElementById('mtos_pendientes').value = equipo.mtos_pendientes || 0;
        document.getElementById('mtos_realizados').value = equipo.mtos_realizados || 0;
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
        
        const diasManto = calcularDiasRestantes(equipo.mtto_inicio);
        let claseManto = '';
        let textoManto = '';
        
        if (diasManto < 0) {
            claseManto = 'urgente';
            textoManto = '⚠️ Mtto. vencido';
        } else if (diasManto <= 7) {
            claseManto = 'proximo';
            textoManto = `🔔 Vence en ${diasManto} días`;
        } else if (diasManto === 999) {
            textoManto = '📅 No programado';
        } else {
            textoManto = `📅 Próximo: ${diasManto} días`;
        }
        
        let origen = 'No especificado';
        if (equipo.importado) origen = '🌍 Importado';
        if (equipo.nacionalizado) origen = '🇨🇴 Nacionalizado';
        
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
                        <div class="detalle-label">Origen</div>
                        <div class="detalle-valor">${origen}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Mantenimientos</div>
                        <div class="detalle-valor">${equipo.mtos_realizados || 0} de ${equipo.mtos_pendientes || 0} realizados</div>
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
                        <div class="detalle-label">Próximo Mtto.</div>
                        <div class="detalle-valor fecha-manto ${claseManto}">
                            ${equipo.mtto_inicio ? new Date(equipo.mtto_inicio).toLocaleDateString('es-ES') : 'No programado'}
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

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// ===== NUEVA FUNCIÓN AGREGADA =====
async function cargarClientesEnSelector() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        const clientes = await response.json();
        const select = document.getElementById('cliente_id');
        if (select) {
            select.innerHTML = '<option value="">Seleccione un cliente...</option>';
            clientes.forEach(cliente => {
                select.innerHTML += `<option value="${cliente.id}">${cliente.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}