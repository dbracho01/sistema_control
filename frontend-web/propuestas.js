// API Base URL
const API_URL = 'http://localhost:8000';

// Variables globales
let propuestas = [];
let clientes = [];
let currentPage = 1;
let itemsPerPage = 10;
let logoPersonalizadoBase64 = null;
let productosTemp = [];

// Datos de la empresa (fijos)
const empresaData = {
    nombre: "Advanced Radiotherapy Corporation",
    direccion: "Calle Principal #123, Oficina 405",
    telefono: "+57 (601) 123-4567",
    web: "www.advancedradiotherapy.com"
};

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarClientes();
    await cargarPropuestas();
    configurarEventListeners();
    inicializarVistaPrevia();
    
    // Fecha por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_emision').value = hoy;
    
    // Fecha validez (30 días después)
    const fechaValidez = new Date();
    fechaValidez.setDate(fechaValidez.getDate() + 30);
    document.getElementById('fecha_validez').value = fechaValidez.toISOString().split('T')[0];
});

function configurarEventListeners() {
    const form = document.getElementById('propuestaForm');

    if (form) {
        form.addEventListener('submit', guardarPropuesta);
    }
}

// Cargar clientes
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        clientes = await response.json();
        const select = document.getElementById('cliente_id');
        select.innerHTML = '<option value="">Seleccionar cliente existente...</option>';
        clientes.forEach(cliente => {
            select.innerHTML += `<option value="${cliente.id}">${cliente.nombre}</option>`;
        });
        
        select.addEventListener('change', (e) => {
            const clienteId = parseInt(e.target.value);
            const cliente = clientes.find(c => c.id === clienteId);
            if (cliente) {
                document.getElementById('cliente_nombre').value = cliente.nombre;
                document.getElementById('cliente_contacto').value = cliente.contacto || '';
                document.getElementById('cliente_email').value = cliente.email || '';
                document.getElementById('cliente_telefono').value = cliente.telefono || '';
                document.getElementById('cliente_direccion').value = cliente.direccion || '';
            }
        });
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

// Cargar propuestas
async function cargarPropuestas() {
    try {
        const response = await fetch(`${API_URL}/propuestas`);
        propuestas = await response.json();
        renderizarTablaPropuestas();
    } catch (error) {
        console.error('Error cargando propuestas:', error);
        document.getElementById('propuestasBody').innerHTML = '<tr><td colspan="8" class="loading">Error al cargar propuestas</td></tr>';
    }
}

// Renderizar tabla de propuestas (corregido)
function renderizarTablaPropuestas() {
    const tbody = document.getElementById('propuestasBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = propuestas.slice(start, end);
    
    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay propuestas registradas</td></tr>';
        actualizarPaginacion();
        return;
    }
    
    tbody.innerHTML = paginated.map(propuesta => `
        <tr>
            <td>${propuesta.id}</td>
            <td><strong>${propuesta.numero_propuesta}</strong></td>
            <td>${propuesta.cliente_nombre}</td>
            <td>${propuesta.fecha_emision}</td>
            <td>${propuesta.vendedor || '-'}</td>
            <td>$${Number(propuesta.total).toLocaleString('es-CO')}</td>
            <td><span class="estado-badge-propuesta estado-${getEstadoClass(propuesta.estado)}">${getEstadoIcon(propuesta.estado)} ${propuesta.estado}</span></td>
            <td class="acciones-cell">
                <button class="btn-accion ver" onclick="verPropuesta(${propuesta.id})">👁️ Ver</button>
                <button class="btn-accion editar" onclick="editarPropuesta(${propuesta.id})">✏️ Editar</button>
                <button class="btn-accion eliminar" onclick="eliminarPropuesta(${propuesta.id})">🗑️ Eliminar</button>
                <button class="btn-accion" onclick="exportarPDFPropuesta(${propuesta.id})" title="PDF">📄</button>
            </td>
        </tr>
    `).join('');
    
    actualizarPaginacion();
}

function getEstadoClass(estado) {
    const clases = {
        'Borrador': 'borrador',
        'Enviada': 'enviada',
        'Aprobada': 'aprobada',
        'Rechazada': 'rechazada'
    };
    return clases[estado] || 'borrador';
}

function getEstadoIcon(estado) {
    const icons = {
        'Borrador': '📝',
        'Enviada': '📨',
        'Aprobada': '✅',
        'Rechazada': '❌'
    };
    return icons[estado] || '📝';
}

