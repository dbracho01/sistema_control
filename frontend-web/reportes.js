// URL de la API
const API_URL = 'http://127.0.0.1:8000';

console.log("🚀 Script de reportes cargado correctamente");

// Variable para el contador de reportes
let contadorReporte = 1001;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("📅 DOM cargado, inicializando formulario");
    await obtenerUltimoReporte();
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('hora').value = new Date().toTimeString().slice(0,5);
});

async function obtenerUltimoReporte() {
    try {
        document.getElementById('reporteNumero').textContent = `ST-${contadorReporte}`;
        console.log(`📄 Número de reporte inicial: ST-${contadorReporte}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

function agregarFilaMaterial() {
    console.log("➕ Agregando fila de material");
    const tbody = document.getElementById('materialesBody');
    const newRow = document.createElement('tr');
    newRow.className = 'material-row';
    newRow.innerHTML = `
        <td><input type="text" name="material_desc[]" placeholder="Descripción"></td>
        <td><input type="number" name="material_cant[]" placeholder="Cant." min="1" style="width: 70px;"></td>
        <td><input type="text" name="material_ref[]" placeholder="Referencia"></td>
        <td><button type="button" class="btn-accion eliminar" onclick="eliminarFilaMaterial(this)">🗑️</button></td>
    `;
    tbody.appendChild(newRow);
}

function eliminarFilaMaterial(btn) {
    console.log("🗑️ Eliminando fila de material");
    if (document.querySelectorAll('.material-row').length > 1) {
        btn.closest('tr').remove();
    } else {
        alert('Debe haber al menos una fila de materiales');
    }
}

document.getElementById('reporteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log("📤 Enviando formulario...");
    
    // Recolectar materiales
    const materiales = [];
    const filas = document.querySelectorAll('.material-row');
    filas.forEach(fila => {
        const desc = fila.querySelector('input[name="material_desc[]"]')?.value;
        const cant = fila.querySelector('input[name="material_cant[]"]')?.value;
        const ref = fila.querySelector('input[name="material_ref[]"]')?.value;
        
        if (desc) {
            materiales.push({
                descripcion: desc,
                cantidad: cant || '1',
                referencia: ref || ''
            });
        }
    });
    
    // Recolectar TODOS los datos del formulario
const datos = {
    // Información básica
    numero_reporte: document.getElementById('reporteNumero').textContent,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    horas: document.getElementById('horas')?.value || '',
    dias: document.getElementById('dias')?.value || '',
    tecnico: document.getElementById('tecnico')?.value || '',
    
    // SERVICIOS - Checkboxes
    servicio_instalacion: document.getElementById('servicio_instalacion')?.checked || false,
    servicio_preventivo: document.getElementById('servicio_preventivo')?.checked || false,
    servicio_correctivo: document.getElementById('servicio_correctivo')?.checked || false,
    servicio_asesoria: document.getElementById('servicio_asesoria')?.checked || false,
    servicio_consulta: document.getElementById('servicio_consulta')?.checked || false,
    servicio_otros: document.getElementById('servicio_otros')?.checked || false,
    servicio_otros_especifique: document.getElementById('servicio_otros_especifique')?.value || '',
    
    // EQUIPO - Checkboxes
    equipo_nuevo: document.getElementById('equipo_nuevo')?.checked || false,
    equipo_usado: document.getElementById('equipo_usado')?.checked || false,
    
    // INSTITUCIÓN - Textos
    institucion: document.getElementById('institucion')?.value || '',
    servicio_texto: document.getElementById('servicio_texto')?.value || '',
    responsable_texto: document.getElementById('responsable_texto')?.value || '',
    
    // CONTACTO - NUEVOS CAMPOS
    direccion: document.getElementById('direccion')?.value || '',
    ciudad: document.getElementById('ciudad')?.value || '',
    telefono: document.getElementById('telefono')?.value || '',
    
    // DATOS DEL EQUIPO - Textos
    equipo_nombre: document.getElementById('equipo_nombre')?.value || '',
    equipo_marca: document.getElementById('equipo_marca')?.value || '',
    equipo_modelo: document.getElementById('equipo_modelo')?.value || '',
    equipo_serie: document.getElementById('equipo_serie')?.value || '',
    
    // COMENTARIOS
    comentarios: document.getElementById('comentarios')?.value || '',
    
    // DESCRIPCIÓN
    descripcion_problema: document.getElementById('descripcion_problema')?.value || '',
    
    // ACCESORIOS
    accesorios: document.getElementById('accesorios')?.value || '',
    
    // OBSERVACIONES
    observaciones: document.getElementById('observaciones')?.value || '',
    
    // MATERIALES
    materiales: materiales,
    
    // FIRMAS
    firma_tecnico: document.getElementById('firma_tecnico_nombre')?.value || '',
    firma_cliente: document.getElementById('firma_cliente_nombre')?.value || '',
    firma_opr: document.getElementById('firma_opr_nombre')?.value || ''
};
    
    console.log('📦 Datos enviados al backend:', JSON.stringify(datos, null, 2));
    
    try {
        console.log(`🌐 Enviando petición a ${API_URL}/generar-pdf-desde-plantilla`);
        
        const response = await fetch(`${API_URL}/generar-pdf-desde-plantilla`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        console.log(`📥 Respuesta recibida. Status: ${response.status}`);
        
        if (response.ok) {
            console.log("✅ PDF generado correctamente, descargando...");
            
            const blob = await response.blob();
            console.log(`📦 Tamaño del PDF: ${blob.size} bytes`);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${datos.numero_reporte}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            contadorReporte++;
            document.getElementById('reporteNumero').textContent = `ST-${contadorReporte}`;
            
            alert('✅ Reporte generado correctamente');
        } else {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', errorText);
            alert('❌ Error al generar el reporte');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        alert('❌ Error de conexión con el servidor');
    }
});
// Cargar equipos en el selector
async function cargarEquiposEnSelector() {
    try {
        const response = await fetch(`${API_URL}/equipos`);
        const equipos = await response.json();
        const select = document.getElementById('equipo_select');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccione un equipo...</option>';
            equipos.forEach(equipo => {
                select.innerHTML += `<option value="${equipo.id}">${equipo.equipo} - ${equipo.cliente}</option>`;
            });
            console.log(`✅ ${equipos.length} equipos cargados en el selector`);
        }
    } catch (error) {
        console.error('Error cargando equipos:', error);
    }
}

// Llamar la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarEquiposEnSelector();
});

// Función para guardar reporte
async function guardarYListarReporte(event) {
    event.preventDefault();
    
    // Obtener equipo seleccionado
    const equipoSelect = document.getElementById('equipo_select');
    const equipoId = equipoSelect ? equipoSelect.value : null;
    
    if (!equipoId) {
        alert('❌ Seleccione un equipo');
        return;
    }
    
    // Determinar tipo de intervención
    let tipoIntervencion = "Preventivo";
    if (document.getElementById('servicio_correctivo')?.checked) tipoIntervencion = "Correctivo";
    else if (document.getElementById('servicio_instalacion')?.checked) tipoIntervencion = "Instalación";
    else if (document.getElementById('servicio_asesoria')?.checked) tipoIntervencion = "Asesoría";
    else if (document.getElementById('servicio_consulta')?.checked) tipoIntervencion = "Consulta";
    
    // Obtener materiales
    const materiales = [];
    document.querySelectorAll('.material-row').forEach(row => {
        const descripcion = row.querySelector('input[name="material_desc[]"]')?.value;
        if (descripcion) {
            materiales.push({
                descripcion: descripcion,
                cantidad: row.querySelector('input[name="material_cant[]"]')?.value,
                referencia: row.querySelector('input[name="material_ref[]"]')?.value
            });
        }
    });
    
    const datos = {
        equipo_id: parseInt(equipoId),
        fecha: document.getElementById('fecha').value,
        hora_inicio: document.getElementById('hora').value || "00:00",
        hora_fin: document.getElementById('hora').value || "00:00",
        tipo_intervencion: tipoIntervencion,
        descripcion: document.getElementById('descripcion_problema')?.value || document.getElementById('comentarios')?.value || "",
        tecnico: document.getElementById('tecnico').value,
        costo_mano_obra: parseFloat(document.getElementById('costo_mano_obra')?.value) || 0,
        costo_repuestos: 0,
        ingreso_generado: parseFloat(document.getElementById('ingreso_generado')?.value) || 0,
        ahorro_fallos: parseFloat(document.getElementById('ahorro_fallos')?.value) || 0,
        materiales: materiales
    };
    
    try {
        const response = await fetch(`${API_URL}/intervenciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            alert('✅ Reporte guardado exitosamente');
            
            // Incrementar número de reporte
            let numActual = parseInt(document.getElementById('reporteNumero').textContent.split('-')[1]);
            numActual++;
            document.getElementById('reporteNumero').textContent = `ST-${numActual}`;
            localStorage.setItem('reporteContador', numActual);
            
            // Limpiar formulario
            document.getElementById('tecnico').value = '';
            document.getElementById('descripcion_problema').value = '';
            document.getElementById('comentarios').value = '';
            document.getElementById('equipo_select').value = '';
            
            // Recargar lista de reportes
            if (typeof cargarListaReportes === 'function') {
                await cargarListaReportes();
            }
        } else {
            const error = await response.json();
            alert('❌ Error al guardar: ' + JSON.stringify(error));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

// Conectar el botón guardar
document.addEventListener('DOMContentLoaded', () => {
    const btnGuardar = document.getElementById('btnGuardarReporte');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarYListarReporte);
        console.log('✅ Botón guardar conectado');
    } else {
        console.log('❌ Botón guardar no encontrado');
    }
});
// Cargar lista de reportes guardados
async function cargarListaReportes() {
    const container = document.getElementById('listaReportes');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando reportes...</div>';
    
    try {
        const response = await fetch(`${API_URL}/intervenciones`);
        const reportes = await response.json();
        
        if (reportes.length === 0) {
            container.innerHTML = '<div class="loading">📭 No hay reportes guardados</div>';
            return;
        }
        
        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 10px;">Consecutivo</th>
                        <th style="padding: 10px;">Fecha</th>
                        <th style="padding: 10px;">Cliente</th>
                        <th style="padding: 10px;">Equipo</th>
                        <th style="padding: 10px;">Tipo</th>
                        <th style="padding: 10px;">Técnico</th>
                        <th style="padding: 10px;">Horas</th>
                        <th style="padding: 10px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        reportes.forEach(r => {
            html += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>ST-${r.id.toString().padStart(4, '0')}</strong></td>
                    <td style="padding: 8px;">${r.fecha}</td>
                    <td style="padding: 8px;">${r.cliente_nombre || 'N/A'}</td>
                    <td style="padding: 8px;">${r.equipo_nombre || 'Equipo #' + r.equipo_id}</td>
                    <td style="padding: 8px;">${r.tipo_intervencion}</td>
                    <td style="padding: 8px;">${r.tecnico || '-'}</td>
                    <td style="padding: 8px;">${r.horas_parada} hrs</td>
                    <td style="padding: 8px;">
                        <button class="btn-accion ver" onclick="verReporte(${r.id})">👁️</button>
                        <button class="btn-accion eliminar" onclick="eliminarReporte(${r.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="loading">Error al cargar reportes</div>';
    }
}

// Función para ver reporte
function verReporte(id) {
    window.open(`http://127.0.0.1:8000/ver-reporte/${id}`, '_blank');
}

// Función para eliminar reporte
async function eliminarReporte(id) {
    if (!confirm('¿Eliminar este reporte?')) return;
    try {
        const response = await fetch(`${API_URL}/intervenciones/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Reporte eliminado');
            cargarListaReportes();
        } else {
            alert('❌ Error al eliminar');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}
// Forzar carga de reportes después de 1 segundo
setTimeout(() => {
    cargarListaReportes();
}, 1000);