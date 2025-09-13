np<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main App -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Inicializar store de autenticação
    authStore.initialize()
  } catch (error) {
    console.error('Erro ao inicializar auth store:', error)
  }
})
</script>

<style>
/* Estilos globais já estão no style.css */
</style>
