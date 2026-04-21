
console.log("✅ cotizaciones.js cargado correctamente");
const API_URL = 'http://127.0.0.1:8000';
let cotizacionEnEdicion = null;

// Paginación
let todasLasCotizaciones = [];
let paginaActual = 1;
const cotizacionesPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    cargarCotizaciones();
    cargarClientes();
    
    document.getElementById('fecha_creacion').valueAsDate = new Date();
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarPagina();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPaginas = Math.ceil(todasLasCotizaciones.length / cotizacionesPorPagina);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarPagina();
            }
        });
    }
    
    // Vista previa de firma
    document.getElementById('firma_digital').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('preview-firma');
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px;">`;
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Recalcular totales cuando cambian los productos
    document.getElementById('productosBody').addEventListener('input', recalcularTotales);
});

async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        const clientes = await response.json();
        const select = document.getElementById('cliente_id');
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            select.appendChild(option);
        });
        
        // Al seleccionar un cliente, autocompletar el nombre
        select.addEventListener('change', function() {
            const cliente = clientes.find(c => c.id == this.value);
            if (cliente) {
                document.getElementById('cliente_nombre').value = cliente.nombre;
            }
        });
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function agregarFilaProducto() {
    const tbody = document.getElementById('productosBody');
    const newRow = document.createElement('tr');
    newRow.className = 'producto-row';
    newRow.innerHTML = `
        <td><input type="text" class="producto-nombre" placeholder="Nombre del producto"></td>
        <td><input type="text" class="producto-referencia" placeholder="Referencia"></td>
        <td><input type="number" class="producto-cantidad" value="1" min="1" style="width: 80px;"></td>
        <td><input type="number" class="producto-precio" step="0.01" value="0" style="width: 100px;"></td>
        <td class="producto-subtotal">$0.00</td>
        <td><button type="button" class="btn-accion" onclick="eliminarFilaProducto(this)">🗑️</button></td>
    `;
    tbody.appendChild(newRow);
}

function eliminarFilaProducto(btn) {
    if (document.querySelectorAll('.producto-row').length > 1) {
        btn.closest('tr').remove();
        recalcularTotales();
    } else {
        alert('Debe haber al menos un producto');
    }
}

function recalcularTotales() {
    let subtotal = 0;
    const filas = document.querySelectorAll('.producto-row');
    
    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.producto-cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.producto-precio').value) || 0;
        const subtotalFila = cantidad * precio;
        fila.querySelector('.producto-subtotal').textContent = `$${subtotalFila.toFixed(2)}`;
        subtotal += subtotalFila;
    });
    
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva_total').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function obtenerProductos() {
    const productos = [];
    const filas = document.querySelectorAll('.producto-row');
    
    filas.forEach(fila => {
        const nombre = fila.querySelector('.producto-nombre').value;
        if (nombre) {
            productos.push({
                nombre: nombre,
                referencia: fila.querySelector('.producto-referencia').value,
                cantidad: parseFloat(fila.querySelector('.producto-cantidad').value) || 0,
                precio_unitario: parseFloat(fila.querySelector('.producto-precio').value) || 0,
                subtotal: (parseFloat(fila.querySelector('.producto-cantidad').value) || 0) * (parseFloat(fila.querySelector('.producto-precio').value) || 0)
            });
        }
    });
    
    return productos;
}

