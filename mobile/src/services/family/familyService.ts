import apiClient from '../../lib/axios';

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  members: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  userId: string;
  userName: string | null;
  email: string;
  profilePicture: string | null;
  role: string;
  nickname: string | null;
  joinedAt: string;
  isActive: boolean;
  shareLocation: boolean;
  showOnMap: boolean;
}

export interface CreateFamilyRequest {
  name: string;
  description?: string;
}

export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
}

export interface JoinFamilyRequest {
  inviteCode: string;
  nickname?: string;
}

export interface UpdateMemberSettingsRequest {
  nickname?: string;
  shareLocation?: boolean;
  showOnMap?: boolean;
}

class FamilyService {
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

  async getFamilies(): Promise<{ success: boolean; data?: Family[]; message?: string }> {
    return this.makeRequest('/family');
  }

  async getFamily(id: string): Promise<{ success: boolean; data?: Family; message?: string }> {
    return this.makeRequest(`/family/${id}`);
  }

  async createFamily(data: CreateFamilyRequest): Promise<{ success: boolean; data?: Family; message?: string }> {
    return this.makeRequest('/family', {
      method: 'POST',
      data,
    });
  }

  async updateFamily(id: string, data: UpdateFamilyRequest): Promise<{ success: boolean; data?: Family; message?: string }> {
    return this.makeRequest(`/family/${id}`, {
      method: 'PUT',
      data,
    });
  }

  async deleteFamily(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/family/${id}`, {
      method: 'DELETE',
    });
  }

  async joinFamily(data: JoinFamilyRequest): Promise<{ success: boolean; data?: Family; message?: string }> {
    return this.makeRequest('/family/join', {
      method: 'POST',
      data,
    });
  }

  async leaveFamily(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/family/${id}/leave`, {
      method: 'POST',
    });
  }

  async removeMember(familyId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/family/${familyId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRole(familyId: string, userId: string, role: string): Promise<{ success: boolean; data?: FamilyMember; message?: string }> {
    return this.makeRequest(`/family/${familyId}/members/${userId}/role`, {
      method: 'PATCH',
      data: { role },
    });
  }

  async updateMemberSettings(familyId: string, data: UpdateMemberSettingsRequest): Promise<{ success: boolean; data?: FamilyMember; message?: string }> {
    return this.makeRequest(`/family/${familyId}/settings`, {
      method: 'PATCH',
      data,
    });
  }
}

export const familyService = new FamilyService();

