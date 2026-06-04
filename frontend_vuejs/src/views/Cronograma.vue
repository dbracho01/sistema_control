<template>
  <div class="app-wrapper">
    <Navbar />
    
    <div class="app-container">
      <Sidebar :stats="stats" />
      
      <div class="main-content">
        <div class="tabs">
          <button v-for="tab in tabs" :key="tab.path" 
            :class="['tab', { active: $route.path === tab.path }]"
            @click="navigateTo(tab.path)">
            {{ tab.icon }} {{ tab.name }}
          </button>
          <button class="tab logout" @click="handleLogout">🔒 Logout</button>
        </div>
        
        <!-- Add Equipment Form -->
        <div class="form-container">
          <h2>Add New Equipment</h2>
          <form @submit.prevent="handleSubmit" class="form-grid">
            <div class="form-group">
              <label>Equipment</label>
              <input type="text" v-model="form.equipo" placeholder="e.g., Arco en C" required>
            </div>
            <div class="form-group">
              <label>Client</label>
              <select v-model="form.cliente_id" @change="onClientChange">
                <option :value="null">Select a client...</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" v-model="form.ubicacion" placeholder="e.g., Bogotá" required>
            </div>
            <div class="form-group">
              <label>Warranty Start</label>
              <input type="date" v-model="form.garantia_inicio" required>
            </div>
            <div class="form-group">
              <label>Warranty End</label>
              <input type="date" v-model="form.garantia_fin" required>
            </div>
            <div class="form-group">
              <label>Pending Maint.</label>
              <input type="number" v-model.number="form.mtos_pendientes" min="0">
            </div>
            <div class="form-group">
              <label>Completed Maint.</label>
              <input type="number" v-model.number="form.mtos_realizados" min="0">
            </div>
            <div class="form-group">
              <label>Next Maint.</label>
              <input type="date" v-model="form.mtto_inicio">
            </div>
            <div class="form-group full-width">
              <label>Observations</label>
              <textarea v-model="form.observaciones" rows="3"></textarea>
            </div>
            <div class="form-group full-width">
              <button type="submit" class="btn-guardar">{{ editingId ? 'Update Equipment' : 'Save Equipment' }}</button>
            </div>
          </form>
        </div>
        
        <!-- Equipment Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Equipment</th><th>Client</th><th>Location</th>
                <th>Origin</th><th>Maint.</th><th>Warranty End</th>
                <th>Status</th><th>Next Maint.</th><th>Observations</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="equiposStore.loading">
                <td colspan="11" class="loading">Loading equipments...</td>
              </tr>
              <tr v-else-if="equiposStore.equipos.length === 0">
                <td colspan="11" class="loading">No equipments registered</td>
              </tr>
              <tr v-for="equipo in paginatedEquipos" :key="equipo.id">
                <td>{{ equipo.id }}</td>
                <td><strong>{{ equipo.equipo }}</strong></td>
                <td>{{ equipo.cliente }}</td>
                <td>{{ equipo.ubicacion }}</td>
                <td>{{ getOrigin(equipo) }}</td>
                <td>{{ equipo.mtos_realizados || 0 }}/{{ equipo.mtos_pendientes || 0 }}</td>
                <td>{{ formatDate(equipo.garantia_fin) }}</td>
                <td><span :class="getWarrantyClass(equipo.garantia_fin)">{{ getWarrantyText(equipo.garantia_fin) }}</span></td>
                <td :class="getMaintClass(equipo.mtto_inicio)">{{ formatDate(equipo.mtto_inicio) || 'Not scheduled' }}</td>
                <td class="observations-cell" :title="equipo.observaciones">{{ truncate(equipo.observaciones, 30) }}</td>
                <td class="actions-cell">
                  <button class="btn-accion editar" @click="editEquipo(equipo)">✏️ Edit</button>
                  <button class="btn-accion eliminar" @click="deleteEquipo(equipo.id)">🗑️ Delete</button>
                  <button class="btn-accion ver" @click="viewDetails(equipo)">👁️ View</button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <Pagination 
            :current-page="equiposStore.currentPage"
            :total-pages="equiposStore.totalPages"
            :total-items="equiposStore.total"
            @page-changed="equiposStore.setPage" />
        </div>
      </div>
    </div>
    
    <!-- Details Modal -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Equipment Details</h2>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="details-card">
            <div class="details-grid">
              <div class="details-item"><div class="details-label">Equipment</div><div class="details-value"><strong>{{ selectedEquipo?.equipo }}</strong></div></div>
              <div class="details-item"><div class="details-label">Client</div><div class="details-value">{{ selectedEquipo?.cliente }}</div></div>
              <div class="details-item"><div class="details-label">Location</div><div class="details-value">{{ selectedEquipo?.ubicacion }}</div></div>
              <div class="details-item"><div class="details-label">Origin</div><div class="details-value">{{ getOrigin(selectedEquipo) }}</div></div>
              <div class="details-item"><div class="details-label">Warranty</div><div class="details-value">{{ formatDate(selectedEquipo?.garantia_inicio) }} to {{ formatDate(selectedEquipo?.garantia_fin) }}</div></div>
              <div class="details-item"><div class="details-label">Maintenance</div><div class="details-value">{{ selectedEquipo?.mtos_realizados || 0 }} of {{ selectedEquipo?.mtos_pendientes || 0 }} completed</div></div>
              <div class="details-item full-width"><div class="details-label">Observations</div><div class="details-value">{{ selectedEquipo?.observaciones || 'No observations' }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useEquiposStore } from '../store'
