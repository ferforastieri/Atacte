import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import apiClient from '../../lib/axios';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  timestamp: string;
  batteryLevel?: number;
  isMoving: boolean;
}

export interface FamilyMapData {
  familyId: string;
  familyName: string;
  members: FamilyMemberLocation[];
}

export interface FamilyMemberLocation {
  userId: string;
  userName: string;
  nickname: string | null;
  profilePicture: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  address: string | null;
  timestamp: string;
  batteryLevel: number | null;
  isMoving: boolean;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isMoving?: boolean;
}

class LocationService {
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

  // Solicitar permissões de localização
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return false;
      }
      
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        // Mesmo sem background, podemos continuar com foreground
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      return false;
    }
  }

  // Obter localização atual
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }

  // Obter nível de bateria
  async getBatteryLevel(): Promise<number> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      return batteryLevel;
    } catch (error) {
      console.error('Erro ao obter nível de bateria:', error);
      return -1;
    }
  }

  // Atualizar localização no servidor
  async updateLocation(data: UpdateLocationRequest): Promise<{ success: boolean; data?: LocationData; message?: string }> {
    return this.makeRequest('/location', {
      method: 'POST',
      data,
    });
  }

  // Obter última localização
  async getLatestLocation(): Promise<{ success: boolean; data?: LocationData; message?: string }> {
    return this.makeRequest('/location/latest');
  }

  // Obter histórico de localização
  async getLocationHistory(startDate: Date, endDate: Date, limit?: number): Promise<{ success: boolean; data?: LocationData[]; message?: string }> {
    return this.makeRequest('/location/history', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit,
      },
    });
  }

  // Obter localizações da família
  async getFamilyLocations(familyId: string): Promise<{ success: boolean; data?: FamilyMapData; message?: string }> {
    return this.makeRequest(`/location/family/${familyId}`);
  }

  // Obter estatísticas de localização
  async getLocationStats(): Promise<{ success: boolean; data?: { totalLocations: number; latestLocation: LocationData | null }; message?: string }> {
    return this.makeRequest('/location/stats');
  }



  // Enviar localização atual
  async sendCurrentLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return false;
      }

      const batteryLevel = await this.getBatteryLevel();

      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
        isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
      };

      const result = await this.updateLocation(payload);
      return result.success;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  }
}

export const locationService = new LocationService();

