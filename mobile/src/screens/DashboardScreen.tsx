import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header } from '../components/shared';
import { PasswordModal } from '../components/passwords/PasswordModal';
import { passwordService } from '../services/passwords/passwordService';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
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

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [allPasswordsStats, setAllPasswordsStats] = useState({
    total: 0,
    favorites: 0,
    totp: 0
  });
  const [totalFromAPI, setTotalFromAPI] = useState(0);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? '#f9fafb' : '#111827',
    },
    statsCard: {
      marginBottom: 20,
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
      color: isDark ? '#f9fafb' : '#111827',
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 4,
    },
    addButton: {
      marginBottom: 20,
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
    },
    passwordWebsite: {
      fontSize: 14,
      color: '#16a34a',
      marginTop: 2,
    },
    passwordUsername: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    passwordFolder: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 4,
    },
    passwordActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
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
      color: isDark ? '#f9fafb' : '#6b7280',
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    loadingText: {
      color: isDark ? '#9ca3af' : '#6b7280',
      fontSize: 14,
    },
  });

  useEffect(() => {
    loadUser();
    loadPasswords();
  }, []);

  useEffect(() => {
    if (totalFromAPI > 0) {
      loadAllPasswordsStats();
    }
  }, [totalFromAPI]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentOffset(0);
      loadPasswords(0, false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadUser = async () => {
    const userData = await authService.getStoredUser();
    setUser(userData);
  };

  const loadPasswords = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await passwordService.getPasswords({
        query: searchQuery,
        offset: offset,
        limit: 50,
      });
      
      if (response.success && response.data) {
        if (append) {
          setPasswords(prev => {
            // Filtrar duplicatas baseado no ID
            const existingIds = new Set(prev.map(p => p.id));
            const newPasswords = response.data!.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPasswords];
          });
        } else {
          setPasswords(response.data);
        }
        
        if (response.pagination) {
          // Verificar se há mais dados baseado no total e offset atual
          const currentTotal = offset + response.data.length;
          const hasMoreData = currentTotal < response.pagination.total;
          setHasMore(hasMoreData);
          setCurrentOffset(offset + response.data.length);
          
          // Atualizar total da API para estatísticas
          if (response.pagination.total > totalFromAPI) {
            setTotalFromAPI(response.pagination.total);
          }
        } else {
          // Fallback: se não há paginação, assumir que não há mais dados
          setHasMore(false);
          setCurrentOffset(offset + response.data.length);
        }
      } else {
        if (!append) {
          setPasswords([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      if (!append) {
        setPasswords([]);
      }
      setHasMore(false);
      Alert.alert('Erro', 'Erro ao carregar senhas');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  const loadAllPasswordsStats = async () => {
    try {
      // Buscar todas as senhas para contar favoritas e TOTP
      const allResponse = await passwordService.getPasswords({ limit: 10000 });
      if (allResponse.success && allResponse.data) {
        setAllPasswordsStats({
          total: totalFromAPI || allResponse.data.length, // Usar total da API se disponível
          favorites: allResponse.data.filter(p => p.isFavorite).length,
          totp: allResponse.data.filter(p => p.totpEnabled).length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setCurrentOffset(0);
    await Promise.all([loadPasswords(0, false), loadAllPasswordsStats()]);
  }, [loadPasswords]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && passwords.length > 0) {
      loadPasswords(currentOffset, true);
    }
  }, [isLoadingMore, hasMore, currentOffset, loadPasswords, passwords.length]);

  const handlePasswordPress = (password: PasswordEntry) => {
    navigation.navigate('PasswordDetail', { passwordId: password.id });
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
      
      if (response.success && response.data) {
        setPasswords(prev => 
          prev.map(p => 
            p.id === password.id 
              ? { ...p, isFavorite: !p.isFavorite }
              : p
          )
        );
        showSuccess(response.data.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
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

  const handlePasswordSaved = () => {
    setShowPasswordModal(false);
    setEditingPassword(null);
    loadPasswords(0, false);
    loadAllPasswordsStats();
  };

  const renderPasswordItem = ({ item }: { item: PasswordEntry }) => (
    <Card style={styles.passwordCard}>
      <TouchableOpacity onPress={() => handlePasswordPress(item)}>
        <View style={styles.passwordHeader}>
          <View style={styles.passwordInfo}>
            <Text style={styles.passwordName}>{item.name}</Text>
            {item.website && (
              <Text style={styles.passwordWebsite}>{item.website}</Text>
            )}
            {item.username && (
              <Text style={styles.passwordUsername}>@{item.username}</Text>
            )}
            {item.folder && (
              <Text style={styles.passwordFolder}>📁 {item.folder}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {item.isFavorite && (
              <Ionicons name="heart" size={16} color="#dc2626" />
            )}
            {item.totpEnabled && (
              <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.passwordActions}>
        <Button
          title="Copiar"
          onPress={() => copyToClipboard(item.password)}
          size="sm"
          variant="secondary"
          style={styles.actionButton}
        />
        <Button
          title={item.isFavorite ? "Desfavoritar" : "Favoritar"}
          onPress={() => toggleFavorite(item)}
          size="sm"
          variant={item.isFavorite ? "danger" : "secondary"}
          style={styles.actionButton}
        />
        <Button
          title="Editar"
          onPress={() => handleEditPassword(item)}
          size="sm"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const renderFooter = () => {
    if (!isLoadingMore && hasMore) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Puxe para carregar mais senhas</Text>
        </View>
      );
    }
    
    if (isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Carregando mais senhas...</Text>
        </View>
      );
    }
    
    if (!hasMore && passwords.length > 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Todas as senhas foram carregadas</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmpty = () => (
    <Card style={styles.emptyCard}>
      <Ionicons name="key-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>Nenhuma senha encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tente ajustar sua busca' : 'Adicione sua primeira senha'}
      </Text>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" onThemeToggle={toggleTheme} />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Carregando senhas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Dashboard" onThemeToggle={toggleTheme} />
      
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar senhas..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allPasswordsStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allPasswordsStats.favorites}</Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allPasswordsStats.totp}</Text>
              <Text style={styles.statLabel}>TOTP</Text>
            </View>
          </View>
        </Card>

        {/* Add Password Button */}
        <Button
          title="Adicionar Nova Senha"
          onPress={handleCreatePassword}
          style={styles.addButton}
        />

        {/* Passwords List */}
        <FlatList
          data={passwords}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Password Modal */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSaved}
        password={editingPassword}
      />
    </View>
  );
}