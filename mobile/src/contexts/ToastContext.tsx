import React, { createContext, useContext, ReactNode } from 'react';
import { showMessage, hideMessage } from 'react-native-flash-message';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
    success: {
      bg: isDark ? '#065f46' : '#dcfce7',
      border: isDark ? '#10b981' : '#16a34a',
      text: isDark ? '#d1fae5' : '#166534',
      icon: isDark ? '#10b981' : '#16a34a',
    },
    error: {
      bg: isDark ? '#7f1d1d' : '#fef2f2',
      border: isDark ? '#ef4444' : '#dc2626',
      text: isDark ? '#fecaca' : '#991b1b',
      icon: isDark ? '#ef4444' : '#dc2626',
    },
    info: {
      bg: isDark ? '#1e3a8a' : '#eff6ff',
      border: isDark ? '#60a5fa' : '#3b82f6',
      text: isDark ? '#dbeafe' : '#1e40af',
      icon: isDark ? '#60a5fa' : '#3b82f6',
    },
    warning: {
      bg: isDark ? '#78350f' : '#fffbeb',
      border: isDark ? '#fbbf24' : '#eab308',
      text: isDark ? '#fef3c7' : '#92400e',
      icon: isDark ? '#fbbf24' : '#eab308',
    },
  };

  const getBaseStyle = (colorScheme: any) => ({
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 50,
    borderWidth: 2,
    borderColor: colorScheme.border,
    backgroundColor: colorScheme.bg,
    shadowColor: colorScheme.border,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: isDark ? 0.5 : 0.2,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1 }],
    paddingHorizontal: 20,
    paddingVertical: 16,
  });

  const showSuccess = (message: string) => {
    showMessage({
      message,
      type: 'success',
      backgroundColor: 'transparent',
      color: colors.success.text,
      duration: 4000,
      style: getBaseStyle(colors.success),
      titleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.success.text,
        marginLeft: 8,
      },
      textStyle: {
        fontSize: 15,
        color: colors.success.text,
        marginLeft: 8,
        lineHeight: 20,
      },
      icon: {
        icon: 'success',
        position: 'left',
        props: {},
      },
      animationDuration: 400,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
      renderFlashMessageIcon: () => (
        <Ionicons name="checkmark-circle" size={24} color={colors.success.icon} />
      ),
    });
  };

  const showError = (message: string) => {
    showMessage({
      message,
      type: 'danger',
      backgroundColor: 'transparent',
      color: colors.error.text,
      duration: 5000,
      style: getBaseStyle(colors.error),
      titleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.error.text,
        marginLeft: 8,
      },
      textStyle: {
        fontSize: 15,
        color: colors.error.text,
        marginLeft: 8,
        lineHeight: 20,
      },
      icon: {
        icon: 'danger',
        position: 'left',
        props: {},
      },
      animationDuration: 400,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
      renderFlashMessageIcon: () => (
        <Ionicons name="close-circle" size={24} color={colors.error.icon} />
      ),
    });
  };

  const showInfo = (message: string) => {
    showMessage({
      message,
      type: 'info',
      backgroundColor: 'transparent',
      color: colors.info.text,
      duration: 4000,
      style: getBaseStyle(colors.info),
      titleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.info.text,
        marginLeft: 8,
      },
      textStyle: {
        fontSize: 15,
        color: colors.info.text,
        marginLeft: 8,
        lineHeight: 20,
      },
      icon: {
        icon: 'info',
        position: 'left',
        props: {},
      },
      animationDuration: 400,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
      renderFlashMessageIcon: () => (
        <Ionicons name="information-circle" size={24} color={colors.info.icon} />
      ),
    });
  };

  const showWarning = (message: string) => {
    showMessage({
      message,
      type: 'warning',
      backgroundColor: 'transparent',
      color: colors.warning.text,
      duration: 4000,
      style: getBaseStyle(colors.warning),
      titleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.warning.text,
        marginLeft: 8,
      },
      textStyle: {
        fontSize: 15,
        color: colors.warning.text,
        marginLeft: 8,
        lineHeight: 20,
      },
      icon: {
        icon: 'warning',
        position: 'left',
        props: {},
      },
      animationDuration: 400,
      floating: true,
      position: 'top',
      autoHide: true,
      hideOnPress: true,
      renderFlashMessageIcon: () => (
        <Ionicons name="warning" size={24} color={colors.warning.icon} />
      ),
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
