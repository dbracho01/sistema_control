// URL de la API
const API_URL = 'http://127.0.0.1:8000';

console.log("🚀 Script de reportes cargado correctamente");

// Variable para el contador de reportes (Generación PDF)
let contadorReporte = 1001;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("📅 DOM cargado, inicializando formulario");
    await obtenerUltimoReporte();
    
    // Asignar fecha y hora actual por defecto al formulario
    if(document.getElementById('fecha')) document.getElementById('fecha').valueAsDate = new Date();
    if(document.getElementById('hora')) document.getElementById('hora').value = new Date().toTimeString().slice(0,5);
    
    // Inicializar selectores y tablas
    await cargarEquiposEnSelector();
    await cargarListaReportes();

    // VINCULACIÓN CRÍTICA: Asignar el evento click al botón "Guardar Reporte"
    const btnGuardar = document.getElementById('btnGuardarReporte');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarYListarReporte);
    }
});

// Obtiene el consecutivo visual para el PDF temporal
async function obtenerUltimoReporte() {
    try {
        const numeroElement = document.getElementById('reporteNumero');
        if (numeroElement) {
            numeroElement.textContent = `ST-${contadorReporte}`;
            console.log(`📄 Número de reporte inicial: ST-${contadorReporte}`);
        }
    } catch (error) {
        console.error('Error al inicializar número de reporte:', error);
    }
}

