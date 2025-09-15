import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import authApi, { type User, type LoginRequest, type RegisterRequest } from '@/api/auth'
import preferencesApi from '@/api/preferences'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const userPreferences = ref<any>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id || '')

  // Actions
  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    userPreferences.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  const loadUserPreferences = async () => {
    if (!isAuthenticated.value) return null
    
    try {
      const response = await preferencesApi.getPreferences()
      if (response.success && response.data) {
        userPreferences.value = response.data
        return response.data
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
    }
    
    return null
  }

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        clearAuth()
      }
    }
  }

  const login = async (credentials: LoginRequest) => {
    isLoading.value = true
    try {
      const response = await authApi.login(credentials)
      if (response.success) {
        setAuth(response.data.token, response.data.user)
        // Carregar preferências do usuário após login
        await loadUserPreferences()
        return response
      }
      throw new Error(response.message || 'Erro no login')
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    isLoading.value = true
    try {
      const response = await authApi.register(userData)
      if (response.success) {
        return response
      }
      throw new Error(response.message || 'Erro no registro')
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await authApi.logout()
    } catch (error) {
      // Ignorar erro de logout (pode ser token já expirado)
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await authApi.verifyToken()
      if (response.success && response.data) {
        user.value = response.data
        return true
      }
    } catch (error) {
      // Token inválido
      clearAuth()
    }
    
    return false
  }

  // Inicializar store
  const initialize = async () => {
    loadUserFromStorage()
    
    // Se temos token, verificar se ainda é válido
    if (token.value && user.value) {
      try {
        const isValid = await verifyToken()
        if (!isValid) {
          clearAuth()
        } else {
          // Carregar preferências se o token for válido
          await loadUserPreferences()
        }
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    // Estado
    user,
    token,
    isLoading,
    userPreferences,
    
    // Getters
    isAuthenticated,
    userEmail,
    userId,
    
    // Actions
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    verifyToken,
    loadUserPreferences,
    initialize
  }
})
