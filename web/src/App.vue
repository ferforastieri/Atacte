np<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main App -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const instance = getCurrentInstance()

onMounted(async () => {
  try {
    await authStore.initialize()
    
    // Inicializar dados da aplicação se autenticado
    if (authStore.isAuthenticated && instance?.appContext.config.globalProperties.$initApp) {
      await instance.appContext.config.globalProperties.$initApp()
    }
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error)
  }
})
</script>

<style>
/* Estilos globais já estão no style.css */
</style>

