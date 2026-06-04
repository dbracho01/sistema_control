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

        <div class="metrics-container">
          <h2>📈 Metrics & KPIs Dashboard</h2>
          
          <div class="filtros">
            <h3>Filters</h3>
            <div class="filter-row">
              <select v-model="filtroCliente" @change="applyFilters">
                <option :value="null">All Clients</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
              <select v-model="filtroEquipo" @change="applyFilters">
                <option :value="null">All Equipment</option>
                <option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.equipo }} - {{ e.cliente }}</option>
              </select>
              <button @click="applyFilters" class="btn-filtrar">🔍 Apply Filters</button>
              <button @click="exportPDF" class="btn-exportar">📄 Export PDF</button>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="background: linear-gradient(135deg, #3b82f6, #1e40af);">
              <h3>MTBF (Mean Time Between Failures)</h3>
              <div class="kpi-value">{{ formatNumber(kpis.mtbf) }} <span class="kpi-unit">hours</span></div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #10b981, #047857);">
              <h3>MTTR (Mean Time To Repair)</h3>
              <div class="kpi-value">{{ formatNumber(kpis.mttr) }} <span class="kpi-unit">hours</span></div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <h3>Availability (MUT/MTBF)</h3>
              <div class="kpi-value">{{ formatNumber(kpis.disponibilidad) }}<span class="kpi-unit">%</span></div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #ef4444, #b91c1c);">
              <h3>Failure Rate (λ)</h3>
              <div class="kpi-value">{{ formatNumber(kpis.tasaFallo, 4) }} <span class="kpi-unit">failures/hour</span></div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">
              <h3>Maintenance ROI</h3>
              <div class="kpi-value" :class="kpis.roi >= 0 ? 'roi-positivo' : 'roi-negativo'">{{ formatNumber(kpis.roi) }}<span class="kpi-unit">%</span></div>
            </div>
          </div>

          <div class="chart-container">
            <canvas ref="metricsChart"></canvas>
          </div>

          <div class="table-container">
            <h3>Metrics by Equipment</h3>
            <div v-if="loading" class="loading">Loading metrics...</div>
            <div v-else-if="metricsTable.length === 0" class="loading">No metrics available</div>
            <div v-else>
              <table>
                <thead>
                  <tr><th>Equipment</th><th>Client</th><th>MTBF (hrs)</th><th>MTTR (hrs)</th><th>Availability</th><th>ROI</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr v-for="m in metricsTable" :key="m.equipo_id">
                    <td>{{ m.equipo }}</td>
                    <td>{{ m.cliente }}</td>
                    <td>{{ formatNumber(m.mtbf) }}</td>
                    <td>{{ formatNumber(m.mttr) }}</td>
                    <td>{{ formatNumber(m.disponibilidad) }}%</td>
                    <td :class="m.roi >= 0 ? 'roi-positivo' : 'roi-negativo'">{{ formatNumber(m.roi) }}%</td>
                    <td><button class="btn-accion ver" @click="viewEquipmentDetails(m.equipo_id)">👁️ View</button></td>
                  </tr>
                </tbody>
              </table>
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

const clients = ref([])
const equipos = ref([])
const metricsTable = ref([])
const loading = ref(false)
const filtroCliente = ref(null)
const filtroEquipo = ref(null)
const metricsChart = ref(null)

const kpis = ref({
  mtbf: 0, mttr: 0, disponibilidad: 0, tasaFallo: 0, roi: 0
})

let chart = null

const tabs = [
  { name: '📋 Schedule', path: '/', icon: '📋' },
  { name: '📊 Reports', path: '/reportes', icon: '📊' },
  { name: '💰 Quotes', path: '/cotizaciones', icon: '💰' },
  { name: '👥 Clients', path: '/clientes', icon: '👥' },
  { name: '📦 Products', path: '/productos', icon: '📦' },
  { name: '📄 Proposals', path: '/propuestas', icon: '📄' },
  { name: '📈 Metrics', path: '/metricas', icon: '📈' }
]

if (authStore.hasPermission('usuarios') || authStore.user?.username === 'admin') {
  tabs.push({ name: '👑 Admin', path: '/admin-usuarios', icon: '👑' })
}

onMounted(() => {
  checkPermission()
  loadInitialData()
})

const checkPermission = () => {
  if (!authStore.hasPermission('metricas') && authStore.user?.username !== 'admin') {
    router.push('/')
  }
}

const loadInitialData = async () => {
  await Promise.all([loadClients(), loadEquipos()])
  await applyFilters()
}

const loadClients = async () => {
  try {
    const response = await api.get('/clientes')
    clients.value = response.data
  } catch (error) { console.error('Error loading clients:', error) }
}

