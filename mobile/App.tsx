import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import { locationService } from './src/services/location/locationService';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

const LOCATION_TASK_NAME = 'background-location-task';

// Registrar a task de background ANTES de qualquer uso
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        
        const payload: any = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
        };
        
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
        
        await locationService.updateLocation(payload);
      } catch (error: any) {
        // Erro ao processar localização em background
      }
    }
  }
});

// Funções de background location exportadas para uso global
const backgroundLocationFunctions = {
    // Iniciar rastreamento em background
    startBackgroundLocation: async (): Promise<boolean> => {
      try {
        // Verificar permissões (já foram solicitadas anteriormente)
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          return false;
        }

        // Verificar permissões de background
        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          // Não retornar false aqui, permitir funcionar sem background
        }

        // Verificar se já está rodando
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        
        if (isRunning) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        // Iniciar rastreamento em background
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000, // 15 segundos
          distanceInterval: 50, // 50 metros
          deferredUpdatesInterval: 15000,
          foregroundService: {
            notificationTitle: 'Atacte - Rastreamento Ativo',
            notificationBody: 'Compartilhando sua localização com sua família',
            notificationColor: '#16a34a',
            killServiceOnDestroy: false,
          },
          pausesUpdatesAutomatically: false,
          activityType: Location.ActivityType.OtherNavigation,
          showsBackgroundLocationIndicator: true,
          mayShowUserSettingsDialog: true,
        });

        return true;
      } catch (error) {
        return false;
      }
    },

    // Parar rastreamento em background
    stopBackgroundLocation: async (): Promise<void> => {
      try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      } catch (error) {
        // Erro ao parar background location
      }
    },

    // Verificar se o rastreamento está ativo
    isBackgroundLocationActive: async (): Promise<boolean> => {
      try {
        const isActive = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        return isActive;
      } catch (error) {
        return false;
      }
    }
  };

// Tornar as funções disponíveis globalmente
(global as any).backgroundLocationFunctions = backgroundLocationFunctions;

export default function App() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <LocationProvider>
                  <View style={styles.container}>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </View>
                </LocationProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});