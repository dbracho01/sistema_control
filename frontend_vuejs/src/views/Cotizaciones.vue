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

        <div class="cotizaciones-container">
          <h2>Quote Management</h2>
          
          <form @submit.prevent="saveCotizacion" class="form-section">
            <h3>General Information</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>Quote Number *</label>
                <input type="text" v-model="form.numero_cotizacion" required placeholder="e.g., COT-001">
              </div>
              <div class="form-field">
                <label>Creation Date</label>
                <input type="date" v-model="form.fecha_creacion" required>
              </div>
              <div class="form-field">
                <label>Valid Until</label>
                <input type="date" v-model="form.fecha_validez">
              </div>
              <div class="form-field">
                <label>Client</label>
                <select v-model="form.cliente_id" @change="onClientChange">
                  <option :value="null">Select client...</option>
                  <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="form-field">
                <label>Client Name *</label>
                <input type="text" v-model="form.cliente_nombre" required placeholder="Client name">
              </div>
              <div class="form-field">
                <label>Status</label>
                <select v-model="form.estado">
                  <option value="Pendiente">Pending</option>
                  <option value="Aprobada">Approved</option>
                  <option value="Rechazada">Rejected</option>
                  <option value="Enviada">Sent</option>
                </select>
              </div>
            </div>
          </form>

          <div class="form-section">
            <h3>Products</h3>
            <table class="productos-table">
              <thead>
                <tr><th>Product</th><th>Reference</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in productos" :key="index" class="producto-row">
                  <td><input type="text" v-model="item.nombre" placeholder="Product name"></td>
                  <td><input type="text" v-model="item.referencia" placeholder="Reference"></td>
                  <td><input type="number" v-model.number="item.cantidad" min="1" style="width: 80px;" @input="calculateTotals"></td>
                  <td><input type="number" v-model.number="item.precio_unitario" step="0.01" style="width: 100px;" @input="calculateTotals"></td>
                  <td class="producto-subtotal">${{ formatNumber(item.cantidad * item.precio_unitario) }}</td>
                  <td><button type="button" class="btn-eliminar" @click="removeProduct(index)">🗑️</button></td>
                </tr>
              </tbody>
            </table>
            <button type="button" class="btn-agregar-producto" @click="addProduct">+ Add Product</button>
            
            <div class="totales">
              <p><strong>Subtotal:</strong> ${{ formatNumber(subtotal) }}</p>
              <p><strong>IVA (19%):</strong> ${{ formatNumber(iva) }}</p>
              <p class="total-final"><strong>TOTAL:</strong> ${{ formatNumber(total) }}</p>
            </div>
          </div>

          <div class="form-section">
            <h3>Notes & Conditions</h3>
            <div class="form-field">
              <label>Additional Notes</label>
              <textarea v-model="form.notas" rows="3" placeholder="Additional observations..."></textarea>
            </div>
            <div class="form-field" style="margin-top: 15px;">
              <label>General Conditions</label>
              <textarea v-model="form.condiciones_generales" rows="4" placeholder="Terms and conditions..."></textarea>
            </div>
          </div>

          <div class="acciones">
            <button type="button" class="btn-cancelar" @click="resetForm">Cancel</button>
            <button type="button" class="btn-guardar" @click="saveCotizacion">💾 {{ editingId ? 'Update Quote' : 'Save Quote' }}</button>
          </div>

          <div class="table-container">
            <h3>Registered Quotes</h3>
            <div v-if="loading" class="loading">Loading quotes...</div>
            <div v-else-if="cotizaciones.length === 0" class="loading">No quotes registered</div>
            <div v-else>
              <table>
                <thead>
                  <tr><th>ID</th><th>Number</th><th>Client</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="c in paginatedCotizaciones" :key="c.id">
                    <td>{{ c.id }}</td>
                    <td><strong>{{ c.numero_cotizacion }}</strong></td>
                    <td>{{ c.cliente_nombre }}</td>
                    <td>{{ c.fecha_creacion }}</td>
                    <td>${{ formatNumber(c.total) }}</td>
                    <td><span :class="getStatusClass(c.estado)">{{ c.estado }}</span></td>
                    <td class="actions-cell">
                      <button class="btn-accion ver" @click="viewCotizacion(c.id)">👁️ View</button>
                      <button class="btn-accion editar" @click="editCotizacion(c)">✏️ Edit</button>
                      <button class="btn-accion eliminar" @click="deleteCotizacion(c.id)">🗑️ Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Pagination 
                :current-page="currentPage"
                :total-pages="totalPages"
                :total-items="cotizaciones.length"
                @page-changed="setPage" />
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
import config from '../config'
const router = useRouter()
const authStore = useAuthStore()
const API_URL = config.API_URL

const cotizaciones = ref([])
const clients = ref([])
const loading = ref(false)
const editingId = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

const productos = ref([{ nombre: '', referencia: '', cantidad: 1, precio_unitario: 0 }])

