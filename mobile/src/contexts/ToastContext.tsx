import React, { createContext, useContext, ReactNode } from 'react';
import { showMessage, hideMessage } from 'react-native-flash-message';
import { useTheme } from './ThemeContext';

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { isDark } = useTheme();

  
  const colors = {
    success: isDark ? '#22c55e' : '#16a34a', 
    error: isDark ? '#ef4444' : '#dc2626',   
    info: isDark ? '#60a5fa' : '#3b82f6',
    warning: isDark ? '#fbbf24' : '#eab308',
    background: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    border: isDark ? '#374151' : '#e5e7eb',
  };

  const baseStyle = {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 50,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
  };

  const showSuccess = (message: string) => {
    showMessage({
      message,
      type: 'success',
      backgroundColor: colors.success,
      color: '#ffffff',
      duration: 3000,
      style: baseStyle,
      titleStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      },
      textStyle: {
        fontSize: 14,
        color: '#ffffff',
      },
      animationDuration: 300,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
    });
  };

  const showError = (message: string) => {
    showMessage({
      message,
      type: 'danger',
      backgroundColor: colors.error,
      color: '#ffffff',
      duration: 4000,
      style: baseStyle,
      titleStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      },
      textStyle: {
        fontSize: 14,
        color: '#ffffff',
      },
      animationDuration: 300,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
    });
  };

  const showInfo = (message: string) => {
    showMessage({
      message,
      type: 'info',
      backgroundColor: colors.info,
      color: '#ffffff',
      duration: 3000,
      style: baseStyle,
      titleStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      },
      textStyle: {
        fontSize: 14,
        color: '#ffffff',
      },
      animationDuration: 300,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
    });
  };

  const showWarning = (message: string) => {
    showMessage({
      message,
      type: 'warning',
      backgroundColor: colors.warning,
      color: '#ffffff',
      duration: 3000,
      style: baseStyle,
      titleStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      },
      textStyle: {
        fontSize: 14,
        color: '#ffffff',
      },
      animationDuration: 300,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
    });
  };

  const hideToast = () => {
    hideMessage();
  };

  const value: ToastContextType = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
