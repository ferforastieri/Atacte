import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import apiClient from '../../lib/axios';

const LOCATION_TASK_NAME = 'background-location-task';

// Registrar a task de background ANTES de qualquer uso
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ Erro na tarefa de localização:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        
        // Construir payload apenas com campos válidos
        const payload: any = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
        };
        
        // Adicionar campos opcionais apenas se tiverem valor
        if (location.coords.accuracy !== null && location.coords.accuracy !== undefined) {
          payload.accuracy = location.coords.accuracy;
        }
        if (location.coords.altitude !== null && location.coords.altitude !== undefined) {
          payload.altitude = location.coords.altitude;
        }
        if (location.coords.speed !== null && location.coords.speed !== undefined) {
          payload.speed = location.coords.speed;
        }
        if (location.coords.heading !== null && location.coords.heading !== undefined) {
          payload.heading = location.coords.heading;
        }
        if (batteryLevel >= 0) {
          payload.batteryLevel = batteryLevel;
        }
        
        await apiClient.post('/location', payload);
      } catch (error: any) {
        console.error('❌ Erro ao enviar localização:', error.response?.data || error.message);
      }
    }
  }
});

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

      // Verificar se já está rodando
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Iniciar rastreamento em background
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 1 minuto - mais eficiente para bateria
        distanceInterval: 100, // 100 metros - menos sensível a pequenos movimentos
        deferredUpdatesInterval: 60000,
        foregroundService: {
          notificationTitle: 'Atacte - Rastreamento Ativo',
          notificationBody: 'Compartilhando sua localização com sua família',
          notificationColor: '#16a34a',
        },
        pausesUpdatesAutomatically: false, // Não pausar automaticamente
        activityType: Location.ActivityType.Other,
        showsBackgroundLocationIndicator: true,
        // Configurações específicas para Android
        android: {
          notificationTitle: 'Atacte - Rastreamento Ativo',
          notificationBody: 'Compartilhando sua localização com sua família',
          notificationColor: '#16a34a',
          killServiceOnDestroy: false,
        },
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao iniciar rastreamento em background:', error);
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
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
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

