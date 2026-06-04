import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
 state: () => {
    // Intentamos parsear el usuario de forma segura desde localStorage
    const savedUser = localStorage.getItem('usuario');
    let userObject = null;
    
    try {
      // Si existe y no es un string vacío, lo convertimos en objeto de JS
      if (savedUser && savedUser !== 'undefined') {
        userObject = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error al parsear el usuario de localStorage", e);
    }

    return {
      token: localStorage.getItem('token') || null,
      user: userObject // Ahora sí es un objeto real o null
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    
    hasPermission: (state) => (permission) => {
      if (state.user?.username === 'admin') return true
      return state.user?.permisos?.[permission] || false
    },
    
    getFirstAccessibleRoute: (state) => {
      if (state.user?.username === 'admin') return '/'
      const permissions = state.user?.permisos || {}
      if (permissions.cronograma) return '/'
      if (permissions.cotizaciones) return '/cotizaciones'
      if (permissions.clientes) return '/clientes'
      if (permissions.productos) return '/productos'
      if (permissions.reportes) return '/reportes'
      if (permissions.propuestas) return '/propuestas'
      return '/'
    }
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/login', { username, password })
        this.token = response.data.token
        this.user = response.data.usuario
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario))
        return { success: true }
      } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Login failed' }
      }
    },
    
    async loadUser() {
      try {
        const user = JSON.parse(localStorage.getItem('usuario') || 'null')
        if (user) this.user = user
      } catch (error) {
        console.error('Error loading user:', error)
      }
    },
    
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }
  }
})

export const useEquiposStore = defineStore('equipos', {
  state: () => ({ equipos: [], loading: false, total: 0, currentPage: 1, itemsPerPage: 5 }),
  
  getters: {
    paginatedEquipos: (state) => {
      const start = (state.currentPage - 1) * state.itemsPerPage
      return state.equipos.slice(start, start + state.itemsPerPage)
    },
    totalPages: (state) => Math.ceil(state.equipos.length / state.itemsPerPage),
    stats: (state) => {
      let vigente = 0, proximo = 0, vencido = 0
      state.equipos.forEach(equipo => {
        const daysRemaining = calculateDaysRemaining(equipo.garantia_fin)
        if (daysRemaining < 0) vencido++
        else if (daysRemaining <= 30) proximo++
        else vigente++
      })
      return { vigente, proximo, vencido }
    }
  },
  
  actions: {
    async fetchEquipos() {
      this.loading = true
      try {
        const response = await api.get('/equipos')
        this.equipos = response.data
        this.total = response.data.length
      } catch (error) {
        console.error('Error fetching equipos:', error)
      } finally {
        this.loading = false
      }
    },
    
    async saveEquipo(equipo, id = null) {
      try {
        if (id) {
          await api.put(`/equipos/${id}`, equipo)
        } else {
          await api.post('/equipos', equipo)
        }
        await this.fetchEquipos()
        return { success: true }
      } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Save failed' }
      }
    },
    
    async deleteEquipo(id) {
      try {
        await api.delete(`/equipos/${id}`)
        await this.fetchEquipos()
        return { success: true }
      } catch (error) {
        return { success: false }
      }
    },
    
    setPage(page) { this.currentPage = page }
  }
})

function calculateDaysRemaining(dateStr) {
  if (!dateStr) return 999
  const today = new Date()
  const date = new Date(dateStr)
  const diff = date - today
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}