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

        <div class="admin-container">
          <div class="admin-header">
            <h2>👑 User Administration</h2>
            <button class="btn-agregar" @click="openModal">+ New User</button>
          </div>

          <div v-if="loading" class="loading">Loading users...</div>
          <div v-else-if="users.length === 0" class="loading">No users registered</div>
          <div v-else class="table-container">
            <table class="table-usuarios">
              <thead>
                <tr>
                  <th>ID</th><th>Username</th><th>Full Name</th><th>Email</th>
                  <th>Permissions</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in paginatedUsers" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td><strong>{{ user.username }}</strong> <span v-if="user.username === 'admin'">👑</span></td>
                  <td>{{ user.nombre_completo || '-' }}</td>
                  <td>{{ user.email }}</td>
                  <td class="permisos-cell">
                    <span v-for="(value, key) in user.permisos" :key="key" v-if="value" class="permiso-badge">{{ key }}</span>
                    <span v-if="!hasAnyPermission(user.permisos)">-</span>
                  </td>
                  <td>
                    <span :class="user.activo ? 'badge-activo' : 'badge-inactivo'">
                      {{ user.activo ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-accion editar" @click="editUser(user)" title="Edit">✏️</button>
                    <button class="btn-accion" :class="user.activo ? 'eliminar' : 'ver'" @click="toggleActive(user)" :title="user.activo ? 'Deactivate' : 'Activate'">
                      {{ user.activo ? '🔴' : '🟢' }}
                    </button>
                    <button v-if="user.username !== 'admin'" class="btn-accion eliminar" @click="deleteUser(user.id)" title="Delete">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <Pagination 
              :current-page="currentPage"
              :total-pages="totalPages"
              :total-items="users.length"
              @page-changed="setPage" />
          </div>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="showModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit User' : 'New User' }}</h3>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <input type="hidden" v-model="form.id">
            <div class="form-group">
              <label>Username *</label>
              <input type="text" v-model="form.username" required placeholder="e.g., juan.perez">
            </div>
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" v-model="form.nombre_completo" placeholder="Full name">
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" v-model="form.email" required placeholder="email@company.com">
            </div>
            <div class="form-group">
              <label>Password <span v-if="!isEditing">*</span></label>
              <input type="password" v-model="form.password" :placeholder="isEditing ? 'Leave empty to keep current' : 'Min 6 characters'">
            </div>
            
            <label class="permissions-label">Module Permissions</label>
            <div class="permisos-grid">
              <div class="permiso-item" v-for="perm in permissionsList" :key="perm.key">
                <input type="checkbox" :id="perm.key" v-model="form.permisos[perm.key]">
                <label :for="perm.key">{{ perm.label }}</label>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn-cancelar-modal" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-guardar-modal">Save</button>
            </div>
          </form>
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
const users = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const currentPage = ref(1)
const itemsPerPage = 5

const form = ref({
  id: null,
  username: '',
  nombre_completo: '',
  email: '',
  password: '',
  permisos: {
    cronograma: false,
    reportes: false,
    cotizaciones: false,
    clientes: false,
    productos: false,
    propuestas: false,
    usuarios: false
  }
})

const permissionsList = [
  { key: 'cronograma', label: 'Schedule' },
  { key: 'reportes', label: 'Reports' },
  { key: 'cotizaciones', label: 'Quotes' },
  { key: 'clientes', label: 'Clients' },
  { key: 'productos', label: 'Products' },
  { key: 'propuestas', label: 'Proposals' },
  { key: 'usuarios', label: 'Manage Users' }
]

const tabs = [
  { name: '📋 Schedule', path: '/', icon: '📋' },
  { name: '📊 Reports', path: '/reportes', icon: '📊' },
  { name: '💰 Quotes', path: '/cotizaciones', icon: '💰' },
  { name: '👥 Clients', path: '/clientes', icon: '👥' },
  { name: '📦 Products', path: '/productos', icon: '📦' },
  { name: '📄 Proposals', path: '/propuestas', icon: '📄' },
  { name: '👑 Admin', path: '/admin-usuarios', icon: '👑' }
]

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return users.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage))

const hasAnyPermission = (permisos) => Object.values(permisos || {}).some(v => v === true)

onMounted(() => {
  checkPermission()
  loadUsers()
})

const checkPermission = () => {
  if (!authStore.hasPermission('usuarios') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (error) {
    console.error('Error loading users:', error)
    alert('Error loading users')
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  isEditing.value = false
  form.value = {
    id: null,
    username: '',
    nombre_completo: '',
    email: '',
    password: '',
    permisos: {
      cronograma: false, reportes: false, cotizaciones: false,
      clientes: false, productos: false, propuestas: false, usuarios: false
    }
  }
  showModal.value = true
}

const editUser = (user) => {
  isEditing.value = true
  form.value = {
    id: user.id,
    username: user.username,
    nombre_completo: user.nombre_completo || '',
    email: user.email,
    password: '',
    permisos: { ...user.permisos }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    const data = {
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      nombre_completo: form.value.nombre_completo,
      permiso_cronograma: form.value.permisos.cronograma,
      permiso_reportes: form.value.permisos.reportes,
      permiso_cotizaciones: form.value.permisos.cotizaciones,
      permiso_clientes: form.value.permisos.clientes,
      permiso_productos: form.value.permisos.productos,
      permiso_propuestas: form.value.permisos.propuestas,
      permiso_usuarios: form.value.permisos.usuarios
    }

    let response
    if (isEditing.value) {
      response = await api.put(`/usuarios/${form.value.id}`, data)
    } else {
      response = await api.post('/usuarios', data)
    }

    if (response.status === 200 || response.status === 201) {
      alert(isEditing.value ? 'User updated' : 'User created')
      closeModal()
      loadUsers()
    }
  } catch (error) {
    console.error('Error saving user:', error)
    alert('Error saving user')
  }
}

const toggleActive = async (user) => {
  const action = user.activo ? 'deactivate' : 'activate'
  if (!confirm(`Are you sure you want to ${action} this user?`)) return

  try {
    await api.put(`/usuarios/${user.id}/toggle-activo`)
    alert(`User ${user.activo ? 'deactivated' : 'activated'}`)
    loadUsers()
  } catch (error) {
    console.error('Error toggling user status:', error)
    alert('Error updating user status')
  }
}

const deleteUser = async (id) => {
  if (!confirm('Delete this user permanently?')) return

  try {
    await api.delete(`/usuarios/${id}`)
    alert('User deleted')
    loadUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Error deleting user')
  }
}

const closeModal = () => {
  showModal.value = false
}

const setPage = (page) => {
  currentPage.value = page
}

const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
  margin: 30px auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.btn-agregar {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.modal-content { max-width: 600px; margin: 50px auto; }
.modal-header { padding: 20px 25px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.modal-body { padding: 25px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 25px; border-top: 1px solid #e2e8f0; }

.permissions-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px; display: block; }
.permisos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 10px; }
.permiso-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8fafc; border-radius: 8px; }
.permiso-item input { width: 18px; height: 18px; cursor: pointer; }
.permiso-item label { margin: 0; cursor: pointer; font-size: 13px; color: #1e293b; }

.table-usuarios { width: 100%; border-collapse: collapse; }
.table-usuarios th, .table-usuarios td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
.table-usuarios th { background: #f8fafc; font-weight: 600; }

.badge-activo { background: #10b98120; color: #10b981; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge-inactivo { background: #ef444420; color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.permiso-badge { display: inline-block; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin: 2px; font-size: 10px; }

.btn-guardar-modal { background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; }
.btn-cancelar-modal { background: #e2e8f0; color: #475569; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; }
</style>