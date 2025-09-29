import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '../components/shared';
import { Modal } from '../components/shared/Modal';
import { TotpCard } from '../components/totp/TotpCard';
import { passwordService } from '../services/passwords/passwordService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
  totpSecret?: string;
}

type TotpScreenNavigationProp = StackNavigationProp<{
  PasswordDetail: { passwordId: string };
  Dashboard: undefined;
}>;

export default function TotpScreen() {
  const navigation = useNavigation<TotpScreenNavigationProp>();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPassword, setDeletingPassword] = useState<PasswordEntry | null>(null);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadTotpPasswords();
  }, []);

  const loadTotpPasswords = async () => {
    try {
      const response = await passwordService.getPasswords({
        limit: 100,
      });
      
      if (response.success && response.data) {
        
        const passwords = Array.isArray(response.data) ? response.data : [];
        const totpPasswords = passwords.filter((password: PasswordEntry) => password.totpEnabled);
        setPasswords(totpPasswords);
      } else {
        setPasswords([]);
      }
    } catch (error) {
      setPasswords([]);
      showError('Erro ao carregar senhas TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTotpPasswords();
    setIsRefreshing(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(`${label} copiado!`);
    } catch (error) {
      showError('Erro ao copiar');
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    navigation.navigate('PasswordDetail', { passwordId: password.id });
  };

  const handleDeletePassword = (password: PasswordEntry) => {
    setDeletingPassword(password);
    setShowDeleteModal(true);
  };

  const confirmDeletePassword = async () => {
    if (!deletingPassword) return;
    
    try {
      const response = await passwordService.deletePassword(deletingPassword.id);
      if (response.success) {
        showSuccess('Senha excluída!');
        await loadTotpPasswords(); 
      } else {
        showError(response.message || 'Erro ao excluir senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setShowDeleteModal(false);
      setDeletingPassword(null);
    }
  };

  const handleToggleFavorite = async (password: PasswordEntry) => {
    try {
      const response = await passwordService.updatePassword(password.id, {
        isFavorite: !password.isFavorite,
      });
      
      if (response.success) {
        showSuccess(
          password.isFavorite 
            ? 'Removido dos favoritos!' 
            : 'Adicionado aos favoritos!'
        );
        await loadTotpPasswords(); 
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      showError('Erro ao atualizar favorito');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
      paddingTop: 60,
      paddingBottom: 100, 
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
      lineHeight: 20,
    },
    passwordsList: {
      gap: 12,
    },
    passwordCard: {
      marginBottom: 12,
    },
    passwordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    passwordInfo: {
      flex: 1,
    },
    passwordName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    passwordWebsite: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 2,
    },
    passwordUsername: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    totpBadge: {
      backgroundColor: '#22c55e',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    totpBadgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
    passwordActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 16,
    },
    
    modalContent: {
      padding: 20,
    },
    modalText: {
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      borderWidth: 1,
      borderColor: isDark ? '#4b5563' : '#d1d5db',
    },
    deleteButton: {
      backgroundColor: '#dc2626',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#ffffff',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="TOTP" onThemeToggle={toggleTheme} />
        <View style={styles.loadingContainer}>
          <Ionicons name="time-outline" size={48} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={styles.loadingText}>Carregando TOTP...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="TOTP" onThemeToggle={toggleTheme} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {passwords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="time-outline" 
              size={64} 
              color={isDark ? '#9ca3af' : '#6b7280'} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Nenhuma senha TOTP</Text>
            <Text style={styles.emptyText}>
              Você ainda não tem senhas com autenticação de dois fatores configuradas.
            </Text>
          </View>
        ) : (
          <View style={styles.passwordsList}>
            {passwords.map((password) => (
              <TotpCard
                key={password.id}
                password={password}
                onPress={() => handleEditPassword(password)}
                onEdit={() => handleEditPassword(password)}
                onDelete={() => handleDeletePassword(password)}
                onToggleFavorite={() => handleToggleFavorite(password)}
                onCopyPassword={() => copyToClipboard(password.password, 'Senha')}
                onCopyUsername={() => copyToClipboard(password.username!, 'Usuário')}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalText, { color: isDark ? '#f9fafb' : '#111827' }]}>
            Tem certeza que deseja excluir a senha "{deletingPassword?.name}"?
          </Text>
          <Text style={[styles.modalSubtext, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Esta ação não pode ser desfeita.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={confirmDeletePassword}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
