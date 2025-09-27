import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

interface UserPreferences {
  id: string;
  userId: string;
  theme: string;
  language: string;
  autoLock: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdatePreferencesRequest {
  theme?: string;
  language?: string;
  autoLock?: number;
}

class PreferencesService {
  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Erro de conexão' };
    }
  }

  async getPreferences(): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences');
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PUT',
      data: data,
    });
  }

  async upsertPreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PATCH',
      data: data,
    });
  }
}

export const preferencesService = new PreferencesService();
