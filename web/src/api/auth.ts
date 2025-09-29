import api from './index'


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


const authApi = {
  
  async login(credentials: LoginRequest) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  
  async register(userData: RegisterRequest) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  
  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  
  async verifyToken() {
    const response = await api.get('/auth/me')
    return response.data
  },

  
  async getSessions() {
    const response = await api.get('/auth/sessions')
    return response.data
  },

  
  async revokeSession(sessionId: string) {
    const response = await api.delete(`/auth/sessions/${sessionId}`)
    return response.data
  }
}

export default authApi

