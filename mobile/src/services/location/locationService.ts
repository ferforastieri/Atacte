import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
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
      
      return backgroundStatus === 'granted';
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

  // Iniciar rastreamento em background
  async startBackgroundLocation(): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      
      if (!hasPermissions) {
        return false;
      }

      // Verificar se a tarefa já está registrada
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      
      if (!isTaskDefined) {
        // Definir a tarefa de background
        TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
          if (error) {
            console.error('Erro na tarefa de localização:', error);
            return;
          }
          
          if (data) {
            const { locations } = data;
            const location = locations[0];
            
            if (location) {
              const batteryLevel = await this.getBatteryLevel();
              
              await this.updateLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                speed: location.coords.speed,
                heading: location.coords.heading,
                batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
                isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
              });
            }
          }
        });
      }

      // Iniciar rastreamento em background
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 1 minuto
        distanceInterval: 100, // 100 metros
        foregroundService: {
          notificationTitle: 'Atacte',
          notificationBody: 'Compartilhando sua localização com sua família',
          notificationColor: '#ffffff',
        },
        pausesUpdatesAutomatically: true,
        activityType: Location.ActivityType.Other,
        showsBackgroundLocationIndicator: true,
      });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento em background:', error);
      return false;
    }
  }

  // Parar rastreamento em background
  async stopBackgroundLocation(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (error) {
      console.error('Erro ao parar rastreamento em background:', error);
    }
  }

  // Verificar se o rastreamento está ativo
  async isBackgroundLocationActive(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('Erro ao verificar rastreamento:', error);
      return false;
    }
  }

  // Enviar localização atual
  async sendCurrentLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return false;
      }

      const batteryLevel = await this.getBatteryLevel();

      const result = await this.updateLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
        isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
      });

      return result.success;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  }
}

export const locationService = new LocationService();

