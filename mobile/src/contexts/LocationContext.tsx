import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { locationService, LocationData, FamilyMapData } from '../services/location/locationService';
import { familyService } from '../services/family/familyService';
import { geofenceService, GeofenceZone } from '../services/geofence/geofenceService';
import { notificationService } from '../services/notification/notificationService';
import * as Notifications from 'expo-notifications';
import { useAuth as useAuthContext } from './AuthContext';

interface LocationContextType {
  currentLocation: LocationData | null;
  isTrackingActive: boolean;
  isLoading: boolean;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  sendCurrentLocation: () => Promise<boolean>;
  getFamilyLocations: (familyId: string) => Promise<FamilyMapData | null>;
  refreshLocation: () => Promise<void>;
  checkAndStartTracking: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const { isAuthenticated } = useAuthContext();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const activeZones = useRef<Set<string>>(new Set());
  const lastCheckTime = useRef<number>(Date.now());

  useEffect(() => {
    if (isAuthenticated) {
      initializeLocation();
      
      // Verificar periodicamente se o rastreamento ainda está ativo
      const interval = setInterval(async () => {
        try {
          const isActive = await locationService.isBackgroundLocationActive();
          if (isActive !== isTrackingActive) {
            console.log(`🔄 Estado do rastreamento mudou: ${isActive ? 'ativo' : 'inativo'}`);
            setIsTrackingActive(isActive);
            
            // Se parou de funcionar, tentar reiniciar
            if (!isActive) {
              console.log('🔄 Tentando reiniciar rastreamento...');
              await checkAndStartTracking();
            }
          }
        } catch (error) {
          console.error('Erro ao verificar estado do rastreamento:', error);
        }
      }, 30000); // Verificar a cada 30 segundos

      return () => clearInterval(interval);
    } else {
      // Se desautenticado, parar tracking
      stopTracking();
    }
  }, [isAuthenticated, isTrackingActive]);

  const initializeLocation = async () => {
    try {
      const isActive = await locationService.isBackgroundLocationActive();
      setIsTrackingActive(isActive);
      
      if (!isActive) {
        await checkAndStartTracking();
      }

      await refreshLocation();
    } catch (error) {
      console.error('Erro ao inicializar localização:', error);
    }
  };

  const checkAndStartTracking = async () => {
    try {
      const response = await familyService.getFamilies();
      
      if (!response.success || !response.data || response.data.length === 0) {
        console.log('📱 Usuário não está em nenhuma família, não iniciando rastreamento');
        return;
      }
      
      const isActive = await locationService.isBackgroundLocationActive();
      
      if (isActive) {
        console.log('📍 Rastreamento já está ativo');
        setIsTrackingActive(true);
        return;
      }
      
      console.log('🔐 Solicitando permissões de localização...');
      const hasPermissions = await locationService.requestPermissions();
      
      if (!hasPermissions) {
        console.log('❌ Permissões de localização negadas');
        return;
      }
      
      console.log('🚀 Iniciando rastreamento de localização em background...');
      const started = await locationService.startBackgroundLocation();
      
      if (started) {
        console.log('✅ Rastreamento iniciado com sucesso');
        setIsTrackingActive(true);
        await locationService.sendCurrentLocation();
      } else {
        console.log('❌ Falha ao iniciar rastreamento');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar e iniciar rastreamento:', error);
    }
  };

  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      const response = await locationService.getLatestLocation();
      
      if (response.success && response.data) {
        setCurrentLocation(response.data);
        
        // Verificar zonas apenas a cada 30 segundos para economizar bateria
        const now = Date.now();
        if (now - lastCheckTime.current >= 30000) {
          await checkGeofenceZones(response.data);
          lastCheckTime.current = now;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar localização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkGeofenceZones = async (location: LocationData) => {
    try {
      const zonesResponse = await geofenceService.getUserZones(true);
      
      if (!zonesResponse.success || !zonesResponse.data) {
        return;
      }

      const zones = zonesResponse.data;
      const currentlyInZones = new Set<string>();

      for (const zone of zones) {
        const isInZone = geofenceService.isPointInZone(
          location.latitude,
          location.longitude,
          zone
        );

        if (isInZone) {
          currentlyInZones.add(zone.id);
          
          // Se acabou de entrar na zona
          if (!activeZones.current.has(zone.id) && zone.notifyOnEnter) {
            await sendGeofenceNotification(zone, 'enter');
          }
        } else {
          // Se acabou de sair da zona
          if (activeZones.current.has(zone.id) && zone.notifyOnExit) {
            await sendGeofenceNotification(zone, 'exit');
          }
        }
      }

      activeZones.current = currentlyInZones;
    } catch (error) {
      console.error('Erro ao verificar zonas:', error);
    }
  };

  const sendGeofenceNotification = async (zone: GeofenceZone, type: 'enter' | 'exit') => {
    try {
      // Notificar apenas a família (não notificar a si mesmo)
      await notifyFamilyAboutGeofence(zone, type);
    } catch (error) {
      console.error('Erro ao enviar notificação de zona:', error);
    }
  };

  const notifyFamilyAboutGeofence = async (zone: GeofenceZone, type: 'enter' | 'exit') => {
    try {
      // Usar o serviço de notificação seguindo o padrão do projeto
      await notificationService.sendGeofenceNotification({
        zoneName: zone.name,
        eventType: type,
        zoneId: zone.id,
      });
    } catch (error) {
      console.error('Erro ao notificar família sobre zona:', error);
    }
  };

  const startTracking = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await locationService.startBackgroundLocation();
      
      if (success) {
        setIsTrackingActive(true);
        await sendCurrentLocation();
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await locationService.stopBackgroundLocation();
      setIsTrackingActive(false);
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCurrentLocation = async (): Promise<boolean> => {
    try {
      const success = await locationService.sendCurrentLocation();
      
      if (success) {
        await refreshLocation();
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  };

  const getFamilyLocations = async (familyId: string): Promise<FamilyMapData | null> => {
    try {
      const response = await locationService.getFamilyLocations(familyId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter localizações da família:', error);
      return null;
    }
  };

  const value = {
    currentLocation,
    isTrackingActive,
    isLoading,
    startTracking,
    stopTracking,
    sendCurrentLocation,
    getFamilyLocations,
    refreshLocation,
    checkAndStartTracking,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  
  return context;
}

