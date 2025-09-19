import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../components/shared';
import { PasswordModal } from '../components/passwords/PasswordModal';
import { passwordService } from '../services/passwords/passwordService';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';
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
}

interface DashboardScreenProps {
  onLogout: () => void;
}

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadUser();
    loadPasswords();
  }, []);

  const loadUser = async () => {
    const userData = await authService.getStoredUser();
    setUser(userData);
  };

  const loadPasswords = async () => {
    try {
      const response = await passwordService.getPasswords({
        query: searchQuery,
        limit: 50,
      });
      
      if (response.success && response.data) {
        setPasswords(response.data.passwords);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar senhas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPasswords();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    loadPasswords();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: onLogout },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess('Texto copiado para a área de transferência');
    } catch (error) {
      showError('Erro ao copiar texto');
    }
  };

  const toggleFavorite = async (password: PasswordEntry) => {
    try {
      const response = await passwordService.updatePassword(password.id, {
        isFavorite: !password.isFavorite,
      });
      
      if (response.success) {
        setPasswords(prev => 
          prev.map(p => 
            p.id === password.id 
              ? { ...p, isFavorite: !p.isFavorite }
              : p
          )
        );
        showSuccess(password.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
      } else {
        showError('Erro ao atualizar favorito');
      }
    } catch (error) {
      showError('Erro ao atualizar favorito');
    }
  };

  const handleCreatePassword = () => {
    setEditingPassword(null);
    setShowPasswordModal(true);
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setShowPasswordModal(true);
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setEditingPassword(null);
  };

  const handlePasswordSuccess = () => {
    loadPasswords();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando senhas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}!</Text>
          <Text style={styles.subtitle}>Suas senhas seguras</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{passwords.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {passwords.filter(p => p.isFavorite).length}
              </Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {passwords.filter(p => p.totpEnabled).length}
              </Text>
              <Text style={styles.statLabel}>TOTP</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionsHeader}>
          <Button
            title="Nova Senha"
            onPress={handleCreatePassword}
            style={styles.createButton}
          />
        </View>

        <View style={styles.passwordsList}>
          {passwords.map((password) => (
            <Card key={password.id} style={styles.passwordCard}>
              <View style={styles.passwordHeader}>
                <View style={styles.passwordInfo}>
                  <Text style={styles.passwordName}>{password.name}</Text>
                  {password.website && (
                    <Text style={styles.passwordWebsite}>{password.website}</Text>
                  )}
                  {password.username && (
                    <Text style={styles.passwordUsername}>{password.username}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavorite(password)}
                  style={styles.favoriteButton}
                >
                  <Ionicons
                    name={password.isFavorite ? 'heart' : 'heart-outline'}
                    size={20}
                    color={password.isFavorite ? '#dc2626' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.passwordActions}>
                <Button
                  title="Copiar"
                  onPress={() => copyToClipboard(password.password)}
                  size="sm"
                  style={styles.actionButton}
                />
                <Button
                  title="Editar"
                  onPress={() => handleEditPassword(password)}
                  size="sm"
                  variant="secondary"
                  style={styles.actionButton}
                />
                {password.totpEnabled && (
                  <Button
                    title="TOTP"
                    onPress={() => {}}
                    size="sm"
                    variant="ghost"
                    style={styles.actionButton}
                  />
                )}
              </View>
            </Card>
          ))}
        </View>

        {passwords.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="lock-closed-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Nenhuma senha encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Adicione sua primeira senha para começar
            </Text>
          </Card>
        )}
      </ScrollView>

      <PasswordModal
        visible={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSuccess={handlePasswordSuccess}
        password={editingPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    marginBottom: 20,
  },
  actionsHeader: {
    marginBottom: 20,
  },
  createButton: {
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
    color: '#111827',
  },
  passwordWebsite: {
    fontSize: 14,
    color: '#16a34a',
    marginTop: 2,
  },
  passwordUsername: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