function actualizarPaginacion() {
    const totalPages = Math.ceil(propuestas.length / itemsPerPage);
    const info = document.getElementById('paginationInfo');
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, propuestas.length);
    
    info.textContent = `Mostrando ${start}-${end} de ${propuestas.length} propuestas`;
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    
    if (prevBtn) {
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderizarTablaPropuestas(); } };
    }
    if (nextBtn) {
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderizarTablaPropuestas(); } };
    }
}

// Agregar fila de producto
function agregarFilaProducto() {
    const tbody = document.getElementById('productosBody');
    const newRow = document.createElement('tr');
    newRow.className = 'producto-row';
    newRow.innerHTML = `
        <td><input type="text" class="producto-descripcion" placeholder="Ej: Ecógrafo portátil"></td>
        <td><input type="text" class="producto-modelo" placeholder="Modelo"></td>
        <td><input type="text" class="producto-referencia" placeholder="Referencia"></td>
        <td><input type="number" class="producto-valor" step="0.01" value="0" style="width: 110px;"></td>
        <td class="producto-iva">$0.00</td>
        <td class="producto-total">$0.00</td>
        <td><button type="button" class="btn-eliminar-fila" onclick="eliminarFilaProducto(this)">🗑️</button></td>
    `;
    tbody.appendChild(newRow);
    recalcularTotales();
}

function eliminarFilaProducto(btn) {
    const row = btn.closest('tr');
    if (document.querySelectorAll('.producto-row').length > 1) {
        row.remove();
        recalcularTotales();
    } else {
        mostrarNotificacion('Debe haber al menos un producto', 'warning');
    }
}

