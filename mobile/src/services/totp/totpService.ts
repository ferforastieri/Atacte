import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

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

  async getTotpCode(passwordId: string): Promise<TotpCodeResponse> {
    return this.makeRequest(`/totp/passwords/${passwordId}`);
  }

  async getTotpSecret(passwordId: string): Promise<{ success: boolean; data?: { secret: string }; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}/secret`);
  }

  async addTotpToPassword(passwordId: string, totpInput: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'POST',
      data: { totpInput },
    });
  }

  async removeTotpFromPassword(passwordId: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'DELETE',
    });
  }
}

export const totpService = new TotpService();
