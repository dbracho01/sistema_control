const API_URL = 'http://127.0.0.1:8000';
let clienteEnEdicion = null;

// Paginación
let todosLosClientes = [];
let paginaActual = 1;
const clientesPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();

    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarPagina();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(todosLosClientes.length / clientesPorPagina);
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarPagina();
        }
    });
});

// FORMULARIO
document.getElementById('clienteForm')?.addEventListener('submit', async (e) => {
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

        // 🔴 CORRECCIÓN IMPORTANTE AQUÍ
        activo: document.getElementById('activo').value === "true",

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
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            alert(clienteEnEdicion ? 'Cliente actualizado' : 'Cliente guardado');

            document.getElementById('clienteForm').reset();
            document.getElementById('activo').value = "true";

            clienteEnEdicion = null;

            document.querySelector('.btn-guardar').textContent = 'Guardar Cliente';

            cargarClientes();
        } else {
            alert('Error al guardar cliente');
        }

    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor');
    }
});

// CARGAR CLIENTES
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);

        if (!response.ok) {
            throw new Error("Servidor no disponible");
        }

        const clientes = await response.json();

        todosLosClientes = clientes;
        paginaActual = 1;

        renderizarPagina();

    } catch (error) {
        console.error('Error:', error);

        document.getElementById('clientesBody').innerHTML =
            '<tr><td colspan="10" class="loading">Error al cargar clientes</td></tr>';
    }
}

// RENDER PAGINA
function renderizarPagina() {
    const tbody = document.getElementById('clientesBody');

    if (!todosLosClientes.length) {
        tbody.innerHTML =
            '<tr><td colspan="10" class="loading">No hay clientes</td></tr>';
        return;
    }

    const inicio = (paginaActual - 1) * clientesPorPagina;
    const fin = inicio + clientesPorPagina;

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
            <td>${c.contacto || '-'}</td>
            <td>${c.asignado_a || '-'}</td>

            <td>
                <span class="estado-badge ${c.activo ? 'vigente' : 'vencido'}">
                    ${c.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>

            <td class="acciones">
                <button class="btn-accion ver" onclick="verCliente(${c.id})">👁 Ver</button>
                <button class="btn-accion editar" onclick="editarCliente(${c.id})">✏ Editar</button>
                <button class="btn-accion eliminar" onclick="eliminarCliente(${c.id})">🗑 Eliminar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// EDITAR
async function editarCliente(id) {
    try {
        const res = await fetch(`${API_URL}/clientes/${id}`);
        const cliente = await res.json();

        document.getElementById('nombre').value = cliente.nombre || '';
        document.getElementById('identificacion').value = cliente.identificacion || '';
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('direccion').value = cliente.direccion || '';
        document.getElementById('ciudad').value = cliente.ciudad || '';
        document.getElementById('contacto').value = cliente.contacto || '';
        document.getElementById('asignado_a').value = cliente.asignado_a || '';

        document.getElementById('activo').value = cliente.activo ? "true" : "false";

        document.getElementById('notas').value = cliente.notas || '';

        clienteEnEdicion = id;

        document.querySelector('.btn-guardar').textContent = 'Actualizar Cliente';

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert("Error al cargar cliente");
    }
}

// ELIMINAR
async function eliminarCliente(id) {
    if (!confirm('¿Eliminar cliente?')) return;

    try {
        const res = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            cargarClientes();
        }

    } catch (error) {
        console.error(error);
    }
}

// VER
function verCliente(id) {
    fetch(`${API_URL}/clientes/${id}`)
        .then(r => r.json())
        .then(c => {
            alert(
                `Cliente:\n\nNombre: ${c.nombre}\nEmail: ${c.email || 'N/A'}\nTel: ${c.telefono || 'N/A'}`
            );
        })
        .catch(() => alert("Error al cargar cliente"));
}