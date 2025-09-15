import api from './index'

export interface UserPreferences {
  id: string
  userId: string
  theme: string
  language: string
  autoLock: number
  createdAt: string
  updatedAt: string
}

export interface UpdatePreferencesRequest {
  theme?: string
  language?: string
  autoLock?: number
}

export interface CreatePreferencesRequest {
  userId: string
  theme?: string
  language?: string
  autoLock?: number
}

export const preferencesApi = {
  // Buscar preferências do usuário
  async getPreferences(): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    try {
      const response = await api.get('/preferences')
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar preferências'
      }
    }
  },

  // Criar preferências do usuário
  async createPreferences(data: CreatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    try {
      const response = await api.post('/preferences', data)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar preferências'
      }
    }
  },

  // Atualizar preferências do usuário
  async updatePreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    try {
      const response = await api.put('/preferences', data)
      return response.data
    } catch (error: any) {
      console.error('preferencesApi.updatePreferences - Erro:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar preferências'
      }
    }
  },

  // Atualizar ou criar preferências (upsert)
  async upsertPreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    try {
      const response = await api.patch('/preferences', data)
      return response.data
    } catch (error: any) {
      console.error('preferencesApi.upsertPreferences - Erro:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao salvar preferências'
      }
    }
  },

  // Deletar preferências do usuário
  async deletePreferences(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete('/preferences')
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar preferências'
      }
    }
  }
}

export default preferencesApi
