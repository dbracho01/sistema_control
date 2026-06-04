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

        <div class="reporte-container">
          <div class="reporte-header">
            <img src="/assets/logo.png" alt="Logo" class="logo-small">
            <h1>Technical Service Report</h1>
            <div class="reporte-numero">ST-{{ reporteNumero }}</div>
          </div>
          
          <form @submit.prevent="generatePDF" class="form-section">
            <h3>General Information</h3>
            <div class="form-row">
              <div class="form-field">
                <label>Date</label>
                <input type="date" v-model="form.fecha" required>
              </div>
              <div class="form-field">
                <label>Time</label>
                <input type="time" v-model="form.hora" required>
              </div>
              <div class="form-field">
                <label>Technician</label>
                <input type="text" v-model="form.tecnico" required placeholder="Technician name">
              </div>
            </div>

            <h3>Service Type</h3>
            <div class="checkbox-group">
              <label class="checkbox-item"><input type="checkbox" v-model="form.servicio_instalacion"> Installation</label>
              <label class="checkbox-item"><input type="checkbox" v-model="form.servicio_preventivo"> Preventive Maint.</label>
              <label class="checkbox-item"><input type="checkbox" v-model="form.servicio_correctivo"> Corrective Maint.</label>
              <label class="checkbox-item"><input type="checkbox" v-model="form.servicio_asesoria"> Advisory</label>
            </div>

            <h3>Equipment Information</h3>
            <div class="form-row">
              <div class="form-field">
                <label>Equipment</label>
                <select v-model="form.equipo_id" required>
                  <option :value="null">Select equipment...</option>
                  <option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.equipo }} - {{ e.cliente }}</option>
                </select>
              </div>
              <div class="form-field">
                <label>Condition</label>
                <div class="checkbox-pareja">
                  <label><input type="checkbox" v-model="form.equipo_nuevo"> New</label>
                  <label><input type="checkbox" v-model="form.equipo_usado"> Used</label>
                </div>
              </div>
            </div>

            <h3>Problem Description / Failure</h3>
            <div class="form-field">
              <textarea v-model="form.descripcion_problema" rows="4" placeholder="Describe the problem or failure..."></textarea>
            </div>

            <h3>Materials / Parts Used</h3>
            <div class="materiales-container">
              <div v-for="(mat, idx) in form.materiales" :key="idx" class="material-row">
                <input type="text" v-model="mat.descripcion" placeholder="Description" class="material-desc">
                <input type="number" v-model.number="mat.cantidad" placeholder="Qty" min="1" class="material-cant">
                <input type="text" v-model="mat.referencia" placeholder="Reference" class="material-ref">
                <button type="button" class="btn-eliminar-material" @click="removeMaterial(idx)">🗑️</button>
              </div>
              <button type="button" class="btn-agregar-material" @click="addMaterial">+ Add Material</button>
            </div>

            <h3>Signatures</h3>
            <div class="form-row">
              <div class="form-field"><label>Technician Name</label><input type="text" v-model="form.firma_tecnico" placeholder="Technician name"></div>
              <div class="form-field"><label>Client Name</label><input type="text" v-model="form.firma_cliente" placeholder="Client name"></div>
            </div>
          </form>

          <div class="acciones">
            <button type="button" class="btn-volver" @click="navigateTo('/')">← Back to Schedule</button>
            <button type="button" class="btn-guardar" @click="saveReport" :disabled="saving">💾 Save Report</button>
            <button type="button" class="btn-generar" @click="generatePDF" :disabled="generating">📄 Generate PDF</button>
          </div>

          <div class="table-container">
            <h3>Saved Reports</h3>
            <div v-if="loadingReports" class="loading">Loading reports...</div>
            <div v-else-if="reportes.length === 0" class="loading">No saved reports</div>
            <div v-else>
              <table>
                <thead>
                  <tr><th>ID</th><th>Date</th><th>Client</th><th>Equipment</th><th>Type</th><th>Technician</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in paginatedReportes" :key="r.id">
                    <td>ST-{{ String(r.id).padStart(4, '0') }}</td>
                    <td>{{ r.fecha }}</td>
                    <td>{{ r.cliente_nombre || '-' }}</td>
                    <td>{{ r.equipo_nombre || 'Equipment #' + r.equipo_id }}</td>
                    <td>{{ r.tipo_intervencion }}</td>
                    <td>{{ r.tecnico || '-' }}</td>
                    <td class="actions-cell">
                      <button class="btn-accion ver" @click="viewReport(r.id)">👁️ View</button>
                      <button class="btn-accion editar" @click="editReport(r)">✏️ Edit</button>
                      <button class="btn-accion eliminar" @click="deleteReport(r.id)">🗑️ Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Pagination 
                :current-page="currentPage"
                :total-pages="totalPages"
                :total-items="reportes.length"
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

const router = useRouter()
const authStore = useAuthStore()
const API_URL = 'http://localhost:8000'

const equipos = ref([])
const reportes = ref([])
const loadingReports = ref(false)
const saving = ref(false)
const generating = ref(false)
const editingId = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5
const reporteNumero = ref(1001)

