import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService } from './locationService';

const LOCATION_TASK_NAME = 'background-location-task';

class BackgroundLocationManager {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Verificar se o app foi iniciado pelo sistema (boot)
      const isBootCompleted = await this.checkBootCompleted();
      
      if (isBootCompleted) {
        await this.restartLocationTracking();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar BackgroundLocationManager:', error);
    }
  }

  private async checkBootCompleted(): Promise<boolean> {
    try {
      // Verificar se há permissões de background location
      const { status } = await Location.getBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões de boot:', error);
      return false;
    }
  }

  private async restartLocationTracking(): Promise<void> {
    try {
      // Verificar se o usuário está autenticado (você pode implementar uma verificação local)
      const isAuthenticated = await this.checkUserAuthentication();
      
      if (!isAuthenticated) {
        return;
      }

      // Verificar se já está rodando
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (!isRunning) {
        await locationService.startBackgroundLocation();
        console.log('✅ Rastreamento de localização reiniciado após boot');
      }
    } catch (error) {
      console.error('❌ Erro ao reiniciar rastreamento:', error);
    }
  }

  private async checkUserAuthentication(): Promise<boolean> {
    try {
      // Aqui você pode implementar uma verificação local de autenticação
      // Por exemplo, verificar se há um token válido no AsyncStorage
      // Por enquanto, retornamos true para permitir o rastreamento
      return true;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  async handleAppStateChange(nextAppState: string): Promise<void> {
    try {
      if (nextAppState === 'active') {
        // App voltou ao foreground, verificar se o rastreamento ainda está ativo
        const isActive = await locationService.isBackgroundLocationActive();
        
        if (!isActive) {
          console.log('🔄 Reiniciando rastreamento de localização...');
          await locationService.startBackgroundLocation();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao lidar com mudança de estado do app:', error);
    }
  }
}

export const backgroundLocationManager = new BackgroundLocationManager();