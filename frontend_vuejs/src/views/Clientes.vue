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

        <div class="clientes-container">
          <h2>Client Management</h2>
          
          <form @submit.prevent="saveClient" class="form-section">
            <h3>Client Information</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>Name *</label>
                <input type="text" v-model="form.nombre" required placeholder="Full name">
              </div>
              <div class="form-field">
                <label>Identification</label>
                <input type="text" v-model="form.identificacion" placeholder="NIT / ID">
              </div>
              <div class="form-field">
                <label>Email</label>
                <input type="email" v-model="form.email" placeholder="email@example.com">
              </div>
              <div class="form-field">
                <label>Phone</label>
                <input type="text" v-model="form.telefono" placeholder="Contact phone">
              </div>
              <div class="form-field">
                <label>Address</label>
                <input type="text" v-model="form.direccion" placeholder="Address">
              </div>
              <div class="form-field">
                <label>City</label>
                <input type="text" v-model="form.ciudad" placeholder="City">
              </div>
              <div class="form-field">
                <label>Contact Person</label>
                <input type="text" v-model="form.contacto" placeholder="Contact name">
              </div>
              <div class="form-field">
                <label>Assigned to (Sales)</label>
                <input type="text" v-model="form.asignado_a" placeholder="Salesperson name">
              </div>
              <div class="form-field">
                <label>Status</label>
                <select v-model="form.activo">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
              <div class="form-field full-width">
                <label>Notes</label>
                <textarea v-model="form.notas" rows="3" placeholder="Additional observations..."></textarea>
              </div>
            </div>
            <div class="acciones">
              <button type="button" class="btn-cancelar" @click="resetForm">Cancel</button>
              <button type="submit" class="btn-guardar">💾 {{ editingId ? 'Update Client' : 'Save Client' }}</button>
            </div>
          </form>

          <div class="table-container">
            <h3>Registered Clients</h3>
            <div v-if="loading" class="loading">Loading clients...</div>
            <div v-else-if="clientes.length === 0" class="loading">No clients registered</div>
            <div v-else>
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Identification</th><th>Email</th>
                    <th>Phone</th><th>City</th><th>Contact</th><th>Assigned To</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in paginatedClientes" :key="c.id">
                    <td>{{ c.id }}</td>
                    <td><strong>{{ c.nombre }}</strong></td>
                    <td>{{ c.identificacion || '-' }}</td>
                    <td>{{ c.email || '-' }}</td>
                    <td>{{ c.telefono || '-' }}</td>
                    <td>{{ c.ciudad || '-' }}</td>
                    <td>{{ c.contacto || '-' }}</td>
                    <td>{{ c.asignado_a || '-' }}</td>
                    <td><span :class="c.activo ? 'estado-activo' : 'estado-inactivo'">{{ c.activo ? 'Active' : 'Inactive' }}</span></td>
                    <td class="actions-cell">
                      <button class="btn-accion ver" @click="viewClient(c)">👁️ View</button>
                      <button class="btn-accion editar" @click="editClient(c)">✏️ Edit</button>
                      <button class="btn-accion eliminar" @click="deleteClient(c.id)">🗑️ Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Pagination 
                :current-page="currentPage"
                :total-pages="totalPages"
                :total-items="clientes.length"
                @page-changed="setPage" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Client Modal -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Client Details</h2>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <div v-if="selectedClient" class="details-card">
            <div class="details-grid">
              <div class="details-item"><div class="details-label">Name</div><div class="details-value">{{ selectedClient.nombre }}</div></div>
              <div class="details-item"><div class="details-label">Identification</div><div class="details-value">{{ selectedClient.identificacion || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Email</div><div class="details-value">{{ selectedClient.email || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Phone</div><div class="details-value">{{ selectedClient.telefono || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Address</div><div class="details-value">{{ selectedClient.direccion || '-' }}</div></div>
              <div class="details-item"><div class="details-label">City</div><div class="details-value">{{ selectedClient.ciudad || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Contact Person</div><div class="details-value">{{ selectedClient.contacto || '-' }}</div></div>
              <div class="details-item"><div class="details-label">Assigned To</div><div class="details-value">{{ selectedClient.asignado_a || '-' }}</div></div>
              <div class="details-item full-width"><div class="details-label">Notes</div><div class="details-value">{{ selectedClient.notas || '-' }}</div></div>
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

const clientes = ref([])
const loading = ref(false)
const editingId = ref(null)
const showModal = ref(false)
const selectedClient = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

const form = ref({
  nombre: '', identificacion: '', email: '', telefono: '',
  direccion: '', ciudad: '', contacto: '', asignado_a: '',
  activo: true, notas: ''
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

const paginatedClientes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return clientes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(clientes.value.length / itemsPerPage))

onMounted(() => {
  checkPermission()
  loadClientes()
})

const checkPermission = () => {
  if (!authStore.hasPermission('clientes') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadClientes = async () => {
  loading.value = true
  try {
    const response = await api.get('/clientes')
    clientes.value = response.data
  } catch (error) {
    console.error('Error loading clients:', error)
    alert('Error loading clients')
  } finally {
    loading.value = false
  }
}

const saveClient = async () => {
  try {
    let response
    if (editingId.value) {
      response = await api.put(`/clientes/${editingId.value}`, form.value)
    } else {
      response = await api.post('/clientes', form.value)
    }
    
    if (response.status === 200 || response.status === 201) {
      alert(editingId.value ? 'Client updated' : 'Client saved')
      resetForm()
      loadClientes()
    }
  } catch (error) {
    console.error('Error saving client:', error)
    alert('Error saving client')
  }
}

const editClient = (client) => {
  editingId.value = client.id
  form.value = { ...client }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteClient = async (id) => {
  if (!confirm('Delete this client?')) return
  
  try {
    await api.delete(`/clientes/${id}`)
    alert('Client deleted')
    loadClientes()
  } catch (error) {
    console.error('Error deleting client:', error)
    alert('Error deleting client')
  }
}

const viewClient = (client) => {
  selectedClient.value = client
  showModal.value = true
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    nombre: '', identificacion: '', email: '', telefono: '',
    direccion: '', ciudad: '', contacto: '', asignado_a: '',
    activo: true, notas: ''
  }
}

const closeModal = () => {
  showModal.value = false
  selectedClient.value = null
}

const setPage = (page) => { currentPage.value = page }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.clientes-container {
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
  font-size: 1.1em;
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
.form-field label { font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px; text-transform: uppercase; display: block; }
.form-field input, .form-field select, .form-field textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; }

.acciones { display: flex; gap: 15px; justify-content: flex-end; margin-top: 20px; }
.btn-guardar { background: #2563eb; color: white; border: none; padding: 10px 25px; border-radius: 8px; cursor: pointer; }
.btn-cancelar { background: transparent; color: #64748b; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

.estado-activo { background: #10b98120; color: #10b981; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.estado-inactivo { background: #ef444420; color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
</style>