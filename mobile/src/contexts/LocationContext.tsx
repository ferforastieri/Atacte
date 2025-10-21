import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { locationService, LocationData, FamilyMapData } from '../services/location/locationService';
import { familyService } from '../services/family/familyService';
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

  useEffect(() => {
    if (isAuthenticated) {
      initializeLocation();
    } else {
      // Se desautenticado, parar tracking
      stopTracking();
    }
  }, [isAuthenticated]);

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
        return;
      }
      
      const isActive = await locationService.isBackgroundLocationActive();
      
      if (isActive) {
        return;
      }
      
      const hasPermissions = await locationService.requestPermissions();
      
      if (!hasPermissions) {
        return;
      }
      
      const started = await locationService.startBackgroundLocation();
      
      if (started) {
        setIsTrackingActive(true);
        await locationService.sendCurrentLocation();
      }
    } catch (error) {
      console.error('Erro ao verificar e iniciar rastreamento:', error);
    }
  };

  const refreshLocation = async () => {
    try {
      setIsLoading(true);
      const response = await locationService.getLatestLocation();
      
      if (response.success && response.data) {
        setCurrentLocation(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar localização:', error);
    } finally {
      setIsLoading(false);
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