const form = ref({
  numero_cotizacion: '', fecha_creacion: '', fecha_validez: '',
  cliente_id: null, cliente_nombre: '', estado: 'Pendiente',
  notas: '', condiciones_generales: ''
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

const subtotal = computed(() => {
  return productos.value.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0)
})

const iva = computed(() => subtotal.value * 0.19)
const total = computed(() => subtotal.value + iva.value)

const paginatedCotizaciones = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return cotizaciones.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(cotizaciones.value.length / itemsPerPage))

onMounted(() => {
  checkPermission()
  loadCotizaciones()
  loadClients()
  form.value.fecha_creacion = new Date().toISOString().split('T')[0]
})

const checkPermission = () => {
  if (!authStore.hasPermission('cotizaciones') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadClients = async () => {
  try {
    const response = await api.get('/clientes')
    clients.value = response.data
  } catch (error) {
    console.error('Error loading clients:', error)
  }
}

const loadCotizaciones = async () => {
  loading.value = true
  try {
    const response = await api.get('/cotizaciones')
    cotizaciones.value = response.data
  } catch (error) {
    console.error('Error loading quotes:', error)
  } finally {
    loading.value = false
  }
}

const onClientChange = () => {
  const client = clients.value.find(c => c.id === form.value.cliente_id)
  if (client) form.value.cliente_nombre = client.nombre
}

const addProduct = () => {
  productos.value.push({ nombre: '', referencia: '', cantidad: 1, precio_unitario: 0 })
}

const removeProduct = (index) => {
  if (productos.value.length > 1) {
    productos.value.splice(index, 1)
    calculateTotals()
  }
}

const calculateTotals = () => {
  // Vue reactivity handles this via computed properties
}

const formatNumber = (num) => {
  return (num || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const saveCotizacion = async () => {
  const data = {
    ...form.value,
    subtotal: subtotal.value,
    iva: iva.value,
    total: total.value,
    productos: productos.value
  }

  try {
    let response
    if (editingId.value) {
      response = await api.put(`/cotizaciones/${editingId.value}`, data)
    } else {
      response = await api.post('/cotizaciones', data)
    }

    if (response.status === 200 || response.status === 201) {
      alert(editingId.value ? 'Quote updated' : 'Quote saved')
      resetForm()
      loadCotizaciones()
    }
  } catch (error) {
    console.error('Error saving quote:', error)
    alert('Error saving quote')
  }
}

const editCotizacion = (cotizacion) => {
  editingId.value = cotizacion.id
  form.value = {
    numero_cotizacion: cotizacion.numero_cotizacion,
    fecha_creacion: cotizacion.fecha_creacion,
    fecha_validez: cotizacion.fecha_validez,
    cliente_id: cotizacion.cliente_id,
    cliente_nombre: cotizacion.cliente_nombre,
    estado: cotizacion.estado,
    notas: cotizacion.notas || '',
    condiciones_generales: cotizacion.condiciones_generales || ''
  }
  productos.value = cotizacion.productos || [{ nombre: '', referencia: '', cantidad: 1, precio_unitario: 0 }]
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteCotizacion = async (id) => {
  if (!confirm('Delete this quote?')) return
  try {
    await api.delete(`/cotizaciones/${id}`)
    alert('Quote deleted')
    loadCotizaciones()
  } catch (error) {
    console.error('Error deleting quote:', error)
  }
}

const viewCotizacion = (id) => {
  window.open(`${API_URL}/ver-cotizacion/${id}`, '_blank')
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    numero_cotizacion: '', fecha_creacion: new Date().toISOString().split('T')[0],
    fecha_validez: '', cliente_id: null, cliente_nombre: '',
    estado: 'Pendiente', notas: '', condiciones_generales: ''
  }
  productos.value = [{ nombre: '', referencia: '', cantidad: 1, precio_unitario: 0 }]
}

const getStatusClass = (estado) => {
  const classes = {
    'Pendiente': 'estado-pendiente',
    'Aprobada': 'estado-aprobada',
    'Rechazada': 'estado-rechazada',
    'Enviada': 'estado-enviada'
  }
  return `estado-badge ${classes[estado] || ''}`
}

const setPage = (page) => { currentPage.value = page }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.cotizaciones-container {
  max-width: 1200px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.productos-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.productos-table th, .productos-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.productos-table input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-agregar-producto {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  margin-top: 10px;
  cursor: pointer;
}

.btn-eliminar {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ef4444;
}

.totales {
  text-align: right;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.total-final {
  font-size: 18px;
  font-weight: bold;
  color: #2563eb;
}

.estado-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.estado-pendiente { background: #f59e0b20; color: #f59e0b; }
.estado-aprobada { background: #10b98120; color: #10b981; }
.estado-rechazada { background: #ef444420; color: #ef4444; }
.estado-enviada { background: #3b82f620; color: #3b82f6; }
</style>