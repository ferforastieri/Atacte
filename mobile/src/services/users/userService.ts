import apiClient from '../../lib/axios';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UpdateUserProfileData {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  message?: string;
}

class UserService {
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

  async getUserProfile(): Promise<UserProfileResponse> {
    return this.makeRequest('/users/profile');
  }

  async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponse> {
    return this.makeRequest('/users/profile', {
      method: 'PATCH',
      data: data,
    });
  }
}

export const userService = new UserService();
