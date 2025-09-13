import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Estado
  const isDarkMode = ref(false)

  // Inicializar tema
  const initializeTheme = () => {
    // Verificar preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      // Verificar preferência do sistema
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    applyTheme()
  }

  // Alternar tema
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    applyTheme()
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }

  // Aplicar tema
  const applyTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Inicializar quando a store é criada
  initializeTheme()

  return {
    isDarkMode,
    toggleTheme,
    initializeTheme,
    applyTheme
  }
})