// Recalcular totales
function recalcularTotales() {
    const rows = document.querySelectorAll('.producto-row');
    let subtotal = 0;
    
    rows.forEach(row => {
        const valorInput = row.querySelector('.producto-valor');
        const valor = parseFloat(valorInput.value) || 0;
        const iva = valor * 0.19;
        const total = valor + iva;
        
        row.querySelector('.producto-iva').textContent = `$${iva.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
        row.querySelector('.producto-total').textContent = `$${total.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
        subtotal += total;
    });
    
    const totalIva = subtotal * (19/119);
    const totalGeneral = subtotal;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
    document.getElementById('total_iva').textContent = `$${totalIva.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
    document.getElementById('total_general').textContent = `$${totalGeneral.toLocaleString('es-CO', {minimumFractionDigits: 2})}`;
    
    actualizarVistaPrevia();
}

// Manejar logo personalizable
function manejarLogoPersonalizado(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoPersonalizadoBase64 = e.target.result;
            const preview = document.getElementById('preview_logo_personalizado');
            preview.innerHTML = `<img src="${logoPersonalizadoBase64}" style="max-width: 150px; max-height: 70px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px;">`;
            actualizarVistaPrevia();
        };
        reader.readAsDataURL(file);
    }
}

// Inicializar vista previa
function inicializarVistaPrevia() {
    actualizarVistaPrevia();
}

// Actualizar vista previa en vivo
function actualizarVistaPrevia() {
    const previewDiv = document.getElementById('vistaPrevia');
    if (!previewDiv) return;
    
    const productos = obtenerProductosDelFormulario();
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace(/[^0-9.-]/g, '')) || 0;
    const totalIva = parseFloat(document.getElementById('total_iva').textContent.replace(/[^0-9.-]/g, '')) || 0;
    const totalGeneral = parseFloat(document.getElementById('total_general').textContent.replace(/[^0-9.-]/g, '')) || 0;
    
    previewDiv.innerHTML = `
        <div class="propuesta-encabezado">
            <div class="empresa-info">
                <div class="empresa-logo">
                    <img src="/assets/logo.png" alt="Logo Empresa" class="empresa-logo-img" style="height: 50px;">
                </div>
                <div class="empresa-detalles">
                    <p>${empresaData.nombre}</p>
                    <p>${empresaData.direccion}</p>
                    <p>Tel: ${empresaData.telefono} | Web: ${empresaData.web}</p>
                </div>
            </div>
            <div class="logo-personalizable">
                ${logoPersonalizadoBase64 ? `<img src="${logoPersonalizadoBase64}" class="logo-personalizable-img">` : '<div style="width: 150px; height: 70px; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px;">Logo Cliente</div>'}
            </div>
        </div>
        
        <div class="propuesta-numero">
            ${document.getElementById('numero_propuesta').value || 'PROP-000'}
        </div>
        
        <div class="cliente-info-propuesta">
            <h4>INFORMACIÓN DEL CLIENTE</h4>
            <div class="cliente-info-grid">
                <div class="cliente-info-item"><strong>Cliente:</strong> ${document.getElementById('cliente_nombre').value || '—'}</div>
                <div class="cliente-info-item"><strong>Contacto:</strong> ${document.getElementById('cliente_contacto').value || '—'}</div>
                <div class="cliente-info-item"><strong>Email:</strong> ${document.getElementById('cliente_email').value || '—'}</div>
                <div class="cliente-info-item"><strong>Teléfono:</strong> ${document.getElementById('cliente_telefono').value || '—'}</div>
                <div class="cliente-info-item"><strong>Dirección:</strong> ${document.getElementById('cliente_direccion').value || '—'}</div>
                <div class="cliente-info-item"><strong>Vendedor:</strong> ${document.getElementById('vendedor').value || '—'}</div>
            </div>
        </div>
        
        <table class="productos-propuesta-table">
            <thead>
                <tr><th>Descripción del equipo</th><th>Modelo</th><th>Referencia</th><th>Valor Unitario</th><th>IVA (19%)</th><th>Valor Total</th></tr>
            </thead>
            <tbody>
                ${productos.map(p => `
                    <tr>
                        <td>${p.descripcion || '—'}</td>
                        <td>${p.modelo || '—'}</td>
                        <td>${p.referencia || '—'}</td>
                        <td>$${p.valor.toLocaleString('es-CO', {minimumFractionDigits: 2})}</td>
                        <td>$${(p.valor * 0.19).toLocaleString('es-CO', {minimumFractionDigits: 2})}</td>
                        <td>$${(p.valor * 1.19).toLocaleString('es-CO', {minimumFractionDigits: 2})}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="5" style="text-align: right;"><strong>Subtotal:</strong></td><td>$${subtotal.toLocaleString('es-CO', {minimumFractionDigits: 2})}</td></tr>
                <tr><td colspan="5" style="text-align: right;"><strong>IVA (19%):</strong></td><td>$${totalIva.toLocaleString('es-CO', {minimumFractionDigits: 2})}</td></tr>
                <tr><td colspan="5" style="text-align: right;"><strong>TOTAL:</strong></td><td><strong>$${totalGeneral.toLocaleString('es-CO', {minimumFractionDigits: 2})}</strong></td></tr>
            </tfoot>
        </table>
        
        ${document.getElementById('notas').value ? `
            <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong>Notas:</strong><br>${document.getElementById('notas').value}
            </div>
        ` : ''}
        
        <div class="terminos-propuesta">
            <strong>Términos y condiciones</strong><br>
            ${document.getElementById('terminos').value || 'Los precios incluyen IVA. La validez de esta propuesta es de 30 días.'}
        </div>
    `;
}

function obtenerProductosDelFormulario() {
    const rows = document.querySelectorAll('.producto-row');
    const productos = [];
    rows.forEach(row => {
        productos.push({
            descripcion: row.querySelector('.producto-descripcion')?.value || '',
            modelo: row.querySelector('.producto-modelo')?.value || '',
            referencia: row.querySelector('.producto-referencia')?.value || '',
            valor: parseFloat(row.querySelector('.producto-valor')?.value) || 0
        });
    });
    return productos;
}

// Guardar propuesta
async function guardarPropuesta(e) {
    e.preventDefault();
    
    const productos = obtenerProductosDelFormulario();
    const totalGeneral = parseFloat(document.getElementById('total_general').textContent.replace(/[^0-9.-]/g, '')) || 0;
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace(/[^0-9.-]/g, '')) || 0;
    const totalIva = parseFloat(document.getElementById('total_iva').textContent.replace(/[^0-9.-]/g, '')) || 0;
    
    const data = {
        numero_propuesta: document.getElementById('numero_propuesta').value,
        fecha_emision: document.getElementById('fecha_emision').value,
        fecha_validez: document.getElementById('fecha_validez').value || null,
        cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
        cliente_nombre: document.getElementById('cliente_nombre').value,
        cliente_contacto: document.getElementById('cliente_contacto').value,
        cliente_email: document.getElementById('cliente_email').value,
        cliente_telefono: document.getElementById('cliente_telefono').value,
        cliente_direccion: document.getElementById('cliente_direccion').value,
        vendedor: document.getElementById('vendedor').value,
        estado: document.getElementById('estado').value,
        subtotal: subtotal,
        iva: totalIva,
        total: totalGeneral,
        productos: productos,
        notas: document.getElementById('notas').value,
        terminos: document.getElementById('terminos').value,
        logo_personalizado: logoPersonalizadoBase64
    };
    
    try {
        const response = await fetch(`${API_URL}/propuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            mostrarNotificacion('Propuesta guardada correctamente', 'success');
            limpiarFormulario();
            await cargarPropuestas();
        } else {
            mostrarNotificacion('Error al guardar propuesta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

function limpiarFormulario() {
    document.getElementById('propuestaForm').reset();
    document.getElementById('numero_propuesta').value = '';
    document.getElementById('cliente_nombre').value = '';
    document.getElementById('vendedor').value = '';
    document.getElementById('notas').value = '';
    document.getElementById('terminos').value = 'Los precios incluyen IVA. La validez de esta propuesta es de 30 días. Formas de pago: Contado, Transferencia bancaria. Los equipos cuentan con garantía de 12 meses.';
    logoPersonalizadoBase64 = null;
    document.getElementById('preview_logo_personalizado').innerHTML = '';
    document.getElementById('logo_personalizado').value = '';
    
    // Limpiar productos excepto uno
    const tbody = document.getElementById('productosBody');
    tbody.innerHTML = '';
    agregarFilaProducto();
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_emision').value = hoy;
    const fechaValidez = new Date();
    fechaValidez.setDate(fechaValidez.getDate() + 30);
    document.getElementById('fecha_validez').value = fechaValidez.toISOString().split('T')[0];
    
    actualizarVistaPrevia();
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${tipo === 'success' ? '#10b981' : '#ef4444'};
        color: white; border-radius: 8px; z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

// Exportar PDF
async function exportarPDF() {
    const contenido = document.getElementById('vistaPrevia');
    if (!contenido) return;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Propuesta Comercial</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2cm; }
            .propuesta-encabezado { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .propuesta-numero { text-align: right; font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 20px; }
            .cliente-info-propuesta { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
            .totales-propuesta { text-align: right; }
            .terminos-propuesta { margin-top: 40px; font-size: 11px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { body { margin: 0; } }
        </style>
        </head>
        <body>${contenido.innerHTML}</body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

function imprimirPropuesta() {
    const contenido = document.getElementById('vistaPrevia');
    if (!contenido) return;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Propuesta Comercial</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2cm; }
            ${document.querySelector('style')?.innerHTML || ''}
        </style>
        </head>
        <body>${contenido.innerHTML}</body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

// Ver, editar, eliminar propuestas
async function verPropuesta(id) {
    try {
        const response = await fetch(`${API_URL}/propuestas/${id}`);
        const propuesta = await response.json();
        const modal = document.getElementById('detalleModal');
        const body = document.getElementById('detalleBody');
        
        body.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
                    <div>
                        <img src="/assets/logo.png" style="height: 40px;">
                        <p style="font-size: 11px; color: #64748b;">${empresaData.direccion}<br>Tel: ${empresaData.telefono}</p>
                    </div>
                    <div style="text-align: right;">
                        ${propuesta.logo_personalizado ? `<img src="${propuesta.logo_personalizado}" style="max-height: 60px;">` : ''}
                        <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${propuesta.numero_propuesta}</div>
                    </div>
                </div>
                <h3>Cliente: ${propuesta.cliente_nombre}</h3>
                <p>Fecha: ${propuesta.fecha_emision} | Válida hasta: ${propuesta.fecha_validez || 'N/A'}</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <thead><tr style="background: #f1f5f9;"><th>Descripción</th><th>Modelo</th><th>Referencia</th><th>Valor</th><th>Total</th></tr></thead>
                    <tbody>
                        ${(Array.isArray(propuesta.productos) ? propuesta.productos : []).map(p => `
                            <tr>
                                <td>${p.descripcion}</td>
                                <td>${p.modelo}</td>
                                <td>${p.referencia}</td>
                                <td>$${p.valor.toLocaleString()}</td>
                                <td>$${(p.valor * 1.19).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="text-align: right;"><strong>Total: $${propuesta.total.toLocaleString()}</strong></div>
                ${propuesta.notas ? `<div style="margin-top: 15px;"><strong>Notas:</strong><br>${propuesta.notas}</div>` : ''}
            </div>
        `;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
    }
}

async function editarPropuesta(id) {
    try {
        const response = await fetch(`${API_URL}/propuestas/${id}`);
        const propuesta = await response.json();
        
        document.getElementById('numero_propuesta').value = propuesta.numero_propuesta;
        document.getElementById('fecha_emision').value = propuesta.fecha_emision;
        document.getElementById('fecha_validez').value = propuesta.fecha_validez || '';
        document.getElementById('cliente_id').value = propuesta.cliente_id || '';
        document.getElementById('cliente_nombre').value = propuesta.cliente_nombre;
        document.getElementById('cliente_contacto').value = propuesta.cliente_contacto || '';
        document.getElementById('cliente_email').value = propuesta.cliente_email || '';
        document.getElementById('cliente_telefono').value = propuesta.cliente_telefono || '';
        document.getElementById('cliente_direccion').value = propuesta.cliente_direccion || '';
        document.getElementById('vendedor').value = propuesta.vendedor || '';
        document.getElementById('estado').value = propuesta.estado;
        document.getElementById('notas').value = propuesta.notas || '';
        document.getElementById('terminos').value = propuesta.terminos || '';
        
        if (propuesta.logo_personalizado) {
            logoPersonalizadoBase64 = propuesta.logo_personalizado;
            document.getElementById('preview_logo_personalizado').innerHTML = `<img src="${logoPersonalizadoBase64}" style="max-width: 150px;">`;
        }
        
        const tbody = document.getElementById('productosBody');
        tbody.innerHTML = '';
        propuesta.productos.forEach(p => {
            const newRow = document.createElement('tr');
            newRow.className = 'producto-row';
            newRow.innerHTML = `
                <td><input type="text" class="producto-descripcion" value="${p.descripcion.replace(/"/g, '&quot;')}"></td>
                <td><input type="text" class="producto-modelo" value="${p.modelo.replace(/"/g, '&quot;')}"></td>
                <td><input type="text" class="producto-referencia" value="${p.referencia.replace(/"/g, '&quot;')}"></td>
                <td><input type="number" class="producto-valor" step="0.01" value="${p.valor}" style="width: 110px;"></td>
                <td class="producto-iva">$${(p.valor * 0.19).toLocaleString()}</td>
                <td class="producto-total">$${(p.valor * 1.19).toLocaleString()}</td>
                <td><button type="button" class="btn-eliminar-fila" onclick="eliminarFilaProducto(this)">🗑️</button></td>
            `;
            tbody.appendChild(newRow);
        });
        
        recalcularTotales();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        mostrarNotificacion('Cargando propuesta para editar...', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function eliminarPropuesta(id) {
    if (confirm('¿Eliminar esta propuesta?')) {
        try {
            await fetch(`${API_URL}/propuestas/${id}`, { method: 'DELETE' });
            await cargarPropuestas();
            mostrarNotificacion('Propuesta eliminada', 'success');
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

async function exportarPDFPropuesta(id) {
    const response = await fetch(`${API_URL}/propuestas/${id}`);
    const propuesta = await response.json();
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Propuesta ${propuesta.numero_propuesta}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2cm; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .numero { font-size: 22px; font-weight: bold; color: #ef4444; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f1f5f9; }
        </style>
        </head>
        <body>
            <div class="header">
                <div><img src="/assets/logo.png" style="height: 40px;"><p>${empresaData.direccion}</p></div>
                <div class="numero">${propuesta.numero_propuesta}</div>
            </div>
            <h3>Cliente: ${propuesta.cliente_nombre}</h3>
            <p>Fecha: ${propuesta.fecha_emision} | Válida: ${propuesta.fecha_validez || 'N/A'}</p>
            <table><thead><tr><th>Descripción</th><th>Modelo</th><th>Referencia</th><th>Valor</th><th>Total</th></tr></thead>
            <tbody>${propuesta.productos.map(p => `<tr><td>${p.descripcion}</td><td>${p.modelo}</td><td>${p.referencia}</td><td>$${p.valor.toLocaleString()}</td><td>$${(p.valor * 1.19).toLocaleString()}</td></tr>`).join('')}</tbody></table>
            <h3>Total: $${propuesta.total.toLocaleString()}</h3>
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

function cerrarModal() {
    document.getElementById('detalleModal').style.display = 'none';
}

function imprimirPropuestaModal() {
    const contenido = document.getElementById('detalleBody').cloneNode(true);
    const ventana = window.open('', '_blank');
    ventana.document.write(`<html><head><title>Propuesta</title><style>body{margin:2cm;}</style></head><body>${contenido.innerHTML}</body></html>`);
    ventana.document.close();
    ventana.print();
}