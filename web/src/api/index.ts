import axios from 'axios'
import { useToast } from '@/hooks/useToast'
import config from '@/config/environment'

// Configuração base do Axios
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const toast = useToast()
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token expirado ou inválido
          // Só limpar se não for uma requisição de verificação
          if (!error.config.url?.includes('/auth/me')) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            toast.error('Sessão expirada. Faça login novamente.')
          }
          break
          
        case 403:
          toast.error('Acesso negado.')
          break
          
        case 404:
          toast.error('Recurso não encontrado.')
          break
          
        case 422:
          // Erros de validação
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err: any) => {
              toast.error(err.message || err)
            })
          } else {
            toast.error(data.message || 'Dados inválidos.')
          }
          break
          
        case 429:
          toast.error('Muitas tentativas. Tente novamente em alguns minutos.')
          break
          
        case 500:
          toast.error('Erro interno do servidor.')
          break
          
        default:
          toast.error(data.message || 'Erro inesperado.')
      }
    } else if (error.request) {
      // Erro de rede
      toast.error('Erro de conexão. Verifique sua internet.')
    } else {
      // Outros erros
      toast.error('Erro inesperado.')
    }
    
    return Promise.reject(error)
  }
)

export default api

// Re-exportar APIs
export { default as authApi } from './auth'
export { default as passwordsApi } from './passwords'
export { default as totpApi } from './totp'
export { default as usersApi } from './users'
