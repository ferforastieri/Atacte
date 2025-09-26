import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, PasswordGeneratorModal } from '../components/shared';
import { Modal } from '../components/shared/Modal';
import { Input } from '../components/shared/Input';
import { Switch } from 'react-native';
import { TotpCard } from '../components/totp/TotpCard';
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
  const [showPasswordGeneratorModal, setShowPasswordGeneratorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [deletingPassword, setDeletingPassword] = useState<PasswordEntry | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    username: '',
    password: '',
    folder: '',
    notes: '',
    isFavorite: false,
    totpEnabled: false,
    totpSecret: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    form: {
      gap: 16,
    },
    passwordSection: {
      gap: 8,
    },
    passwordHeaderForm: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    generateButton: {
      backgroundColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    generateButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    totpSection: {
      gap: 12,
    },
    totpHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totpSecretSection: {
      gap: 8,
    },
    totpSecretHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    helpText: {
      fontSize: 12,
      lineHeight: 16,
    },
    favoriteSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actions: {
      marginTop: 8,
    },
    saveActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 1,
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
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    copyButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    favoriteButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    editButton: {
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

  const copyToClipboard = async (text: string, label: string = 'Texto') => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(`${label} copiado para a área de transferência`);
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
    setFormData({
      name: '',
      website: '',
      username: '',
      password: '',
      folder: '',
      notes: '',
      isFavorite: false,
      totpEnabled: false,
      totpSecret: '',
    });
    setShowPasswordModal(true);
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      name: password.name,
      website: password.website || '',
      username: password.username || '',
      password: password.password,
      folder: password.folder || '',
      notes: '',
      isFavorite: password.isFavorite,
      totpEnabled: password.totpEnabled,
      totpSecret: '',
    });
    setShowPasswordModal(true);
  };

  const handlePasswordGenerated = (generatedPassword: string) => {
    setFormData({ ...formData, password: generatedPassword });
    setShowPasswordGeneratorModal(false);
  };

  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, totpSecret: secret });
  };

  const handleSavePassword = async () => {
    if (!formData.name || !formData.password) {
      showError('Nome e senha são obrigatórios');
      return;
    }

    if (formData.totpEnabled && !formData.totpSecret) {
      showError('Chave secreta TOTP é obrigatória quando TOTP está habilitado');
      return;
    }

    setIsSaving(true);
    try {
      let response;
      
      // Preparar dados para envio (igual ao web)
      const passwordData: any = {
        name: formData.name.trim(),
        password: formData.password,
        totpEnabled: formData.totpEnabled,
        isFavorite: formData.isFavorite
      };
      
      if (formData.website.trim()) {
        passwordData.website = formData.website.trim();
      }
      
      if (formData.username.trim()) {
        passwordData.username = formData.username.trim();
      }
      
      if (formData.folder.trim()) {
        passwordData.folder = formData.folder.trim();
      }
      
      if (formData.notes.trim()) {
        passwordData.notes = formData.notes.trim();
      }
      
      if (formData.totpEnabled && formData.totpSecret.trim()) {
        passwordData.totpSecret = formData.totpSecret.trim();
      }
      
      if (editingPassword) {
        response = await passwordService.updatePassword(editingPassword.id, passwordData);
      } else {
        response = await passwordService.createPassword(passwordData);
      }

      if (response.success) {
        showSuccess(editingPassword ? 'Senha atualizada!' : 'Senha criada!');
        handlePasswordSaved();
      } else {
        showError(response.message || 'Erro ao salvar senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSaved = () => {
    setShowPasswordModal(false);
    setEditingPassword(null);
    loadPasswords(0, false);
    loadAllPasswordsStats();
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
        loadPasswords(0, false);
        loadAllPasswordsStats();
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

  const renderPasswordItem = ({ item }: { item: PasswordEntry }) => (
    <TotpCard
      password={item}
      onPress={() => handlePasswordPress(item)}
      onEdit={() => handleEditPassword(item)}
      onDelete={() => handleDeletePassword(item)}
      onToggleFavorite={() => toggleFavorite(item)}
      onCopyPassword={() => copyToClipboard(item.password, 'Senha')}
      onCopyUsername={() => copyToClipboard(item.username!, 'Usuário')}
    />
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
          variant="primary"
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

      {/* Password Form Modal */}
      <Modal
        visible={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setEditingPassword(null);
        }}
        title={editingPassword ? 'Editar Senha' : 'Nova Senha'}
        size="lg"
      >
        <View style={styles.form}>
          <Input
            label="Nome *"
            placeholder="Nome da senha"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Website"
            placeholder="https://exemplo.com"
            value={formData.website}
            onChangeText={(text) => setFormData({ ...formData, website: text })}
            keyboardType="url"
          />

          <Input
            label="Username"
            placeholder="Nome de usuário"
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
          />

          <View style={styles.passwordSection}>
            <View style={styles.passwordHeaderForm}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Senha *
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordGeneratorModal(true)} style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Gerar</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Digite ou gere uma senha"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          <Input
            label="Pasta"
            placeholder="Pasta (opcional)"
            value={formData.folder}
            onChangeText={(text) => setFormData({ ...formData, folder: text })}
          />

          <Input
            label="Notas"
            placeholder="Notas adicionais"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
          />

          {/* TOTP Section */}
          <View style={styles.totpSection}>
            <View style={styles.totpHeader}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Autenticação de Dois Fatores (TOTP)
              </Text>
              <Switch
                value={formData.totpEnabled}
                onValueChange={(value) => setFormData({ ...formData, totpEnabled: value })}
                trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
                thumbColor={formData.totpEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {formData.totpEnabled && (
              <View style={styles.totpSecretSection}>
                <View style={styles.totpSecretHeader}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
                    Chave Secreta TOTP
                  </Text>
                  <TouchableOpacity onPress={generateTotpSecret} style={styles.generateButton}>
                    <Text style={styles.generateButtonText}>Gerar</Text>
                  </TouchableOpacity>
                </View>
                <Input
                  placeholder="Digite a chave secreta do app autenticador"
                  value={formData.totpSecret}
                  onChangeText={(text) => setFormData({ ...formData, totpSecret: text })}
                  secureTextEntry={!showTotpSecret}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowTotpSecret(!showTotpSecret)}>
                      <Ionicons
                        name={showTotpSecret ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={isDark ? '#9ca3af' : '#6b7280'}
                      />
                    </TouchableOpacity>
                  }
                />
                <Text style={[styles.helpText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Cole a chave secreta do seu app autenticador (Google Authenticator, Authy, etc.)
                </Text>
              </View>
            )}
          </View>

          {/* Favorite Section */}
          <View style={styles.favoriteSection}>
            <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Marcar como favorita
            </Text>
            <Switch
              value={formData.isFavorite}
              onValueChange={(value) => setFormData({ ...formData, isFavorite: value })}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={formData.isFavorite ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.actions}>
            <View style={styles.saveActions}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowPasswordModal(false);
                  setEditingPassword(null);
                }}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title={editingPassword ? 'Atualizar' : 'Criar'}
                onPress={handleSavePassword}
                loading={isSaving}
                variant="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Generator Modal */}
      <PasswordGeneratorModal
        visible={showPasswordGeneratorModal}
        onClose={() => setShowPasswordGeneratorModal(false)}
        onPasswordGenerated={handlePasswordGenerated}
        initialPassword={formData.password}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingPassword(null);
        }}
        title="Excluir Senha"
        type="confirm"
        message="Tem certeza que deseja excluir esta senha?"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeletePassword}
      />
    </View>
  );
}