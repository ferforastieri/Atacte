import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface TotpCodeResponse {
  success: boolean;
  data?: {
    code: string;
    timeRemaining: number;
    period: number;
  };
  message?: string;
}

class TotpService {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async getTotpCode(passwordId: string): Promise<TotpCodeResponse> {
    return this.makeRequest(`/totp/passwords/${passwordId}`);
  }

  async addTotpToPassword(passwordId: string, totpInput: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'POST',
      body: JSON.stringify({ totpInput }),
    });
  }

  async removeTotpFromPassword(passwordId: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'DELETE',
    });
  }
}

export const totpService = new TotpService();
