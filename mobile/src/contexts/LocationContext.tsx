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
    } else {
      // Se desautenticado, parar tracking
      stopTracking();
    }
  }, [isAuthenticated]);

  // Verificar se o tracking ainda está ativo periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTrackingStatus = async () => {
      try {
        const backgroundFunctions = (global as any).backgroundLocationFunctions;
        if (!backgroundFunctions) return;
        
        const isActive = await backgroundFunctions.isBackgroundLocationActive();
        if (!isActive && isTrackingActive) {
          await checkAndStartTracking();
        }
      } catch (error) {
        console.error('Erro ao verificar status do tracking:', error);
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkTrackingStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isTrackingActive]);

  const initializeLocation = async () => {
    try {
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return;
      }
      
      const isActive = await backgroundFunctions.isBackgroundLocationActive();
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
        return;
      }
      
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return;
      }
      
      const isActive = await backgroundFunctions.isBackgroundLocationActive();
      
      if (isActive) {
        setIsTrackingActive(true);
        return;
      }
      
      const started = await backgroundFunctions.startBackgroundLocation();
      
      if (started) {
        setIsTrackingActive(true);
        await locationService.sendCurrentLocation();
      } else {
        setIsTrackingActive(false);
      }
    } catch (error) {
      console.error('Erro ao verificar e iniciar rastreamento:', error);
      setIsTrackingActive(false);
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
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return false;
      }
      
      const success = await backgroundFunctions.startBackgroundLocation();
      
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
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return;
      }
      
      await backgroundFunctions.stopBackgroundLocation();
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