const form = ref({
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().slice(0,5),
  tecnico: '',
  equipo_id: null,
  equipo_nuevo: false,
  equipo_usado: false,
  descripcion_problema: '',
  servicio_instalacion: false,
  servicio_preventivo: false,
  servicio_correctivo: false,
  servicio_asesoria: false,
  firma_tecnico: '',
  firma_cliente: '',
  materiales: [{ descripcion: '', cantidad: 1, referencia: '' }]
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

const paginatedReportes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return reportes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(reportes.value.length / itemsPerPage))

onMounted(() => {
  checkPermission()
  loadEquipos()
  loadReportes()
})

const checkPermission = () => {
  if (!authStore.hasPermission('reportes') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadEquipos = async () => {
  try {
    const response = await api.get('/equipos')
    equipos.value = response.data
  } catch (error) {
    console.error('Error loading equipments:', error)
  }
}

const loadReportes = async () => {
  loadingReports.value = true
  try {
    const response = await api.get('/intervenciones')
    reportes.value = response.data
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loadingReports.value = false
  }
}

const addMaterial = () => {
  form.value.materiales.push({ descripcion: '', cantidad: 1, referencia: '' })
}

const removeMaterial = (index) => {
  if (form.value.materiales.length > 1) {
    form.value.materiales.splice(index, 1)
  }
}

const getServiceType = () => {
  if (form.value.servicio_correctivo) return 'Correctivo'
  if (form.value.servicio_instalacion) return 'Instalación'
  if (form.value.servicio_asesoria) return 'Asesoría'
  return 'Preventivo'
}

const saveReport = async () => {
  if (!form.value.equipo_id) {
    alert('Please select an equipment')
    return
  }

  saving.value = true
  const data = {
    equipo_id: form.value.equipo_id,
    fecha: form.value.fecha,
    hora_inicio: form.value.hora,
    hora_fin: form.value.hora,
    tipo_intervencion: getServiceType(),
    descripcion: form.value.descripcion_problema,
    tecnico: form.value.tecnico,
    materiales: form.value.materiales.filter(m => m.descripcion),
    costo_mano_obra: 0,
    costo_repuestos: 0,
    ingreso_generado: 0,
    ahorro_fallos: 0
  }

  try {
    let response
    if (editingId.value) {
      response = await api.put(`/intervenciones/${editingId.value}`, data)
    } else {
      response = await api.post('/intervenciones', data)
    }

    if (response.status === 200 || response.status === 201) {
      alert(editingId.value ? 'Report updated' : 'Report saved')
      resetForm()
      loadReportes()
    }
  } catch (error) {
    console.error('Error saving report:', error)
    alert('Error saving report')
  } finally {
    saving.value = false
  }
}

const generatePDF = async () => {
  generating.value = true
  const data = {
    ...form.value,
    tipo_servicio: getServiceType(),
    numero_reporte: `ST-${reporteNumero.value}`
  }

  try {
    const response = await api.post('/generar-pdf-desde-plantilla', data, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Reporte_ST-${reporteNumero.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    reporteNumero.value++
    alert('PDF generated successfully')
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF')
  } finally {
    generating.value = false
  }
}

const editReport = (report) => {
  editingId.value = report.id
  form.value = {
    fecha: report.fecha,
    hora: report.hora_inicio || '00:00',
    tecnico: report.tecnico || '',
    equipo_id: report.equipo_id,
    equipo_nuevo: false,
    equipo_usado: false,
    descripcion_problema: report.descripcion || '',
    servicio_instalacion: report.tipo_intervencion === 'Instalación',
    servicio_preventivo: report.tipo_intervencion === 'Preventivo',
    servicio_correctivo: report.tipo_intervencion === 'Correctivo',
    servicio_asesoria: report.tipo_intervencion === 'Asesoría',
    firma_tecnico: '',
    firma_cliente: '',
    materiales: (report.materiales && report.materiales.length) ? [...report.materiales] : [{ descripcion: '', cantidad: 1, referencia: '' }]
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteReport = async (id) => {
  if (!confirm('Delete this report permanently?')) return
  try {
    await api.delete(`/intervenciones/${id}`)
    alert('Report deleted')
    loadReportes()
  } catch (error) {
    console.error('Error deleting report:', error)
  }
}

const viewReport = (id) => {
  window.open(`${API_URL}/ver-reporte/${id}`, '_blank')
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0,5),
    tecnico: '',
    equipo_id: null,
    equipo_nuevo: false,
    equipo_usado: false,
    descripcion_problema: '',
    servicio_instalacion: false,
    servicio_preventivo: false,
    servicio_correctivo: false,
    servicio_asesoria: false,
    firma_tecnico: '',
    firma_cliente: '',
    materiales: [{ descripcion: '', cantidad: 1, referencia: '' }]
  }
}

const setPage = (page) => { currentPage.value = page }
const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.reporte-container {
  max-width: 900px;
  margin: 30px auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.reporte-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f8fafc;
}

.logo-small { height: 40px; width: auto; }
.reporte-header h1 { color: #1e293b; font-size: 1.5em; margin: 0; }
.reporte-numero { margin-left: auto; background: #f8fafc; padding: 8px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; color: #2563eb; }

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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-field { display: flex; flex-direction: column; }
.form-field label { font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
.form-field input, .form-field select, .form-field textarea { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; }

.checkbox-group { display: flex; gap: 20px; flex-wrap: wrap; margin: 15px 0; }
.checkbox-item { display: flex; align-items: center; gap: 5px; }
.checkbox-pareja { display: flex; gap: 20px; margin-top: 8px; }

.material-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.material-desc { flex: 2; padding: 6px; border: 1px solid #ddd; border-radius: 6px; }
.material-cant { width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; }
.material-ref { flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 6px; }

.btn-agregar-material { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
.btn-eliminar-material { background: #ef4444; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; }

.acciones { display: flex; gap: 15px; justify-content: flex-end; margin-top: 20px; }
.btn-volver, .btn-guardar, .btn-generar { padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-volver { background: #10b981; color: white; border: none; }
.btn-guardar { background: #2563eb; color: white; border: none; }
.btn-generar { background: #f59e0b; color: white; border: none; }
</style>