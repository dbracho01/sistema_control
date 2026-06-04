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

        <div class="comparativa-container">
          <div class="comparativa-header">
            <h2>📈 Equipment Performance Comparison</h2>
            <button class="btn-actualizar" @click="loadComparativa">🔄 Refresh</button>
          </div>

          <div v-if="loading" class="loading">Loading equipment data...</div>
          <div v-else-if="equiposData.length === 0" class="loading">No equipment registered</div>
          <div v-else>
            <table class="table-comparativa">
              <thead>
                <tr>
                  <th>Equipment</th><th>Client</th><th>MTBF (hours)</th>
                  <th>MTTR (hours)</th><th>Availability (%)</th>
                  <th>ROI (%)</th><th>Total Failures</th>
                  <th>Downtime (hrs)</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in equiposData" :key="e.id">
                  <td><strong>{{ e.nombre }}</strong></td>
                  <td>{{ e.cliente }}</td>
                  <td :class="getKPIStatus(e.mtbf, 'mtbf')">{{ e.mtbf }} hrs</td>
                  <td :class="getKPIStatus(e.mttr, 'mttr')">{{ e.mttr }} hrs</td>
                  <td :class="getKPIStatus(e.disponibilidad, 'disponibilidad')">{{ formatNumber(e.disponibilidad) }}%</td>
                  <td :class="getKPIStatus(e.roi, 'roi')">{{ formatNumber(e.roi) }}%</td>
                  <td>{{ e.total_fallos }}</td>
                  <td>{{ e.total_horas_parada }} hrs</td>
                  <td class="actions-cell">
                    <button class="btn-accion ver" @click="viewEquipment(e.id)">👁️ View</button>
                    <button class="btn-accion" @click="viewIndicators(e.id)">📊 Indicators</button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="leyenda">
              <h4>📌 Color Legend:</h4>
              <p><span class="kpi-bueno">● Optimal</span> - <span class="kpi-regular">● At Risk</span> - <span class="kpi-malo">● Critical</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import api from '../services/api'
import Navbar from '../components/Navbar.vue'

const router = useRouter()
const authStore = useAuthStore()

const equiposData = ref([])
const loading = ref(false)

const tabs = [
  { name: '📋 Schedule', path: '/', icon: '📋' },
  { name: '📊 Reports', path: '/reportes', icon: '📊' },
  { name: '💰 Quotes', path: '/cotizaciones', icon: '💰' },
  { name: '👥 Clients', path: '/clientes', icon: '👥' },
  { name: '📦 Products', path: '/productos', icon: '📦' },
  { name: '📄 Proposals', path: '/propuestas', icon: '📄' },
  { name: '📈 Comparative', path: '/comparativa', icon: '📈' }
]

if (authStore.hasPermission('usuarios') || authStore.user?.username === 'admin') {
  tabs.push({ name: '👑 Admin', path: '/admin-usuarios', icon: '👑' })
}

onMounted(() => {
  checkPermission()
  loadComparativa()
})

const checkPermission = () => {
  if (!authStore.hasPermission('comparativa') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadComparativa = async () => {
  loading.value = true
  try {
    const response = await api.get('/indicadores/todos-equipos')
    equiposData.value = response.data
  } catch (error) {
    console.error('Error loading comparative data:', error)
  } finally {
    loading.value = false
  }
}

const getKPIStatus = (value, type) => {
  if (value === 0) return 'kpi-malo'
  
  switch (type) {
    case 'mtbf':
      if (value < 100) return 'kpi-malo'
      if (value < 200) return 'kpi-regular'
      return 'kpi-bueno'
    case 'mttr':
      if (value > 8) return 'kpi-malo'
      if (value > 4) return 'kpi-regular'
      return 'kpi-bueno'
    case 'disponibilidad':
      if (value < 85) return 'kpi-malo'
      if (value < 95) return 'kpi-regular'
      return 'kpi-bueno'
    case 'roi':
      if (value < 50) return 'kpi-malo'
      if (value < 150) return 'kpi-regular'
      return 'kpi-bueno'
    default:
      return ''
  }
}

const formatNumber = (num) => {
  return (num || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const viewEquipment = (id) => {
  router.push(`/?ver=${id}`)
}

const viewIndicators = (id) => {
  router.push(`/metricas?equipo=${id}`)
}

const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.comparativa-container {
  max-width: 1400px;
  margin: 30px auto;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.comparativa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.btn-actualizar {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.table-comparativa {
  width: 100%;
  border-collapse: collapse;
}

.table-comparativa th, .table-comparativa td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.table-comparativa th {
  background: #f8fafc;
  font-weight: 600;
}

.leyenda {
  margin-top: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 12px;
}

.kpi-bueno { color: #10b981; font-weight: bold; }
.kpi-regular { color: #f59e0b; font-weight: bold; }
.kpi-malo { color: #ef4444; font-weight: bold; }
</style>