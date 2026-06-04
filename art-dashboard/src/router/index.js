import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/', name: 'Cronograma', component: () => import('../views/Cronograma.vue'), meta: { requiresAuth: true, permission: 'cronograma' } },
  { path: '/reportes', name: 'Reportes', component: () => import('../views/Reportes.vue'), meta: { requiresAuth: true, permission: 'reportes' } },
  { path: '/cotizaciones', name: 'Cotizaciones', component: () => import('../views/Cotizaciones.vue'), meta: { requiresAuth: true, permission: 'cotizaciones' } },
  { path: '/clientes', name: 'Clientes', component: () => import('../views/Clientes.vue'), meta: { requiresAuth: true, permission: 'clientes' } },
  { path: '/productos', name: 'Productos', component: () => import('../views/Productos.vue'), meta: { requiresAuth: true, permission: 'productos' } },
  { path: '/propuestas', name: 'Propuestas', component: () => import('../views/Propuestas.vue'), meta: { requiresAuth: true, permission: 'propuestas' } },
  { path: '/admin-usuarios', name: 'AdminUsuarios', component: () => import('../views/AdminUsuarios.vue'), meta: { requiresAuth: true, permission: 'usuarios' } },
  { path: '/metricas', name: 'Metricas', component: () => import('../views/Metricas.vue'), meta: { requiresAuth: true, permission: 'metricas' } },
  { path: '/comparativa', name: 'Comparativa', component: () => import('../views/Comparativa.vue'), meta: { requiresAuth: true, permission: 'comparativa' } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')

  // 1. Si hay un token en el localStorage, pero isAuthenticated es FALSE, 
  // significa que la app se acaba de abrir/recargar y necesitamos mapear o cargar al usuario de la API una sola vez.
  if (token && !authStore.isAuthenticated) {
    try {
      await authStore.loadUser() // Se ejecuta SOLO UNA VEZ al cargar la app
    } catch (error) {
      console.error("Token inválido o expirado:", error)
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      return '/login'
    }
  }

  // 2. Control de Rutas Protegidas
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  // 3. Control de Permisos
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission) && authStore.user?.username !== 'admin') {
    const firstAccessibleRoute = authStore.getFirstAccessibleRoute
    return firstAccessibleRoute || '/'
  }
})

export default router