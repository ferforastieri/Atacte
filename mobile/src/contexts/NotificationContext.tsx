import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationData } from '../services/notification/notificationService';
import { useAuth as useAuthContext } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  sendSOS: (latitude: number, longitude: number) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      // Registrar para notificações push
      await notificationService.registerForPushNotifications();

      // Configurar listeners
      notificationService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationResponse
      );

      // Carregar notificações iniciais
      await refreshNotifications();
      await updateUnreadCount();
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notificação recebida:', notification);
    
    // Atualizar lista de notificações
    refreshNotifications();
    updateUnreadCount();
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Resposta da notificação:', response);
    
    const data = response.notification.request.content.data;
    
    // Lidar com diferentes tipos de notificações
    if (data?.type === 'sos') {
      // Navegar para o mapa da família
      console.log('Alerta SOS recebido!');
    } else if (data?.type === 'family_invite') {
      // Navegar para a tela de famílias
      console.log('Convite de família recebido!');
    }
  };

  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(undefined, 50, 0);
      
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
        
        // Atualizar badge do app
        await notificationService.setBadgeCount(response.data.count);
      }
    } catch (error) {
      console.error('Erro ao atualizar contagem:', error);
    }
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      const response = await notificationService.markAsRead(id);
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const response = await notificationService.markAllAsRead();
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      const response = await notificationService.deleteNotification(id);
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  };

  const sendSOS = async (latitude: number, longitude: number): Promise<boolean> => {
    try {
      const response = await notificationService.sendSOS({ latitude, longitude });
      
      if (response.success) {
        // Exibir notificação local de confirmação
        await notificationService.showLocalNotification(
          '🚨 SOS Enviado',
          'Sua família foi notificada sobre sua emergência!',
          { type: 'sos', latitude, longitude },
          'sos'
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao enviar SOS:', error);
      return false;
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendSOS,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}

