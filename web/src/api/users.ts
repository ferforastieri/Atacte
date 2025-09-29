import api from './index'


export interface UserProfile {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  isActive: boolean
}

export interface UserStats {
  totalPasswords: number
  favoritePasswords: number
  folders: string[]
  weakPasswords: number
  duplicatedPasswords: number
  lastActivity?: string
  accountAge: number
  totalLogins: number
}

export interface AuditLog {
  id: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  details: any
  createdAt: string
}

export interface ExportData {
  user: UserProfile
  passwords: Array<{
    name: string
    website?: string
    username?: string
    password: string
    notes?: string
    folder?: string
    isFavorite: boolean
    customFields?: Array<{
      fieldName: string
      value: string
      fieldType: string
    }>
  }>
  exportedAt: string
}


const usersApi = {
  
  async getProfile() {
    const response = await api.get('/users/profile')
    return response.data
  },

  
  async getStats() {
    const response = await api.get('/users/stats')
    return response.data
  },

  
  async getFolders() {
    const response = await api.get('/users/folders')
    return response.data
  },

  
  async getAuditLogs(limit = 50, offset = 0) {
    const response = await api.get(`/users/audit-logs?limit=${limit}&offset=${offset}`)
    return response.data
  },

  
  async exportData() {
    const response = await api.post('/users/export')
    return response.data
  },

  
  async deleteAccount() {
    const response = await api.delete('/users/account')
    return response.data
  }
}

export default usersApi

