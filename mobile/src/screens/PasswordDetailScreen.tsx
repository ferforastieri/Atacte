import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '../components/shared';
import { passwordService } from '../services/passwords/passwordService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type PasswordDetailRouteProp = RouteProp<RootStackParamList, 'PasswordDetail'>;

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
  customFields?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PasswordDetailScreen() {
  const route = useRoute<PasswordDetailRouteProp>();
  const { passwordId } = route.params;
  
  const [password, setPassword] = useState<PasswordEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadPassword();
  }, [passwordId]);

  const loadPassword = async () => {
    try {
      const response = await passwordService.getPassword(passwordId);
      
      if (response.success && response.data) {
        setPassword(response.data);
      } else {
        Alert.alert('Erro', 'Senha não encontrada');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(`${label} copiado!`);
    } catch (error) {
      showError('Erro ao copiar');
    }
  };

  const toggleFavorite = async () => {
    if (!password) return;

    try {
      const response = await passwordService.updatePassword(password.id, {
        isFavorite: !password.isFavorite,
      });
      
      if (response.success) {
        setPassword(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        showSuccess(password.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
      } else {
        showError('Erro ao atualizar favorito');
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
    },
    headerCard: {
      marginBottom: 20,
    },
    passwordName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 8,
    },
    passwordWebsite: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 16,
    },
    favoriteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: password?.isFavorite ? '#fef3c7' : (isDark ? '#374151' : '#f3f4f6'),
      alignSelf: 'flex-start',
    },
    favoriteButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: password?.isFavorite ? '#92400e' : (isDark ? '#9ca3af' : '#6b7280'),
      marginLeft: 4,
    },
    infoCard: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9ca3af' : '#6b7280',
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
    },
    copyButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginLeft: 8,
    },
    passwordValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
      fontFamily: 'monospace',
    },
    notesCard: {
      marginBottom: 20,
    },
    notesText: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      lineHeight: 20,
    },
    customFieldsCard: {
      marginBottom: 20,
    },
    customFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    customFieldName: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9ca3af' : '#6b7280',
      flex: 1,
    },
    customFieldValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
      fontFamily: 'monospace',
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
        <Header title="Detalhes da Senha" onThemeToggle={toggleTheme} />
        <View style={styles.loadingContainer}>
          <Ionicons name="key-outline" size={48} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={styles.loadingText}>Carregando senha...</Text>
        </View>
      </View>
    );
  }

  if (!password) {
    return (
      <View style={styles.container}>
        <Header title="Detalhes da Senha" onThemeToggle={toggleTheme} />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.loadingText}>Senha não encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Detalhes da Senha" onThemeToggle={toggleTheme} />
      <ScrollView style={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Text style={styles.passwordName}>{password.name}</Text>
          {password.website && (
            <Text style={styles.passwordWebsite}>{password.website}</Text>
          )}
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons 
              name={password.isFavorite ? "heart" : "heart-outline"} 
              size={16} 
              color={password.isFavorite ? "#92400e" : (isDark ? "#9ca3af" : "#6b7280")} 
            />
            <Text style={styles.favoriteButtonText}>
              {password.isFavorite ? 'Favorita' : 'Adicionar aos favoritos'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Password Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {password.username && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuário</Text>
              <Text style={styles.infoValue}>{password.username}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(password.username!, 'Usuário')}
              >
                <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Senha</Text>
            <Text style={styles.passwordValue}>
              {showPassword ? password.password : '••••••••'}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={16} 
                color={isDark ? '#9ca3af' : '#6b7280'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => copyToClipboard(password.password, 'Senha')}
            >
              <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
          
          {password.folder && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pasta</Text>
              <Text style={styles.infoValue}>{password.folder}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TOTP</Text>
            <Text style={styles.infoValue}>
              {password.totpEnabled ? 'Habilitado' : 'Desabilitado'}
            </Text>
          </View>
        </Card>

        {/* Notes */}
        {password.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{password.notes}</Text>
          </Card>
        )}

        {/* Custom Fields */}
        {password.customFields && password.customFields.length > 0 && (
          <Card style={styles.customFieldsCard}>
            <Text style={styles.sectionTitle}>Campos Personalizados</Text>
            {password.customFields.map((field) => (
              <View key={field.id} style={styles.customFieldRow}>
                <Text style={styles.customFieldName}>{field.name}</Text>
                <Text style={styles.customFieldValue}>{field.value}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(field.value, field.name)}
                >
                  <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
