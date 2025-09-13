import axios from 'axios'

// Tipos específicos para autenticação
export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface LoginRequest {
  email: string
  masterPassword: string
  deviceName?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  email: string
  masterPassword: string
}

export interface Session {
  id: string
  deviceName?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  lastUsed: string
  expiresAt: string
  isCurrent?: boolean
}

// API de autenticação
const authApi = {
  // Login
  async login(credentials: LoginRequest) {
    const response = await axios.post('/api/auth/login', credentials)
    return response.data
  },

  // Registro
  async register(userData: RegisterRequest) {
    const response = await axios.post('/api/auth/register', userData)
    return response.data
  },

  // Logout
  async logout() {
    const response = await axios.post('/api/auth/logout')
    return response.data
  },

  // Verificar token
  async verifyToken() {
    const response = await axios.get('/api/auth/verify')
    return response.data
  },

  // Buscar sessões
  async getSessions() {
    const response = await axios.get('/api/auth/sessions')
    return response.data
  },

  // Revogar sessão
  async revokeSession(sessionId: string) {
    const response = await axios.delete(`/api/auth/sessions/${sessionId}`)
    return response.data
  }
}

export default authApi

