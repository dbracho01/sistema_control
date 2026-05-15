const API_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    cargarEquipos();
    cargarMetricasGenerales();
});

async function cargarClientes() {
    const response = await fetch(`${API_URL}/clientes`);
    const clientes = await response.json();
    const select = document.getElementById('clienteFiltro');
    clientes.forEach(cliente => {
        select.innerHTML += `<option value="${cliente.id}">${cliente.nombre}</option>`;
    });
}

async function cargarEquipos() {
    const response = await fetch(`${API_URL}/equipos`);
    const equipos = await response.json();
    const select = document.getElementById('equipoFiltro');
    equipos.forEach(equipo => {
        select.innerHTML += `<option value="${equipo.id}">${equipo.equipo} - ${equipo.cliente}</option>`;
    });
}

async function cargarMetricasGenerales() {
    const response = await fetch(`${API_URL}/metricas/resumen`);
    const data = await response.json();
    
    document.getElementById('totalEquipos').textContent = data.total_equipos;
    document.getElementById('totalIntervenciones').textContent = data.total_intervenciones;
}

async function aplicarFiltros() {
    const equipoId = document.getElementById('equipoFiltro').value;
    
    if (equipoId) {
        // Métricas de un equipo específico
        const response = await fetch(`${API_URL}/metricas/equipo/${equipoId}`);
        const data = await response.json();
        
        document.getElementById('mtbfValue').textContent = data.MTBF || 0;
        document.getElementById('mttrValue').textContent = data.MTTR || 0;
        document.getElementById('tasaFalloValue').textContent = data.tasa_fallo_lamda || 0;
        
        const disponibilidad = ((data.MUT / data.MTBF) * 100).toFixed(2);
        document.getElementById('disponibilidadValue').textContent = disponibilidad;
        
        const roiClass = data.roi_mantenimiento >= 0 ? 'roi-positivo' : 'roi-negativo';
        document.getElementById('roiValue').innerHTML = `<span class="${roiClass}">${data.roi_mantenimiento}%</span>`;
    } else {
        // Métricas generales
        cargarTodasMetricas();
    }
    
    cargarTablaMetricas();
}

async function cargarTodasMetricas() {
    const response = await fetch(`${API_URL}/equipos`);
    const equipos = await response.json();
    
    let totalMTBF = 0;
    let totalMTTR = 0;
    let totalROI = 0;
    let count = 0;
    
    for (const equipo of equipos) {
        const res = await fetch(`${API_URL}/metricas/equipo/${equipo.id}`);
        const data = await res.json();
        
        if (!data.error) {
            totalMTBF += data.MTBF || 0;
            totalMTTR += data.MTTR || 0;
            totalROI += data.roi_mantenimiento || 0;
            count++;
        }
    }
    
    document.getElementById('mtbfValue').textContent = (totalMTBF / count).toFixed(2);
    document.getElementById('mttrValue').textContent = (totalMTTR / count).toFixed(2);
    document.getElementById('roiValue').innerHTML = `<span class="${totalROI/count >= 0 ? 'roi-positivo' : 'roi-negativo'}">${(totalROI / count).toFixed(2)}%</span>`;
}

async function cargarTablaMetricas() {
    const response = await fetch(`${API_URL}/equipos`);
    const equipos = await response.json();
    const tbody = document.getElementById('metricasBody');
    tbody.innerHTML = '';
    
    for (const equipo of equipos) {
        const res = await fetch(`${API_URL}/metricas/equipo/${equipo.id}`);
        const data = await res.json();
        
        if (!data.error) {
            const disponibilidad = data.MTBF > 0 ? ((data.MUT / data.MTBF) * 100).toFixed(2) : 0;
            const roiClass = data.roi_mantenimiento >= 0 ? 'roi-positivo' : 'roi-negativo';
            
            const row = `
                <tr>
                    <td>${data.equipo}</td>
                    <td>${data.cliente}</td>
                    <td>${data.MTBF || 0}</td>
                    <td>${data.MTTR || 0}</td>
                    <td>${disponibilidad}%</td>
                    <td class="${roiClass}">${data.roi_mantenimiento}%</td>
                    <td><button onclick="verDetalleEquipo(${equipo.id})" class="btn-accion ver">Ver detalle</button></td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    }
}

function verDetalleEquipo(equipoId) {
    window.open(`${API_URL}/metricas/equipo/${equipoId}`, '_blank');
}

function exportarPDF() {
    alert('Exportando a PDF... (Funcionalidad en desarrollo)');
}

function exportarExcel() {
    alert('Exportando a Excel... (Funcionalidad en desarrollo)');
}