import api from '../services/api'
import Navbar from '../components/Navbar.vue'
import Sidebar from '../components/Sidebar.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const equiposStore = useEquiposStore()

const clients = ref([])
const editingId = ref(null)
const showModal = ref(false)
const selectedEquipo = ref(null)

const form = ref({
  equipo: '', cliente_id: null, ubicacion: '', garantia_inicio: '',
  garantia_fin: '', mtto_inicio: '', mtos_pendientes: 0, mtos_realizados: 0, observaciones: ''
})

const tabs = [
  { name: '📋 Cronograma', path: '/', icon: '📋' },
  { name: '📊 Reportes', path: '/reportes', icon: '📊' },
  { name: '💰 Cotizaciones', path: '/cotizaciones', icon: '💰' },
  { name: '👥 Clientes', path: '/clientes', icon: '👥' },
  { name: '📦 Productos', path: '/productos', icon: '📦' },
  { name: '📄 Propuestas', path: '/propuestas', icon: '📄' }
]

if (authStore.hasPermission('usuarios') || authStore.user?.username === 'admin') {
  tabs.push({ name: '👑 Admin', path: '/admin-usuarios', icon: '👑' })
}

const stats = computed(() => equiposStore.stats)
const paginatedEquipos = computed(() => equiposStore.paginatedEquipos)

onMounted(async () => {
  await equiposStore.fetchEquipos()
  await loadClients()
  if (route.query.ver) {
    const equipo = equiposStore.equipos.find(e => e.id === parseInt(route.query.ver))
    if (equipo) viewDetails(equipo)
  }
})

const loadClients = async () => {
  try {
    const res = await api.get('/clientes')
    clients.value = res.data
  } catch (error) { console.error('Error loading clients:', error) }
}

const onClientChange = () => {
  const client = clients.value.find(c => c.id === form.value.cliente_id)
  if (client) form.value.cliente = client.nombre
}

const handleSubmit = async () => {
  const data = { ...form.value, cliente: clients.value.find(c => c.id === form.value.cliente_id)?.nombre || '' }
  const result = await equiposStore.saveEquipo(data, editingId.value)
  if (result.success) {
    resetForm()
    alert(editingId.value ? 'Equipment updated' : 'Equipment saved')
  } else {
    alert('Error: ' + result.error)
  }
}

const editEquipo = (equipo) => {
  editingId.value = equipo.id
  form.value = { ...equipo, cliente_id: equipo.cliente_id || null }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteEquipo = async (id) => {
  if (confirm('Delete this equipment?')) {
    const result = await equiposStore.deleteEquipo(id)
    if (result.success) alert('Equipment deleted')
  }
}

const viewDetails = (equipo) => {
  selectedEquipo.value = equipo
  showModal.value = true
}

const resetForm = () => {
  editingId.value = null
  form.value = { equipo: '', cliente_id: null, ubicacion: '', garantia_inicio: '', garantia_fin: '', mtto_inicio: '', mtos_pendientes: 0, mtos_realizados: 0, observaciones: '' }
}

const closeModal = () => { showModal.value = false; selectedEquipo.value = null }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }

const formatDate = (date) => date ? new Date(date).toLocaleDateString('es-ES') : ''
const truncate = (str, len) => str && str.length > len ? str.substring(0, len) + '...' : str || '-'
const getOrigin = (e) => e?.importado ? 'Imported' : e?.nacionalizado ? 'National' : '-'

const getWarrantyClass = (date) => {
  const days = calculateDaysRemaining(date)
  if (days < 0) return 'estado-garantia vencido'
  if (days <= 30) return 'estado-garantia proximo'
  return 'estado-garantia vigente'
}

const getWarrantyText = (date) => {
  const days = calculateDaysRemaining(date)
  if (days < 0) return 'Expired'
  if (days <= 30) return 'Expiring soon'
  return 'Active'
}

const getMaintClass = (date) => {
  if (!date) return ''
  const days = calculateDaysRemaining(date)
  if (days < 0) return 'fecha-manto urgente'
  if (days <= 7) return 'fecha-manto proximo'
  return ''
}

const calculateDaysRemaining = (dateStr) => {
  if (!dateStr) return 999
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
</script>