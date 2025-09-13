import api from './index'

// Tipos específicos para senhas
export interface PasswordEntry {
  id: string
  name: string
  website?: string
  username?: string
  password: string
  notes?: string
  folder?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  lastUsed?: string
  totpEnabled: boolean
  totpCode?: TOTPCode
  customFields?: CustomField[]
}

export interface CustomField {
  id: string
  fieldName: string
  value: string
  fieldType: string
}

export interface CreatePasswordRequest {
  name: string
  website?: string
  username?: string
  password: string
  notes?: string
  folder?: string
  isFavorite?: boolean
  customFields?: Array<{
    fieldName: string
    value: string
    fieldType: 'text' | 'password' | 'email' | 'url' | 'number'
  }>
  totpSecret?: string
  totpEnabled?: boolean
}

export interface UpdatePasswordRequest extends Partial<CreatePasswordRequest> {
  id: string
}

export interface PasswordSearchFilters {
  query?: string
  folder?: string
  isFavorite?: boolean
  totpEnabled?: boolean
  limit?: number
  offset?: number
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed'
  sortOrder?: 'asc' | 'desc'
}

export interface PasswordGeneratorOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
}

export interface PasswordStrength {
  score: number
  feedback: {
    warning: string
    suggestions: string[]
  }
  crackTime: string
}

export interface TOTPCode {
  code: string
  timeRemaining: number
  period: number
}

// API de senhas
const passwordsApi = {
  // Buscar senhas com filtros
  async searchPasswords(filters: PasswordSearchFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await api.get(`/passwords?${params.toString()}`)
    return response.data
  },

  // Buscar senha por ID
  async getPasswordById(id: string) {
    const response = await api.get(`/passwords/${id}`)
    return response.data
  },

  // Criar nova senha
  async createPassword(passwordData: CreatePasswordRequest) {
    const response = await api.post('/passwords', passwordData)
    return response.data
  },

  // Atualizar senha
  async updatePassword(id: string, passwordData: UpdatePasswordRequest) {
    const response = await api.put(`/passwords/${id}`, passwordData)
    return response.data
  },

  // Deletar senha
  async deletePassword(id: string) {
    const response = await api.delete(`/passwords/${id}`)
    return response.data
  },

  // Gerar senha segura
  async generatePassword(options: Partial<PasswordGeneratorOptions> = {}) {
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await api.get(`/passwords/generate?${params.toString()}`)
    return response.data
  },

  // === TOTP ===


  // === IMPORTAÇÃO ===
  // Importar senhas do Bitwarden
  async importPasswords(jsonData: any) {
    const response = await api.post('/import-export/import', jsonData)
    return response.data
  }
}

export default passwordsApi

