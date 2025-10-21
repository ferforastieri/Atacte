import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { familyService, Family } from '../services/family/familyService';
import { useToast } from '../hooks/useToast';

export default function FamilyScreen({ navigation }: any) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      setIsLoading(true);
      const response = await familyService.getFamilies();
      
      if (response.success && response.data) {
        setFamilies(response.data);
      } else {
        showToast(response.message || 'Erro ao carregar famílias', 'error');
      }
    } catch (error) {
      showToast('Erro ao carregar famílias', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      showToast('Digite o nome da família', 'error');
      return;
    }

    try {
      const response = await familyService.createFamily({ name: newFamilyName });
      
      if (response.success) {
        showToast('Família criada com sucesso!', 'success');
        setNewFamilyName('');
        setShowCreateModal(false);
        loadFamilies();
      } else {
        showToast(response.message || 'Erro ao criar família', 'error');
      }
    } catch (error) {
      showToast('Erro ao criar família', 'error');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      showToast('Digite o código de convite', 'error');
      return;
    }

    try {
      const response = await familyService.joinFamily({ inviteCode });
      
      if (response.success) {
        showToast('Você entrou na família!', 'success');
        setInviteCode('');
        setShowJoinModal(false);
        loadFamilies();
      } else {
        showToast(response.message || 'Erro ao entrar na família', 'error');
      }
    } catch (error) {
      showToast('Erro ao entrar na família', 'error');
    }
  };

  const handleLeaveFamily = (family: Family) => {
    Alert.alert(
      'Sair da Família',
      `Deseja realmente sair de "${family.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const response = await familyService.leaveFamily(family.id);
            
            if (response.success) {
              showToast('Você saiu da família', 'success');
              loadFamilies();
            } else {
              showToast(response.message || 'Erro ao sair da família', 'error');
            }
          },
        },
      ]
    );
  };

  const handleViewMap = (family: Family) => {
    navigation.navigate('Map', { familyId: family.id, familyName: family.name });
  };

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900">Minhas Famílias</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Gerencie e visualize suas famílias
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => {
            setIsRefreshing(true);
            loadFamilies();
          }} />
        }
      >
        {families.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-lg text-gray-500 mt-4">Nenhuma família encontrada</Text>
            <Text className="text-sm text-gray-400 mt-2 text-center px-8">
              Crie uma nova família ou entre em uma existente usando um código de convite
            </Text>
          </View>
        ) : (
          families.map((family) => (
            <View key={family.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">{family.name}</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {family.members.length} {family.members.length === 1 ? 'membro' : 'membros'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleLeaveFamily(family)}
                  className="bg-red-50 p-2 rounded-lg"
                >
                  <Ionicons name="exit-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Código de Convite</Text>
                <Text className="text-lg font-mono font-bold text-indigo-600">
                  {family.inviteCode}
                </Text>
              </View>

              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => handleViewMap(family)}
                  className="flex-1 bg-indigo-600 py-3 rounded-lg flex-row justify-center items-center"
                >
                  <Ionicons name="map-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Ver Mapa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('FamilyDetails', { familyId: family.id })}
                  className="bg-gray-100 py-3 px-4 rounded-lg"
                >
                  <Ionicons name="settings-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View className="absolute bottom-6 right-4 space-y-3">
        <TouchableOpacity
          onPress={() => setShowJoinModal(true)}
          className="bg-white p-4 rounded-full shadow-lg"
        >
          <Ionicons name="enter-outline" size={24} color="#6366f1" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-indigo-600 p-4 rounded-full shadow-lg"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Create Family Modal */}
      {showCreateModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-900 mb-4">Nova Família</Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Nome da família"
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              autoFocus
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 font-semibold text-center">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateFamily}
                className="flex-1 bg-indigo-600 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Join Family Modal */}
      {showJoinModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-xl font-bold text-gray-900 mb-4">Entrar na Família</Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Código de convite"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoFocus
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 font-semibold text-center">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleJoinFamily}
                className="flex-1 bg-indigo-600 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