const loadEquipos = async () => {
  try {
    const response = await api.get('/equipos')
    equipos.value = response.data
  } catch (error) { console.error('Error loading equipments:', error) }
}

const applyFilters = async () => {
  loading.value = true
  try {
    if (filtroEquipo.value) {
      await loadMetricsForEquipment(filtroEquipo.value)
    } else {
      await loadAllMetrics()
    }
    updateChart()
  } catch (error) {
    console.error('Error applying filters:', error)
  } finally {
    loading.value = false
  }
}

const loadMetricsForEquipment = async (equipoId) => {
  try {
    const response = await api.get(`/metricas/equipo/${equipoId}`)
    const data = response.data
    
    kpis.value = {
      mtbf: data.MTBF || 0,
      mttr: data.MTTR || 0,
      tasaFallo: data.tasa_fallo_lamda || 0,
      disponibilidad: data.MTBF ? ((data.MUT / data.MTBF) * 100) : 0,
      roi: data.roi_mantenimiento || 0
    }
    
    const equipo = equipos.value.find(e => e.id === equipoId)
    metricsTable.value = [{
      equipo_id: equipoId,
      equipo: data.equipo,
      cliente: data.cliente,
      mtbf: data.MTBF || 0,
      mttr: data.MTTR || 0,
      disponibilidad: data.MTBF ? ((data.MUT / data.MTBF) * 100) : 0,
      roi: data.roi_mantenimiento || 0
    }]
  } catch (error) {
    console.error('Error loading equipment metrics:', error)
  }
}

const loadAllMetrics = async () => {
  try {
    const response = await api.get('/equipos')
    const equiposList = response.data
    const metrics = []
    
    let totalMTBF = 0, totalMTTR = 0, totalROI = 0, count = 0
    
    for (const equipo of equiposList) {
      try {
        const res = await api.get(`/metricas/equipo/${equipo.id}`)
        const data = res.data
        
        if (!data.error) {
          const mtbf = data.MTBF || 0
          const mttr = data.MTTR || 0
          const disponibilidad = mtbf ? ((data.MUT / mtbf) * 100) : 0
          const roi = data.roi_mantenimiento || 0
          
          metrics.push({
            equipo_id: equipo.id,
            equipo: data.equipo || equipo.equipo,
            cliente: data.cliente || equipo.cliente,
            mtbf, mttr, disponibilidad, roi
          })
          
          totalMTBF += mtbf
          totalMTTR += mttr
          totalROI += roi
          count++
        }
      } catch (err) { console.error(`Error loading metrics for equipment ${equipo.id}:`, err) }
    }
    
    metricsTable.value = metrics
    
    kpis.value = {
      mtbf: count ? totalMTBF / count : 0,
      mttr: count ? totalMTTR / count : 0,
      tasaFallo: 0,
      disponibilidad: 0,
      roi: count ? totalROI / count : 0
    }
  } catch (error) {
    console.error('Error loading all metrics:', error)
  }
}

const updateChart = () => {
  if (!metricsChart.value) return
  
  const ctx = metricsChart.value.getContext('2d')
  
  if (chart) chart.destroy()
  
  const labels = metricsTable.value.slice(0, 5).map(m => m.equipo || 'Unknown')
  const mtbfData = metricsTable.value.slice(0, 5).map(m => m.mtbf)
  const disponibilidadData = metricsTable.value.slice(0, 5).map(m => m.disponibilidad)
  
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'MTBF (hours)', data: mtbfData, backgroundColor: '#3b82f6' },
        { label: 'Availability (%)', data: disponibilidadData, backgroundColor: '#10b981' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true }
  })
}

const viewEquipmentDetails = (equipoId) => {
  router.push(`/?ver=${equipoId}`)
}

const formatNumber = (num, decimals = 2) => {
  return (num || 0).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const exportPDF = () => {
  alert('PDF Export - Feature in development')
}

const navigateTo = (path) => router.push(path)
const handleLogout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.metrics-container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 20px;
}

.filtros {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.filter-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-row select {
  padding: 10px;
  border-radius: 8px;
  min-width: 200px;
  border: 1px solid #ddd;
}

.btn-filtrar, .btn-exportar {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-filtrar { background: #2563eb; color: white; border: none; }
.btn-exportar { background: #10b981; color: white; border: none; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.kpi-card h3 { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
.kpi-value { font-size: 32px; font-weight: bold; }
.kpi-unit { font-size: 14px; opacity: 0.8; }

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

canvas { max-height: 400px; width: 100% !important; }

.roi-positivo { color: #10b981; }
.roi-negativo { color: #ef4444; }
</style>