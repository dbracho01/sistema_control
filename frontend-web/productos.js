const API_URL = 'http://127.0.0.1:8000';

let responsablesTemp = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

function agregarResponsable() {
    const container = document.getElementById('responsables-container');
    const newDiv = document.createElement('div');
    newDiv.className = 'responsable-item';
    newDiv.innerHTML = `
        <input type="text" class="responsable-input" placeholder="Nombre del responsable" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
        <button type="button" class="btn-eliminar-responsable" onclick="this.parentElement.remove()" style="background: #dc2626; color: white; border: none; border-radius: 6px; width: 32px; height: 32px; cursor: pointer;">✖</button>
    `;
    container.appendChild(newDiv);
}

document.getElementById('productoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 🔹 1. SUBIR IMAGEN PRIMERO (si hay)
    let imagen_url = '';
    const fileInput = document.getElementById('imagen');
    
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
                imagen_url = uploadData.imagen_url;
                console.log("✅ Imagen subida:", imagen_url);
            } else {
                console.error("❌ Error subiendo imagen:", uploadResponse.status);
            }
        } catch (error) {
            console.error('Error subiendo imagen:', error);
        }
    }
    
    // 🔹 2. RECOLECTAR RESPONSABLES
    const responsables = [];
    document.querySelectorAll('.responsable-input').forEach(input => {
        if (input.value.trim()) {
            responsables.push(input.value.trim());
        }
    });

    // 🔹 3. CREAR OBJETO DATOS CON LA URL DE LA IMAGEN
    const datos = {
        nombre_producto: document.getElementById('nombre_producto').value,
        numero_pieza: document.getElementById('numero_pieza').value,
        transporte: document.getElementById('transporte').value,
        seguro: document.getElementById('seguro').value,
        valor_fob: parseFloat(document.getElementById('valor_fob').value) || 0,
        tipo_producto: document.getElementById('tipo_producto').value,
        linea: document.getElementById('linea').value,
        referencia: document.getElementById('referencia').value,
        activo: document.getElementById('activo').checked,
        precios: {
            USD: parseFloat(document.getElementById('precio_usd').value) || 0,
            EUR: parseFloat(document.getElementById('precio_eur').value) || 0,
            COP: parseFloat(document.getElementById('precio_cop').value) || 0,
            VES: parseFloat(document.getElementById('precio_ves').value) || 0
        },
        iva_porcentaje: parseFloat(document.getElementById('iva_porcentaje').value) || 19,
        cantidad_stock: parseInt(document.getElementById('cantidad_stock').value) || 0,
        responsables: responsables,
        descripcion: document.getElementById('descripcion').value,
        imagen_url: imagen_url   // 🔹 URL de la imagen subida
    };

    console.log("📦 Datos a enviar:", datos);

    try {
        const response = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            alert('✅ Producto guardado');
            document.getElementById('productoForm').reset();
            document.getElementById('responsables-container').innerHTML = `
                <div class="responsable-item">
                    <input type="text" class="responsable-input" placeholder="Nombre del responsable" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    <button type="button" class="btn-agregar" onclick="agregarResponsable()" style="background: #10b981; color: white; border: none; border-radius: 6px; width: 32px; height: 32px; cursor: pointer;">+</button>
                </div>
            `;
            // Limpiar vista previa de imagen
            const preview = document.getElementById('preview-imagen');
            if (preview) preview.innerHTML = '';
            cargarProductos();
        } else {
            alert('❌ Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
});

async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const productos = await response.json();
        
        const tbody = document.getElementById('productosBody');
        tbody.innerHTML = '';
        
        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay productos registrados</td></tr>';
            return;
        }
        
        productos.forEach(p => {
            const tr = document.createElement('tr');
            
            // Mostrar miniatura de imagen si existe
            let imagenHtml = '-';
            if (p.imagen_url) {
                imagenHtml = `<img src="${p.imagen_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">`;
            }
            
            tr.innerHTML = `
                <td>${p.id}</td>
                <td><strong>${p.nombre_producto}</strong></td>
                <td>${p.numero_pieza || '-'}</td>
                <td>${p.linea}</td>
                <td>${p.cantidad_stock}</td>
                <td>$${p.precios?.USD || 0}</td>
                <td>${p.activo ? 'Activo' : 'Inactivo'}</td>
                <td>${imagenHtml}</td>
                <td>
                    <button onclick="editarProducto(${p.id})" style="background: none; border: none; cursor: pointer; font-size: 18px;">✏️</button>
                    <button onclick="eliminarProducto(${p.id})" style="background: none; border: none; cursor: pointer; font-size: 18px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function editarProducto(id) {
    alert('Editar producto ' + id);
}

async function eliminarProducto(id) {
    if (confirm('¿Eliminar producto?')) {
        try {
            const response = await fetch(`${API_URL}/productos/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('✅ Producto eliminado');
                cargarProductos();
            } else {
                alert('❌ Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}