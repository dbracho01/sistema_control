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

        <div class="propuestas-container">
          <h2>Commercial Proposals</h2>
          
          <form @submit.prevent="savePropuesta" class="form-section">
            <h3>General Information</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>Proposal Number *</label>
                <input type="text" v-model="form.numero_propuesta" required placeholder="e.g., PROP-001">
              </div>
              <div class="form-field">
                <label>Issue Date *</label>
                <input type="date" v-model="form.fecha_emision" required>
              </div>
              <div class="form-field">
                <label>Valid Until</label>
                <input type="date" v-model="form.fecha_validez">
              </div>
              <div class="form-field">
                <label>Salesperson</label>
                <input type="text" v-model="form.vendedor" placeholder="Salesperson name">
              </div>
              <div class="form-field">
                <label>Status</label>
                <select v-model="form.estado">
                  <option value="Borrador">📝 Draft</option>
                  <option value="Enviada">📨 Sent</option>
                  <option value="Aprobada">✅ Approved</option>
                  <option value="Rechazada">❌ Rejected</option>
                </select>
              </div>
            </div>

            <h3>Client Information</h3>
            <div class="form-grid">
              <div class="form-field full-width">
                <label>Client</label>
                <select v-model="form.cliente_id" @change="onClientChange">
                  <option :value="null">Select existing client...</option>
                  <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="form-field">
                <label>Client Name *</label>
                <input type="text" v-model="form.cliente_nombre" required placeholder="Full name">
              </div>
              <div class="form-field">
                <label>Contact Person</label>
                <input type="text" v-model="form.cliente_contacto" placeholder="Contact name">
              </div>
              <div class="form-field">
                <label>Email</label>
                <input type="email" v-model="form.cliente_email" placeholder="email@example.com">
              </div>
              <div class="form-field">
                <label>Phone</label>
                <input type="text" v-model="form.cliente_telefono" placeholder="Phone number">
              </div>
              <div class="form-field full-width">
                <label>Address</label>
                <input type="text" v-model="form.cliente_direccion" placeholder="Delivery/Installation address">
              </div>
            </div>

            <h3>Products / Equipment</h3>
            <table class="productos-table">
              <thead>
                <tr>
                  <th>Description</th><th>Model</th><th>Reference</th>
                  <th>Unit Value</th><th>IVA (19%)</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in productos" :key="index">
                  <td><input type="text" v-model="item.descripcion" placeholder="Equipment description"></td>
                  <td><input type="text" v-model="item.modelo" placeholder="Model"></td>
                  <td><input type="text" v-model="item.referencia" placeholder="Reference"></td>
                  <td><input type="number" v-model.number="item.valor" step="0.01" @input="calculateTotals"></td>
                  <td class="producto-iva">${{ formatNumber(item.valor * 0.19) }}</td>
                  <td class="producto-total">${{ formatNumber(item.valor * 1.19) }}</td>
                  <td><button type="button" class="btn-eliminar" @click="removeProduct(index)">🗑️</button></td>
                </tr>
              </tbody>
            </table>
            <button type="button" class="btn-agregar-producto" @click="addProduct">+ Add Product</button>
            
            <div class="totales">
              <p><strong>Subtotal:</strong> ${{ formatNumber(subtotal) }}</p>
              <p><strong>Total IVA (19%):</strong> ${{ formatNumber(totalIva) }}</p>
              <p class="total-final"><strong>TOTAL PROPOSAL:</strong> ${{ formatNumber(totalGeneral) }}</p>
            </div>

            <h3>Notes and Terms</h3>
            <div class="form-field">
              <label>Additional Notes</label>
              <textarea v-model="form.notas" rows="3" placeholder="Delivery conditions, warranty, etc..."></textarea>
            </div>
            <div class="form-field">
              <label>Terms and Conditions</label>
              <textarea v-model="form.terminos" rows="4" placeholder="Terms and conditions..."></textarea>
            </div>
          </form>

          <div class="acciones">
            <button type="button" class="btn-cancelar" @click="resetForm">Cancel</button>
            <button type="button" class="btn-guardar" @click="savePropuesta">💾 {{ editingId ? 'Update Proposal' : 'Save Proposal' }}</button>
          </div>

          <div class="table-container">
            <h3>Registered Proposals</h3>
            <div v-if="loading" class="loading">Loading proposals...</div>
            <div v-else-if="propuestas.length === 0" class="loading">No proposals registered</div>
            <div v-else>
              <table>
                <thead>
                  <tr><th>ID</th><th>Number</th><th>Client</th><th>Date</th><th>Salesperson</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in paginatedPropuestas" :key="p.id">
                    <td>{{ p.id }}</td>
                    <td><strong>{{ p.numero_propuesta }}</strong></td>
                    <td>{{ p.cliente_nombre }}</td>
                    <td>{{ p.fecha_emision }}</td>
                    <td>{{ p.vendedor || '-' }}</td>
                    <td>${{ formatNumber(p.total) }}</td>
                    <td><span :class="getStatusClass(p.estado)">{{ getStatusIcon(p.estado) }} {{ p.estado }}</span></td>
                    <td class="actions-cell">
                      <button class="btn-accion ver" @click="viewPropuesta(p)">👁️ View</button>
                      <button class="btn-accion editar" @click="editPropuesta(p)">✏️ Edit</button>
                      <button class="btn-accion eliminar" @click="deletePropuesta(p.id)">🗑️ Delete</button>
                      <button class="btn-accion" @click="exportPDF(p.id)" title="PDF">📄</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Pagination 
                :current-page="currentPage"
                :total-pages="totalPages"
                :total-items="propuestas.length"
                @page-changed="setPage" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Proposal Modal -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h2>Commercial Proposal</h2>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body" v-if="selectedPropuesta">
          <div class="propuesta-documento">
            <div class="propuesta-encabezado">
              <div><img src="/assets/logo.png" style="height: 50px;"><p>{{ empresaData.direccion }}<br>Tel: {{ empresaData.telefono }}</p></div>
              <div class="propuesta-numero">{{ selectedPropuesta.numero_propuesta }}</div>
            </div>
            <div class="cliente-info">
              <h4>CLIENT INFORMATION</h4>
              <p><strong>{{ selectedPropuesta.cliente_nombre }}</strong></p>
              <p>{{ selectedPropuesta.cliente_direccion || '' }} | {{ selectedPropuesta.cliente_telefono || '' }}</p>
            </div>
            <table class="productos-propuesta">
              <thead><tr><th>Description</th><th>Model</th><th>Reference</th><th>Value</th><th>Total</th></tr></thead>
              <tbody>
                <tr v-for="p in selectedPropuesta.productos" :key="p.descripcion">
                  <td>{{ p.descripcion }}</td><td>{{ p.modelo }}</td><td>{{ p.referencia }}</td>
                  <td>${{ formatNumber(p.valor) }}</td><td>${{ formatNumber(p.valor * 1.19) }}</td>
                </tr>
              </tbody>
              <tfoot><tr><td colspan="4"><strong>Total:</strong></td><td><strong>${{ formatNumber(selectedPropuesta.total) }}</strong></td></tr></tfoot>
            </table>
            <div class="terminos"><strong>Terms:</strong><br>{{ selectedPropuesta.terminos }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="printProposal">🖨️ Print</button>
          <button class="btn-cancelar" @click="closeModal">Close</button>
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
const propuestas = ref([])
const clients = ref([])
const loading = ref(false)
const editingId = ref(null)
const showModal = ref(false)
const selectedPropuesta = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

const productos = ref([{ descripcion: '', modelo: '', referencia: '', valor: 0 }])

const empresaData = {
  nombre: "Advanced Radiotherapy Corporation",
  direccion: "Main Street #123, Office 405",
  telefono: "+57 (601) 123-4567"
}

const form = ref({
  numero_propuesta: '', fecha_emision: '', fecha_validez: '',
  cliente_id: null, cliente_nombre: '', cliente_contacto: '',
  cliente_email: '', cliente_telefono: '', cliente_direccion: '',
  vendedor: '', estado: 'Borrador', notas: '', terminos: ''
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

const subtotal = computed(() => productos.value.reduce((sum, p) => sum + p.valor, 0))
const totalIva = computed(() => subtotal.value * 0.19)
const totalGeneral = computed(() => subtotal.value + totalIva.value)

const paginatedPropuestas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return propuestas.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(propuestas.value.length / itemsPerPage))

onMounted(() => {
  checkPermission()
  loadPropuestas()
  loadClients()
  form.value.fecha_emision = new Date().toISOString().split('T')[0]
  const fechaValidez = new Date()
  fechaValidez.setDate(fechaValidez.getDate() + 30)
  form.value.fecha_validez = fechaValidez.toISOString().split('T')[0]
})

const checkPermission = () => {
  if (!authStore.hasPermission('propuestas') && authStore.user?.username !== 'admin') {
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

const loadPropuestas = async () => {
  loading.value = true
  try {
    const response = await api.get('/propuestas')
    propuestas.value = response.data
  } catch (error) {
    console.error('Error loading proposals:', error)
  } finally {
    loading.value = false
  }
}

const onClientChange = () => {
  const client = clients.value.find(c => c.id === form.value.cliente_id)
  if (client) {
    form.value.cliente_nombre = client.nombre
    form.value.cliente_contacto = client.contacto || ''
    form.value.cliente_email = client.email || ''
    form.value.cliente_telefono = client.telefono || ''
    form.value.cliente_direccion = client.direccion || ''
  }
}

const addProduct = () => {
  productos.value.push({ descripcion: '', modelo: '', referencia: '', valor: 0 })
}

const removeProduct = (index) => {
  if (productos.value.length > 1) {
    productos.value.splice(index, 1)
  }
}

const calculateTotals = () => { /* Vue computed handles this */ }

const formatNumber = (num) => {
  return (num || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const savePropuesta = async () => {
  const data = {
    ...form.value,
    subtotal: subtotal.value,
    iva: totalIva.value,
    total: totalGeneral.value,
    productos: productos.value
  }

  try {
    let response
    if (editingId.value) {
      response = await api.put(`/propuestas/${editingId.value}`, data)
    } else {
      response = await api.post('/propuestas', data)
    }

    if (response.status === 200 || response.status === 201) {
      alert(editingId.value ? 'Proposal updated' : 'Proposal saved')
      resetForm()
      loadPropuestas()
    }
  } catch (error) {
    console.error('Error saving proposal:', error)
    alert('Error saving proposal')
  }
}

const editPropuesta = (propuesta) => {
  editingId.value = propuesta.id
  form.value = {
    numero_propuesta: propuesta.numero_propuesta,
    fecha_emision: propuesta.fecha_emision,
    fecha_validez: propuesta.fecha_validez,
    cliente_id: propuesta.cliente_id,
    cliente_nombre: propuesta.cliente_nombre,
    cliente_contacto: propuesta.cliente_contacto || '',
    cliente_email: propuesta.cliente_email || '',
    cliente_telefono: propuesta.cliente_telefono || '',
    cliente_direccion: propuesta.cliente_direccion || '',
    vendedor: propuesta.vendedor || '',
    estado: propuesta.estado,
    notas: propuesta.notas || '',
    terminos: propuesta.terminos || ''
  }
  productos.value = propuesta.productos || [{ descripcion: '', modelo: '', referencia: '', valor: 0 }]
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deletePropuesta = async (id) => {
  if (!confirm('Delete this proposal?')) return
  try {
    await api.delete(`/propuestas/${id}`)
    alert('Proposal deleted')
    loadPropuestas()
  } catch (error) {
    console.error('Error deleting proposal:', error)
  }
}

const viewPropuesta = (propuesta) => {
  selectedPropuesta.value = propuesta
  showModal.value = true
}

const exportPDF = async (id) => {
  try {
    const response = await api.get(`/propuestas/${id}`)
    const propuesta = response.data
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Proposal ${propuesta.numero_propuesta}</title>
      <style>
        body { font-family: Arial; margin: 2cm; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      </style>
      </head>
      <body>
        <div class="header"><div><h2>ART</h2><p>${empresaData.direccion}</p></div>
        <div><h3>${propuesta.numero_propuesta}</h3></div></div>
        <h3>Client: ${propuesta.cliente_nombre}</h3>
        <p>Date: ${propuesta.fecha_emision}</p>
        <table><thead><tr><th>Description</th><th>Model</th><th>Value</th><th>Total</th></tr></thead>
        <tbody>${propuesta.productos.map(p => `<tr><td>${p.descripcion}</td><td>${p.modelo}</td><td>$${p.valor}</td><td>$${p.valor * 1.19}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="3"><strong>Total:</strong></td><td><strong>$${propuesta.total}</strong></td></tr></tfoot>
      每月
      </body></html>
    `)
    win.document.close()
    win.print()
  } catch (error) {
    console.error('Error exporting PDF:', error)
  }
}

const printProposal = () => {
  const printContent = document.querySelector('.propuesta-documento').cloneNode(true)
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>Print Proposal</title><style>body{margin:2cm;}</style></head><body>${printContent.innerHTML}</body></html>`)
  win.document.close()
  win.print()
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    numero_propuesta: '', fecha_emision: new Date().toISOString().split('T')[0],
    fecha_validez: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })(),
    cliente_id: null, cliente_nombre: '', cliente_contacto: '',
    cliente_email: '', cliente_telefono: '', cliente_direccion: '',
    vendedor: '', estado: 'Borrador', notas: '', terminos: ''
  }
  productos.value = [{ descripcion: '', modelo: '', referencia: '', valor: 0 }]
}

const getStatusClass = (estado) => {
  const classes = {
    'Borrador': 'estado-borrador', 'Enviada': 'estado-enviada',
    'Aprobada': 'estado-aprobada', 'Rechazada': 'estado-rechazada'
  }
  return `estado-badge-propuesta ${classes[estado] || ''}`
}

const getStatusIcon = (estado) => {
  const icons = { 'Borrador': '📝', 'Enviada': '📨', 'Aprobada': '✅', 'Rechazada': '❌' }
  return icons[estado] || '📝'
}

const closeModal = () => {
  showModal.value = false
  selectedPropuesta.value = null
}

const setPage = (page) => { currentPage.value = page }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.propuestas-container {
  max-width: 1400px;
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

.form-field.full-width { grid-column: 1 / -1; }

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

.estado-badge-propuesta {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.estado-borrador { background: #f59e0b20; color: #f59e0b; }
.estado-enviada { background: #3b82f620; color: #3b82f6; }
.estado-aprobada { background: #10b98120; color: #10b981; }
.estado-rechazada { background: #ef444420; color: #ef4444; }

.propuesta-documento { padding: 20px; }
.propuesta-encabezado { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
.propuesta-numero { font-size: 24px; font-weight: bold; color: #ef4444; }
.cliente-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.productos-propuesta { width: 100%; border-collapse: collapse; margin: 15px 0; }
.productos-propuesta th, .productos-propuesta td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.terminos { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; }
</style>