import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.15.2:3000/api';

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
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await AsyncStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  }

  async getPreferences(): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences');
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async upsertPreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const preferencesService = new PreferencesService();
