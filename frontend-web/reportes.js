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