// Control dinámico de la tabla de materiales
function agregarFilaMaterial() {
    console.log("➕ Agregando fila de material");
    const tbody = document.getElementById('materialesBody');
    if (!tbody) return;
    
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

// =======================================================
// ACCIÓN 1: SUBMIT DEL FORMULARIO - GENERACIÓN DE PDF
// =======================================================
document.getElementById('reporteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("📤 Enviando formulario para Generar PDF...");
    
    const materiales = [];
    document.querySelectorAll('.material-row').forEach(fila => {
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
    
    const datos = {
        numero_reporte: document.getElementById('reporteNumero').textContent,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        horas: document.getElementById('horas')?.value || '',
        dias: document.getElementById('dias')?.value || '',
        tecnico: document.getElementById('tecnico')?.value || '',
        servicio_instalacion: document.getElementById('servicio_instalacion')?.checked || false,
        servicio_preventivo: document.getElementById('servicio_preventivo')?.checked || false,
        servicio_correctivo: document.getElementById('servicio_correctivo')?.checked || false,
        servicio_asesoria: document.getElementById('servicio_asesoria')?.checked || false,
        servicio_consulta: document.getElementById('servicio_consulta')?.checked || false,
        servicio_otros: document.getElementById('servicio_otros')?.checked || false,
        equipo_nuevo: document.getElementById('equipo_nuevo')?.checked || false,
        equipo_usado: document.getElementById('equipo_usado')?.checked || false,
        institucion: document.getElementById('institucion')?.value || '',
        servicio_texto: document.getElementById('servicio_texto')?.value || '',
        responsable_texto: document.getElementById('responsable_texto')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        ciudad: document.getElementById('ciudad')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        equipo_nombre: document.getElementById('equipo_nombre')?.value || '',
        equipo_marca: document.getElementById('equipo_marca')?.value || '',
        equipo_modelo: document.getElementById('equipo_modelo')?.value || '',
        equipo_serie: document.getElementById('equipo_serie')?.value || '',
        descripcion_problema: document.getElementById('descripcion_problema')?.value || '',
        accesorios: document.getElementById('accesorios')?.value || '',
        observaciones: document.getElementById('observaciones')?.value || '',
        materiales: materiales,
        firma_tecnico: document.getElementById('firma_tecnico_nombre')?.value || '',
        firma_cliente: document.getElementById('firma_cliente_nombre')?.value || '',
        firma_opr: document.getElementById('firma_opr_nombre')?.value || ''
    };
    
    try {
        const response = await fetch(`${API_URL}/generar-pdf-desde-plantilla`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const blob = await response.blob();
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
            alert('✅ PDF generado e impreso correctamente');
        } else {
            alert('❌ Error al generar el PDF del reporte');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error de conexión al generar PDF');
    }
});

// Cargar catálogo de equipos en el tag <select>
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

// =======================================================
// ACCIÓN 2: GUARDAR O ACTUALIZAR REPORTE EN LA BD
// =======================================================
async function guardarYListarReporte(event) {
    event.preventDefault();
    console.log("💾 Ejecutando guardarYListarReporte...");
    
    const btnGuardar = document.getElementById('btnGuardarReporte');
    const editandoId = btnGuardar.getAttribute('data-edit-id');
    
    const equipoSelect = document.getElementById('equipo_select');
    const equipoId = equipoSelect ? equipoSelect.value : null;
    
    if (!equipoId) {
        alert('❌ Seleccione un equipo obligatoriamente');
        return;
    }
    
    // Determinar tipo de intervención basada en los checkboxes
    let tipoIntervencion = "Preventivo";
    if (document.getElementById('servicio_correctivo')?.checked) tipoIntervencion = "Correctivo";
    else if (document.getElementById('servicio_instalacion')?.checked) tipoIntervencion = "Instalación";
    else if (document.getElementById('servicio_asesoria')?.checked) tipoIntervencion = "Asesoría";
    else if (document.getElementById('servicio_consulta')?.checked) tipoIntervencion = "Consulta";
    
    // Recolectar materiales de la tabla dinámica
    const materiales = [];
    document.querySelectorAll('.material-row').forEach(row => {
        const descripcion = row.querySelector('input[name="material_desc[]"]')?.value;
        if (descripcion) {
            materiales.push({
                descripcion: descripcion,
                cantidad: row.querySelector('input[name="material_cant[]"]')?.value || '1',
                precio_unitario: '0', 
                referencia: row.querySelector('input[name="material_ref[]"]')?.value || ''
            });
        }
    });
    
    // Mapeo al esquema esperado por la tabla 'intervenciones' de tu backend
    const datos = {
        equipo_id: parseInt(equipoId),
        fecha: document.getElementById('fecha').value,
        hora_inicio: document.getElementById('hora').value || "00:00",
        hora_fin: document.getElementById('hora').value || "00:00",
        tipo_intervencion: tipoIntervencion,
        descripcion: document.getElementById('descripcion_problema')?.value || "",
        tecnico: document.getElementById('tecnico').value,
        costo_mano_obra: 0,
        costo_repuestos: 0,
        ingreso_generado: 0,
        ahorro_fallos: 0,
        materiales: materiales
    };
    
    try {
        let response;
        if (editandoId) {
            console.log(`📝 Enviando PUT para actualizar reporte ID: ${editandoId}`);
            response = await fetch(`${API_URL}/intervenciones/${editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            console.log(`➕ Enviando POST para nuevo reporte...`);
            response = await fetch(`${API_URL}/intervenciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }
        
        if (response.ok) {
            alert(editandoId ? '✅ Reporte actualizado correctamente' : '✅ Reporte guardado en la base de datos');
            
            // Reestablecer el botón a su estado de guardado original
            btnGuardar.textContent = '💾 Guardar Reporte';
            btnGuardar.style.background = "#10b981";
            btnGuardar.removeAttribute('data-edit-id');
            
            // Limpiar y restaurar valores por defecto del formulario
            document.getElementById('reporteForm').reset();
            document.getElementById('fecha').valueAsDate = new Date();
            document.getElementById('hora').value = new Date().toTimeString().slice(0,5);
            
            // Limpiar tabla de materiales dejando una fila inicial limpia
            const tbody = document.getElementById('materialesBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr class="material-row">
                        <td><input type="text" name="material_desc[]" placeholder="Descripción"></td>
                        <td><input type="number" name="material_cant[]" placeholder="Cant." min="1" style="width: 70px;"></td>
                        <td><input type="text" name="material_ref[]" placeholder="Referencia"></td>
                        <td><button type="button" class="btn-accion eliminar" onclick="eliminarFilaMaterial(this)">🗑️</button></td>
                    </tr>
                `;
            }
            
            // Actualizar la lista de reportes en la parte inferior
            await cargarListaReportes();
        } else {
            alert('❌ Error al guardar el reporte en el servidor');
        }
    } catch (error) {
        console.error('Error en el envío:', error);
        alert('❌ Error de conexión con el backend al intentar guardar');
    }
}

// =======================================================
// ACCIÓN 3: CARGAR REPORTE EN EL FORMULARIO PARA EDITAR
// =======================================================
async function editarReporte(id) {
    console.log(`🔍 Buscando datos en BD para editar reporte ID: ${id}`);
    try {
        const response = await fetch(`${API_URL}/intervenciones/${id}`);
        if (!response.ok) throw new Error("No se pudo obtener el reporte seleccionado");
        const r = await response.json();
        
        // Alterar el botón de Guardar para habilitar el envío 'PUT'
        const btnGuardar = document.getElementById('btnGuardarReporte');
        if (btnGuardar) {
            btnGuardar.setAttribute('data-edit-id', id);
            btnGuardar.textContent = '🔄 Actualizar Reporte';
            btnGuardar.style.background = '#f59e0b'; // Color naranja de edición
        }
        
        // Mapear los datos de la base de datos a los inputs HTML correspondientes
        if (document.getElementById('fecha')) document.getElementById('fecha').value = r.fecha;
        if (document.getElementById('hora')) document.getElementById('hora').value = r.hora_inicio || '00:00';
        if (document.getElementById('tecnico')) document.getElementById('tecnico').value = r.tecnico || '';
        if (document.getElementById('descripcion_problema')) document.getElementById('descripcion_problema').value = r.descripcion || '';
        if (document.getElementById('equipo_select')) document.getElementById('equipo_select').value = r.equipo_id;

        // Resetear todos los checkboxes de servicio y marcar el correcto
        const servicios = ['servicio_preventivo', 'servicio_correctivo', 'servicio_instalacion', 'servicio_asesoria', 'servicio_consulta'];
        servicios.forEach(s => { if(document.getElementById(s)) document.getElementById(s).checked = false; });

        if (r.tipo_intervencion === "Preventivo" && document.getElementById('servicio_preventivo')) document.getElementById('servicio_preventivo').checked = true;
        if (r.tipo_intervencion === "Correctivo" && document.getElementById('servicio_correctivo')) document.getElementById('servicio_correctivo').checked = true;
        if (r.tipo_intervencion === "Instalación" && document.getElementById('servicio_instalacion')) document.getElementById('servicio_instalacion').checked = true;
        if (r.tipo_intervencion === "Asesoría" && document.getElementById('servicio_asesoria')) document.getElementById('servicio_asesoria').checked = true;
        if (r.tipo_intervencion === "Consulta" && document.getElementById('servicio_consulta')) document.getElementById('servicio_consulta').checked = true;

        // Repoblar dinámicamente las filas de materiales guardados
        const tbody = document.getElementById('materialesBody');
        if (tbody) {
            tbody.innerHTML = ''; // Limpiar filas preexistentes
            
            if (r.materiales && r.materiales.length > 0) {
                r.materiales.forEach(m => {
                    const newRow = document.createElement('tr');
                    newRow.className = 'material-row';
                    newRow.innerHTML = `
                        <td><input type="text" name="material_desc[]" value="${m.descripcion || ''}"></td>
                        <td><input type="number" name="material_cant[]" value="${m.cantidad || 1}" min="1" style="width: 70px;"></td>
                        <td><input type="text" name="material_ref[]" value="${m.referencia || ''}"></td>
                        <td><button type="button" class="btn-accion eliminar" onclick="eliminarFilaMaterial(this)">🗑️</button></td>
                    `;
                    tbody.appendChild(newRow);
                });
            } else {
                // Si no hay materiales guardados, renderizar una fila vacía estándar
                tbody.innerHTML = `
                    <tr class="material-row">
                        <td><input type="text" name="material_desc[]" placeholder="Descripción"></td>
                        <td><input type="number" name="material_cant[]" placeholder="Cant." min="1" style="width: 70px;"></td>
                        <td><input type="text" name="material_ref[]" placeholder="Referencia"></td>
                        <td><button type="button" class="btn-accion eliminar" onclick="eliminarFilaMaterial(this)">🗑️</button></td>
                    </tr>
                `;
            }
        }

        // Auto-scroll fluido hacia arriba para facilitar la edición inmediata al usuario
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error al cargar reporte para edición:', error);
        alert('❌ Error al cargar los datos del reporte');
    }
}

// Cargar la lista inferior de reportes guardados en la BD
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
                    <td style="padding: 8px;">
                        <button class="btn-accion ver" onclick="verReporte(${r.id})">👁️</button>
                        <button class="btn-accion editar" onclick="editarReporte(${r.id})">✏️</button>
                        <button class="btn-accion eliminar" onclick="eliminarReporte(${r.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error al renderizar tabla de reportes:', error);
        container.innerHTML = '<div class="loading">Error al cargar reportes guardados</div>';
    }
}

// Abrir vista del PDF guardado
function verReporte(id) {
    window.open(`${API_URL}/ver-reporte/${id}`, '_blank');
}

// Eliminar registro físico de la BD
async function eliminarReporte(id) {
    if (!confirm('¿Está seguro de que desea eliminar este reporte de forma permanente?')) return;
    try {
        const response = await fetch(`${API_URL}/intervenciones/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Reporte eliminado con éxito');
            await cargarListaReportes();
        } else {
            alert('❌ Error al eliminar el reporte del servidor');
        }
    } catch (error) {
        console.error('Error al borrar registro:', error);
        alert('Error de conexión con el servidor');
    }
}

