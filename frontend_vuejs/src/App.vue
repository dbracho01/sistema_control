<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './store'

const router = useRouter()
const authStore = useAuthStore()

// Auto redirect to login if not authenticated
if (!authStore.isAuthenticated && router.currentRoute.value.path !== '/login') {
  router.push('/login')
}
</script>