document.getElementById('cotizacionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productos = obtenerProductos();
    const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    
    // Subir firma digital si existe
    let firma_url = '';
    const fileInput = document.getElementById('firma_digital');
    if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            const uploadResponse = await fetch(`${API_URL}/subir-imagen`, {
                method: 'POST',
                body: formData
            });
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                firma_url = uploadData.imagen_url;
            }
        } catch (error) {
            console.error('Error subiendo firma:', error);
        }
    }
    
    const datos = {
        numero_cotizacion: document.getElementById('numero_cotizacion').value,
        fecha_creacion: document.getElementById('fecha_creacion').value,
        fecha_validez: document.getElementById('fecha_validez').value || null,
        cliente_id: document.getElementById('cliente_id').value ? parseInt(document.getElementById('cliente_id').value) : null,
        cliente_nombre: document.getElementById('cliente_nombre').value,
        estado: document.getElementById('estado').value,
        subtotal: subtotal,
        iva: iva,
        total: total,
        productos: productos,
        notas: document.getElementById('notas').value,
        condiciones_generales: document.getElementById('condiciones_generales').value,
        firma_digital: firma_url
    };
    
    try {
        let url = `${API_URL}/cotizaciones`;
        let method = 'POST';
        
        if (cotizacionEnEdicion) {
            url = `${API_URL}/cotizaciones/${cotizacionEnEdicion}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            alert(cotizacionEnEdicion ? '✅ Cotización actualizada' : '✅ Cotización guardada');
            document.getElementById('cotizacionForm').reset();
            cotizacionEnEdicion = null;
            document.querySelector('.btn-guardar').textContent = 'Guardar Cotización';
            cargarCotizaciones();
        } else {
            alert('❌ Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
});

async function cargarCotizaciones() {
    try {
        const response = await fetch(`${API_URL}/cotizaciones`);
        const cotizaciones = await response.json();
        todasLasCotizaciones = cotizaciones;
        paginaActual = 1;
        renderizarPagina();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('cotizacionesBody').innerHTML = '<tr><td colspan="7" class="loading">Error al cargar cotizaciones<\/td><\/tr>';
    }}

function renderizarPagina() {
    const tbody = document.getElementById('cotizacionesBody');
    const totalPaginas = Math.ceil(todasLasCotizaciones.length / cotizacionesPorPagina);
    
    if (todasLasCotizaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay cotizaciones registradas<\/td><\/tr>';
        actualizarPaginacion(0, 0, 0);
        return;
    }
    
    const inicio = (paginaActual - 1) * cotizacionesPorPagina;
    const fin = Math.min(inicio + cotizacionesPorPagina, todasLasCotizaciones.length);
    const cotizacionesPagina = todasLasCotizaciones.slice(inicio, fin);
    
    tbody.innerHTML = '';
    cotizacionesPagina.forEach(c => {
        const tr = document.createElement('tr');
        let estadoClass = '';
        if (c.estado === 'Pendiente') estadoClass = 'estado-pendiente';
        else if (c.estado === 'Aprobada') estadoClass = 'estado-aprobada';
        else if (c.estado === 'Rechazada') estadoClass = 'estado-rechazada';
        else estadoClass = 'estado-enviada';
       
        tr.innerHTML = `
            <td>${c.id}</td>
            <td><strong>${c.numero_cotizacion}</strong></td>
            <td>${c.cliente_nombre}</td>
            <td>${c.fecha_creacion}</td>
            <td>$${c.total?.toFixed(2) || '0.00'}</td>
            <td><span class="estado-badge ${estadoClass}">${c.estado}</span></td>
            <td class="acciones-cell">
               <button class="btn-accion ver" onclick="verCotizacion(${c.id})">👁️ Ver</button>
               <button class="btn-accion editar" onclick="editarCotizacion(${c.id})">✏️ Editar</button>
               <button class="btn-accion eliminar" onclick="eliminarCotizacion(${c.id})">🗑️ Eliminar</button>
           </td>
        `;
        tbody.appendChild(tr);
    });
    
    actualizarPaginacion(inicio + 1, fin, todasLasCotizaciones.length);
    renderizarNumerosPagina(totalPaginas);
}

function actualizarPaginacion(inicio, fin, total) {
    const pagInfo = document.getElementById('paginationInfo');
    if (pagInfo) {
        pagInfo.textContent = total === 0 ? 'Mostrando 0-0 de 0 cotizaciones' : `Mostrando ${inicio}-${fin} de ${total} cotizaciones`;
    }
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = paginaActual === 1;
    if (nextBtn) nextBtn.disabled = paginaActual === Math.ceil(todasLasCotizaciones.length / cotizacionesPorPagina);
}

function renderizarNumerosPagina(totalPaginas) {
    const container = document.getElementById('paginationNumbers');
    if (!container) return;
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

async function editarCotizacion(id) {
    console.log("Editando cotización ID:", id);
    
    try {
        const response = await fetch(`${API_URL}/cotizaciones/${id}`);
        const cotizacion = await response.json();
        
        document.getElementById('numero_cotizacion').value = cotizacion.numero_cotizacion || '';
        document.getElementById('fecha_creacion').value = cotizacion.fecha_creacion || '';
        document.getElementById('fecha_validez').value = cotizacion.fecha_validez || '';
        document.getElementById('cliente_id').value = cotizacion.cliente_id || '';
        document.getElementById('cliente_nombre').value = cotizacion.cliente_nombre || '';
        document.getElementById('estado').value = cotizacion.estado || 'Pendiente';
        document.getElementById('notas').value = cotizacion.notas || '';
        document.getElementById('condiciones_generales').value = cotizacion.condiciones_generales || '';
        
        // Cargar productos
        const tbody = document.getElementById('productosBody');
        tbody.innerHTML = '';
        if (cotizacion.productos && cotizacion.productos.length > 0) {
            cotizacion.productos.forEach(prod => {
                const row = document.createElement('tr');
                row.className = 'producto-row';
                row.innerHTML = `
                    <td><input type="text" class="producto-nombre" value="${prod.nombre.replace(/"/g, '&quot;')}"></td>
                    <td><input type="text" class="producto-referencia" value="${prod.referencia || ''}"></td>
                    <td><input type="number" class="producto-cantidad" value="${prod.cantidad}" min="1" style="width: 80px;"></td>
                    <td><input type="number" class="producto-precio" step="0.01" value="${prod.precio_unitario}" style="width: 100px;"></td>
                    <td class="producto-subtotal">$${(prod.cantidad * prod.precio_unitario).toFixed(2)}</td>
                    <td><button type="button" class="btn-accion" onclick="eliminarFilaProducto(this)">🗑️</button></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            agregarFilaProducto();
        }
        
        recalcularTotales();
        
        cotizacionEnEdicion = id;
        const btnGuardar = document.querySelector('.btn-guardar');
        if (btnGuardar) {
            btnGuardar.textContent = 'Actualizar Cotización';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar cotización");
    }
}

async function eliminarCotizacion(id) {
    if (confirm('¿Eliminar cotización?')) {
        try {
            const response = await fetch(`${API_URL}/cotizaciones/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('✅ Cotización eliminada');
                cargarCotizaciones();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
function verCotizacion(id) {
    window.open(`${API_URL}/ver-cotizacion/${id}`, '_blank');
    }
