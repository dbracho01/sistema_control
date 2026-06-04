<template>
  <div class="app-wrapper">
    <Navbar />
    
    <div class="app-container">
      <div class="main-content">
        <div class="tabs">
          <button v-for="tab in tabs" :key="tab.path" 
            :class="['tab', { active: $route.path === tab.path }]"
            @click="navigateTo(tab.path)">
            {{ tab.icon }} {{ tab.name }}
          </button>
          <button class="tab logout" @click="handleLogout">🔒 Logout</button>
        </div>

        <div class="productos-container">
          <h2>Product Management</h2>
          
          <form @submit.prevent="saveProducto" class="form-section">
            <h3>Product Information</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>Product Name *</label>
                <input type="text" v-model="form.nombre_producto" required placeholder="e.g., Linear Accelerator">
              </div>
              <div class="form-field">
                <label>Part Number</label>
                <input type="text" v-model="form.numero_pieza" placeholder="e.g., AP-2024-001">
              </div>
              <div class="form-field">
                <label>Reference</label>
                <input type="text" v-model="form.referencia" placeholder="e.g., REF-001">
              </div>
              <div class="form-field">
                <label>Line</label>
                <select v-model="form.linea">
                  <option value="ninguno">None</option>
                  <option value="radiologia">Radiology</option>
                  <option value="cardiologia">Cardiology</option>
                  <option value="radioterapia">Radiotherapy</option>
                </select>
              </div>
              <div class="form-field">
                <label>Type</label>
                <select v-model="form.tipo_producto">
                  <option value="producto">Product</option>
                  <option value="accesorio">Accessory</option>
                </select>
              </div>
              <div class="form-field">
                <label>Stock Quantity</label>
                <input type="number" v-model.number="form.cantidad_stock" min="0">
              </div>
              <div class="form-field">
                <label>USD Price</label>
                <input type="number" v-model.number="form.precio_usd" step="0.01">
              </div>
              <div class="form-field checkbox-field">
                <input type="checkbox" id="activo" v-model="form.activo">
                <label for="activo">Active</label>
              </div>
            </div>

            <h3 style="margin-top: 20px;">Responsible Persons</h3>
            <div class="responsables-container">
              <div v-for="(resp, idx) in form.responsables" :key="idx" class="responsable-item">
                <input type="text" v-model="form.responsables[idx]" placeholder="Responsible name">
                <button type="button" class="btn-eliminar-responsable" @click="removeResponsable(idx)">✖</button>
              </div>
              <button type="button" class="btn-agregar-responsable" @click="addResponsable">+ Add Responsible</button>
            </div>

            <h3>Description</h3>
            <div class="form-field">
              <textarea v-model="form.descripcion" rows="3" placeholder="Detailed product description..."></textarea>
            </div>
          </form>

          <div class="acciones">
            <button type="button" class="btn-cancelar" @click="resetForm">Cancel</button>
            <button type="button" class="btn-guardar" @click="saveProducto">💾 {{ editingId ? 'Update Product' : 'Save Product' }}</button>
          </div>

          <div class="table-container">
            <h3>Registered Products</h3>
            <div v-if="loading" class="loading">Loading products...</div>
            <div v-else-if="productos.length === 0" class="loading">No products registered</div>
            <div v-else>
              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Part Number</th><th>Stock</th><th>Responsibles</th><th>USD</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in paginatedProductos" :key="p.id">
                    <td>{{ p.id }}</td>
                    <td><strong>{{ p.nombre_producto }}</strong></td>
                    <td>{{ p.numero_pieza || '-' }}</td>
                    <td>{{ p.cantidad_stock || 0 }}</td>
                    <td>{{ (p.responsables || []).join(', ') || '-' }}</td>
                    <td>${{ formatNumber(p.precios?.USD) }}</td>
                    <td><span :class="p.activo ? 'estado-activo' : 'estado-inactivo'">{{ p.activo ? 'Active' : 'Inactive' }}</span></td>
                    <td class="actions-cell">
                      <button class="btn-accion ver" @click="viewProducto(p)">👁️ View</button>
                      <button class="btn-accion editar" @click="editProducto(p)">✏️ Edit</button>
                      <button class="btn-accion eliminar" @click="deleteProducto(p.id)">🗑️ Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Pagination 
                :current-page="currentPage"
                :total-pages="totalPages"
                :total-items="productos.length"
                @page-changed="setPage" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Product Modal -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Product Details</h2>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <div v-if="selectedProduct" class="details-card">
            <div class="details-grid">
              <div class="details-item"><div class="details-label">Name</div><div class="details-value">{{ selectedProduct.nombre_producto }}</div></div>
              <div class="details-item"><div class="details-label">Part Number</div><div class="details-value">{{ selectedProduct.numero_pieza || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Reference</div><div class="details-value">{{ selectedProduct.referencia || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Line</div><div class="details-value">{{ selectedProduct.linea || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Stock</div><div class="details-value">{{ selectedProduct.cantidad_stock || 0 }}</div></div>
              <div class="details-item"><div class="details-label">USD Price</div><div class="details-value">${{ formatNumber(selectedProduct.precios?.USD) }}</div></div>
              <div class="details-item"><div class="details-label">Responsibles</div><div class="details-value">{{ (selectedProduct.responsables || []).join(', ') || '-' }}</div></div>
              <div class="details-item full-width"><div class="details-label">Description</div><div class="details-value">{{ selectedProduct.descripcion || '-' }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import api from '../services/api'
import Navbar from '../components/Navbar.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const authStore = useAuthStore()

const productos = ref([])
const loading = ref(false)
const editingId = ref(null)
const showModal = ref(false)
const selectedProduct = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

const form = ref({
  nombre_producto: '', numero_pieza: '', referencia: '', linea: 'ninguno',
  tipo_producto: 'producto', cantidad_stock: 0, precio_usd: 0,
  activo: true, descripcion: '', responsables: ['']
})

const tabs = [
  { name: '📋 Schedule', path: '/', icon: '📋' },
  { name: '📊 Reports', path: '/reportes', icon: '📊' },
  { name: '💰 Quotes', path: '/cotizaciones', icon: '💰' },
  { name: '👥 Clients', path: '/clientes', icon: '👥' },
  { name: '📦 Products', path: '/productos', icon: '📦' },
  { name: '📄 Proposals', path: '/propuestas', icon: '📄' }
]

if (authStore.hasPermission('usuarios') || authStore.user?.username === 'admin') {
  tabs.push({ name: '👑 Admin', path: '/admin-usuarios', icon: '👑' })
}

const paginatedProductos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return productos.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(productos.value.length / itemsPerPage))

onMounted(() => {
  checkPermission()
  loadProductos()
})

const checkPermission = () => {
  if (!authStore.hasPermission('productos') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadProductos = async () => {
  loading.value = true
  try {
    const response = await api.get('/productos')
    productos.value = response.data
  } catch (error) {
    console.error('Error loading products:', error)
  } finally {
    loading.value = false
  }
}

const addResponsable = () => {
  form.value.responsables.push('')
}

const removeResponsable = (index) => {
  form.value.responsables.splice(index, 1)
}

const formatNumber = (num) => {
  return (num || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const saveProducto = async () => {
  const responsables = form.value.responsables.filter(r => r.trim())
  
  const data = {
    nombre_producto: form.value.nombre_producto,
    numero_pieza: form.value.numero_pieza,
    referencia: form.value.referencia,
    linea: form.value.linea,
    tipo_producto: form.value.tipo_producto,
    cantidad_stock: form.value.cantidad_stock,
    activo: form.value.activo,
    descripcion: form.value.descripcion,
    responsables: responsables,
    precios: { USD: form.value.precio_usd, EUR: 0, COP: 0, VES: 0 },
    iva_porcentaje: 19
  }

  try {
    let response
    if (editingId.value) {
      response = await api.put(`/productos/${editingId.value}`, data)
    } else {
      response = await api.post('/productos', data)
    }

    if (response.status === 200 || response.status === 201) {
      alert(editingId.value ? 'Product updated' : 'Product saved')
      resetForm()
      loadProductos()
    }
  } catch (error) {
    console.error('Error saving product:', error)
    alert('Error saving product')
  }
}

const editProducto = (producto) => {
  editingId.value = producto.id
  form.value = {
    nombre_producto: producto.nombre_producto,
    numero_pieza: producto.numero_pieza || '',
    referencia: producto.referencia || '',
    linea: producto.linea || 'ninguno',
    tipo_producto: producto.tipo_producto || 'producto',
    cantidad_stock: producto.cantidad_stock || 0,
    precio_usd: producto.precios?.USD || 0,
    activo: producto.activo,
    descripcion: producto.descripcion || '',
    responsables: (producto.responsables && producto.responsables.length) ? [...producto.responsables] : ['']
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteProducto = async (id) => {
  if (!confirm('Delete this product?')) return
  try {
    await api.delete(`/productos/${id}`)
    alert('Product deleted')
    loadProductos()
  } catch (error) {
    console.error('Error deleting product:', error)
  }
}

const viewProducto = (producto) => {
  selectedProduct.value = producto
  showModal.value = true
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    nombre_producto: '', numero_pieza: '', referencia: '', linea: 'ninguno',
    tipo_producto: 'producto', cantidad_stock: 0, precio_usd: 0,
    activo: true, descripcion: '', responsables: ['']
  }
}

const closeModal = () => {
  showModal.value = false
  selectedProduct.value = null
}

const setPage = (page) => { currentPage.value = page }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.productos-container {
  max-width: 1100px;
  margin: 30px auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.form-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.form-section h3 {
  color: #1e293b;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.checkbox-field input { width: 16px; height: 16px; cursor: pointer; }

.responsables-container {
  margin-top: 10px;
}

.responsable-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.responsable-item input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.btn-agregar-responsable {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-eliminar-responsable {
  background: #ef4444;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
}

.estado-activo { background: #10b98120; color: #10b981; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.estado-inactivo { background: #ef444420; color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }

.acciones {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>