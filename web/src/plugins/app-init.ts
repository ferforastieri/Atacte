import type { App } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'

export default {
  install(app: App) {
    // Função global para inicializar dados da aplicação
    app.config.globalProperties.$initApp = async () => {
      const authStore = useAuthStore()
      const passwordsStore = usePasswordsStore()
      
      try {
        // Aguardar inicialização da auth store
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!authStore.isAuthenticated) {
          return false
        }
        
        // Carregar dados essenciais
        await Promise.all([
          passwordsStore.fetchPasswords(),
          passwordsStore.fetchFolders()
        ])
        
        return true
        
      } catch (error) {
        console.error('Erro ao inicializar aplicação:', error)
        throw error
      }
    }
  }
}
