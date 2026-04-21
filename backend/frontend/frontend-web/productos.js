const API_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

document.getElementById('productoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // SOLO guardamos el nombre del producto
    const datos = {
        nombre_producto: document.getElementById('nombre_producto').value,
        numero_pieza: '',
        transporte: '',
        seguro: '',
        valor_fob: 0,
        tipo_producto: 'producto',
        linea: 'ninguno',
        referencia: '',
        activo: true,
        precios: { USD: 0, EUR: 0, COP: 0, VES: 0 },
        iva_porcentaje: 19,
        cantidad_stock: 0,
        responsables: [],
        descripcion: '',
        imagen_url: ''
    };

    try {
        const response = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            alert('Producto guardado');
            document.getElementById('productoForm').reset();
            cargarProductos();
        } else {
            alert('Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
});

async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const productos = await response.json();
        
        const tbody = document.getElementById('productosBody');
        tbody.innerHTML = '';
        
        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No hay productos</td></tr>';
            return;
        }
        
        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.nombre_producto}</td>
                <td>
                    <button onclick="eliminarProducto(${p.id})">X</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function eliminarProducto(id) {
    if (confirm('Eliminar?')) {
        try {
            await fetch(`${API_URL}/productos/${id}`, {
                method: 'DELETE'
            });
            cargarProductos();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}