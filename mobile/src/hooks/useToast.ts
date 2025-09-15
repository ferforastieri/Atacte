import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

export const useToast = () => {
  const showSuccess = useCallback((message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Sucesso',
      text2: message,
      position: 'top',
    });
  }, []);

  const showError = useCallback((message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: message,
      position: 'top',
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Informação',
      text2: message,
      position: 'top',
    });
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
  };
};
