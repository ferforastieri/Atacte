import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '../components/shared';
import { TotpCard } from '../components/totp/TotpCard';
import { passwordService } from '../services/passwords/passwordService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
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

export default function TotpScreen() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
        // Filtrar apenas senhas com TOTP habilitado
        const passwords = Array.isArray(response.data) ? response.data : [];
        const totpPasswords = passwords.filter((password: PasswordEntry) => password.totpEnabled);
        setPasswords(totpPasswords);
      } else {
        setPasswords([]);
      }
    } catch (error) {
      setPasswords([]);
      Alert.alert('Erro', 'Erro ao carregar senhas TOTP');
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
      paddingTop: 60,
      paddingBottom: 100, // Espaço para a navegação inferior
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
                onPress={() => {}}
                onEdit={() => {}}
                onToggleFavorite={() => {}}
                onCopyPassword={() => copyToClipboard(password.password, 'Senha')}
                onCopyUsername={() => copyToClipboard(password.username!, 'Usuário')}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
