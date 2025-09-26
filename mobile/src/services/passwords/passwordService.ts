import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  customFields?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
}

interface CreatePasswordRequest {
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite?: boolean;
  totpSecret?: string;
  customFields?: Array<{
    name: string;
    value: string;
  }>;
}

interface UpdatePasswordRequest {
  name?: string;
  website?: string;
  username?: string;
  password?: string;
  folder?: string;
  notes?: string;
  isFavorite?: boolean;
  totpSecret?: string;
  customFields?: Array<{
    name: string;
    value: string;
  }>;
}

interface PasswordListResponse {
  success: boolean;
  data?: PasswordEntry[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

class PasswordService {
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

  async getPasswords(params?: {
    query?: string;
    folder?: string;
    isFavorite?: boolean;
    totpEnabled?: boolean;
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PasswordListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.query) searchParams.append('query', params.query);
    if (params?.folder) searchParams.append('folder', params.folder);
    if (params?.isFavorite !== undefined) searchParams.append('isFavorite', params.isFavorite.toString());
    if (params?.totpEnabled !== undefined) searchParams.append('totpEnabled', params.totpEnabled.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = `/passwords${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(endpoint);
  }

  async createPassword(passwordData: CreatePasswordRequest): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest('/passwords', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async updatePassword(id: string, passwordData: UpdatePasswordRequest): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest(`/passwords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async deletePassword(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/passwords/${id}`, {
      method: 'DELETE',
    });
  }

  async getPassword(id: string): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest(`/passwords/${id}`);
  }
}

export const passwordService = new PasswordService();
