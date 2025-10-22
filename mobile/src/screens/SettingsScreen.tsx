import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/shared';
import { userService } from '../services/users/userService';
import { useToast } from '../hooks/useToast';
import axios from '../lib/axios';

const SettingsScreen: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess } = useToast();
  
  // Estados para edição de perfil
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        const profileData = response.data;
        setName(profileData.name || '');
        setPhoneNumber(profileData.phoneNumber || '');
        setProfilePicture(profileData.profilePicture || '');
      }
    } catch (error) {
      showError('Erro ao carregar dados do perfil');
      // Fallback para dados do contexto
      if (user) {
        setName(user.name || '');
        setPhoneNumber(user.phoneNumber || '');
        setProfilePicture(user.profilePicture || '');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const response = await userService.updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profilePicture: profilePicture.trim() || undefined,
      });

      if (response.success) {
        showSuccess('Perfil atualizado com sucesso!');
        setIsEditing(false);
        // Atualizar dados do usuário no contexto
        await refreshUser();
      } else {
        showError(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      showError('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setPhoneNumber('');
    setProfilePicture('');
    setIsEditing(false);
  };

  const settingsSections = [
    {
      title: 'Perfil',
      items: [
        {
          label: 'Nome',
          type: 'input',
          value: name,
          onChangeText: setName,
          placeholder: 'Digite seu nome',
        },
        {
          label: 'Telefone',
          type: 'input',
          value: phoneNumber,
          onChangeText: setPhoneNumber,
          placeholder: 'Digite seu telefone',
          keyboardType: 'phone-pad',
        },
        {
          label: 'Foto de Perfil (URL)',
          type: 'input',
          value: profilePicture,
          onChangeText: setProfilePicture,
          placeholder: 'URL da foto de perfil',
        },
        {
          label: isEditing ? 'Salvar' : 'Editar Perfil',
          type: 'button',
          onPress: isEditing ? handleSaveProfile : () => setIsEditing(true),
          isLoading: isLoading,
        },
        ...(isEditing ? [{
          label: 'Cancelar',
          type: 'button',
          onPress: handleCancelEdit,
          isDestructive: true,
        }] : []),
      ],
    },
    {
      title: 'Aparência',
      items: [
        {
          label: 'Modo Escuro',
          type: 'switch',
          value: isDark,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          label: 'Versão do App',
          type: 'text',
          value: Constants.expoConfig?.version || Constants.expoConfig?.runtimeVersion || 'N/A',
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    return (
      <View key={index} style={[styles.settingItem, isDark && styles.settingItemDark]}>
        <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
          {item.label}
        </Text>
        
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ 
              false: isDark ? '#374151' : '#d1d5db', 
              true: isDark ? '#22c55e' : '#22c55e' 
            }}
            thumbColor={item.value ? '#ffffff' : isDark ? '#6b7280' : '#ffffff'}
            ios_backgroundColor={isDark ? '#374151' : '#d1d5db'}
          />
        )}
        
        {item.type === 'text' && (
          <Text style={[styles.settingValue, isDark && styles.settingValueDark]}>
            {item.value}
          </Text>
        )}
        
        {item.type === 'input' && (
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              !isEditing && styles.inputDisabled
            ]}
            value={item.value}
            onChangeText={item.onChangeText}
            placeholder={item.placeholder}
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            keyboardType={item.keyboardType || 'default'}
            editable={isEditing}
          />
        )}
        
        {item.type === 'button' && (
          <TouchableOpacity 
            onPress={item.onPress}
            disabled={item.isLoading}
            style={[
              styles.button,
              item.isDestructive && styles.buttonDestructive,
              item.isLoading && styles.buttonDisabled
            ]}
          >
            <Text style={[
              styles.buttonText,
              isDark && styles.buttonTextDark,
              item.isDestructive && styles.buttonTextDestructive,
              item.isLoading && styles.buttonTextDisabled
            ]}>
              {item.isLoading ? 'Salvando...' : item.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header title="Configurações" showThemeToggle={false} />
      
      <ScrollView style={styles.scrollView}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {section.title}
            </Text>
            
            <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
              {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContentDark: {
    backgroundColor: '#2a2a2a',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemDark: {
    borderBottomColor: '#3a3a3a',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  settingLabelDark: {
    color: '#fff',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingValueDark: {
    color: '#999',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  inputDark: {
    color: '#fff',
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#fff',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#fff',
  },
});

export default SettingsScreen;