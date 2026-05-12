const API_URL = 'http://127.0.0.1:8000';
let clienteEnEdicion = null;

// Paginación
let todosLosClientes = [];
let paginaActual = 1;
const clientesPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    
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
            const totalPaginas = Math.ceil(todosLosClientes.length / clientesPorPagina);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarPagina();
            }
        });
    }
});

// Evento delegado para el botón Editar (funciona aunque los botones se creen después)
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-accion');
    if (btn && btn.textContent.includes('✏️')) {
        e.preventDefault();
        const id = btn.getAttribute('onclick');
        if (id) {
            const match = id.match(/\d+/);
            if (match) {
                editarCliente(parseInt(match[0]));
            }
        }
    }
});

document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        identificacion: document.getElementById('identificacion').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        contacto: document.getElementById('contacto').value,
        asignado_a: document.getElementById('asignado_a').value,
        activo: document.getElementById('activo').checked,
        notas: document.getElementById('notas').value
    };
    
    try {
        let url = `${API_URL}/clientes`;
        let method = 'POST';
        
        if (clienteEnEdicion) {
            url = `${API_URL}/clientes/${clienteEnEdicion}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            alert(clienteEnEdicion ? '✅ Cliente actualizado' : '✅ Cliente guardado');
            document.getElementById('clienteForm').reset();
            document.getElementById('activo').checked = true;
            clienteEnEdicion = null;
            document.querySelector('.btn-guardar').textContent = 'Guardar Cliente';
            cargarClientes();
        } else {
            alert('❌ Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
});

async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        const clientes = await response.json();
        todosLosClientes = clientes;
        paginaActual = 1;
        renderizarPagina();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('clientesBody').innerHTML = '<tr><td colspan="9" class="loading">Error al cargar clientes<\/td><\/tr>';
    }
}

function renderizarPagina() {
    const tbody = document.getElementById('clientesBody');
    const totalPaginas = Math.ceil(todosLosClientes.length / clientesPorPagina);
    
    if (todosLosClientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No hay clientes registrados<\/td><\/tr>';
        actualizarPaginacion(0, 0, 0);
        return;
    }
    
    const inicio = (paginaActual - 1) * clientesPorPagina;
    const fin = Math.min(inicio + clientesPorPagina, todosLosClientes.length);
    const clientesPagina = todosLosClientes.slice(inicio, fin);
    
    tbody.innerHTML = '';
    clientesPagina.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.id}</td>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.identificacion || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.telefono || '-'}</td>
            <td>${c.ciudad || '-'}</td>
            <td>${c.asignado_a || '-'}</td>
            <td><span class="estado-badge ${c.activo ? 'estado-activo' : 'estado-inactivo'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="acciones-cell">
                <button class="btn-accion ver" onclick="verCliente(${c.id})">👁️ Ver</button>
                <button class="btn-accion editar" onclick="editarCliente(${c.id})">✏️ Editar</button>
                <button class="btn-accion eliminar" onclick="eliminarCliente(${c.id})">🗑️ Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    actualizarPaginacion(inicio + 1, fin, todosLosClientes.length);
    renderizarNumerosPagina(totalPaginas);
}

function actualizarPaginacion(inicio, fin, total) {
    const pagInfo = document.getElementById('paginationInfo');
    if (pagInfo) {
        pagInfo.textContent = total === 0 ? 'Mostrando 0-0 de 0 clientes' : `Mostrando ${inicio}-${fin} de ${total} clientes`;
    }
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = paginaActual === 1;
    if (nextBtn) nextBtn.disabled = paginaActual === Math.ceil(todosLosClientes.length / clientesPorPagina);
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

async function editarCliente(id) {
    console.log("Editando cliente ID:", id);
    
    try {
        const response = await fetch(`${API_URL}/clientes/${id}`);
        const cliente = await response.json();
        
        document.getElementById('nombre').value = cliente.nombre || '';
        document.getElementById('identificacion').value = cliente.identificacion || '';
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('direccion').value = cliente.direccion || '';
        document.getElementById('ciudad').value = cliente.ciudad || '';
        document.getElementById('contacto').value = cliente.contacto || '';
        document.getElementById('asignado_a').value = cliente.asignado_a || '';
        document.getElementById('activo').checked = cliente.activo || false;
        document.getElementById('notas').value = cliente.notas || '';
        
        clienteEnEdicion = id;
        const btnGuardar = document.querySelector('.btn-guardar');
        if (btnGuardar) {
            btnGuardar.textContent = 'Actualizar Cliente';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar cliente");
    }
}

async function eliminarCliente(id) {
    if (confirm('¿Eliminar cliente?')) {
        try {
            const response = await fetch(`${API_URL}/clientes/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('✅ Cliente eliminado');
                cargarClientes();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
function verCliente(id) {
    console.log("Ver cliente ID:", id);
    fetch(`${API_URL}/clientes/${id}`)
        .then(response => response.json())
        .then(cliente => {
            alert(`📋 CLIENTE\nID: ${cliente.id}\nNombre: ${cliente.nombre}\nEmail: ${cliente.email || 'N/A'}\nTeléfono: ${cliente.telefono || 'N/A'}\nDirección: ${cliente.direccion || 'N/A'}`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el cliente');
        });
}