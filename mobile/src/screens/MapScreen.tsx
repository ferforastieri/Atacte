import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { FamilyMapData, FamilyMemberLocation } from '../services/location/locationService';
import { useToast } from '../hooks/useToast';

export default function MapScreen({ route, navigation }: any) {
  const { familyId, familyName } = route.params;
  const { getFamilyLocations, sendCurrentLocation, isTrackingActive, startTracking, stopTracking } = useLocation();
  const { sendSOS } = useNotification();
  const { showToast } = useToast();
  const mapRef = useRef<MapView>(null);
  
  const [familyData, setFamilyData] = useState<FamilyMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberLocation | null>(null);

  useEffect(() => {
    loadFamilyLocations();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadFamilyLocations, 30000);
    
    return () => clearInterval(interval);
  }, [familyId]);

  const loadFamilyLocations = async () => {
    try {
      const data = await getFamilyLocations(familyId);
      
      if (data) {
        setFamilyData(data);
        
        // Centralizar o mapa nos membros
        if (data.members.length > 0 && mapRef.current) {
          const coordinates = data.members.map((member) => ({
            latitude: member.latitude,
            longitude: member.longitude,
          }));
          
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      showToast('Erro ao carregar localizações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTracking = async () => {
    if (isTrackingActive) {
      await stopTracking();
      showToast('Rastreamento desativado', 'info');
    } else {
      const success = await startTracking();
      
      if (success) {
        showToast('Rastreamento ativado', 'success');
        loadFamilyLocations();
      } else {
        showToast('Erro ao ativar rastreamento', 'error');
      }
    }
  };

  const handleRefresh = async () => {
    await sendCurrentLocation();
    await loadFamilyLocations();
    showToast('Localização atualizada', 'success');
  };

  const handleSOS = () => {
    Alert.alert(
      '🆘 Enviar Alerta de Emergência',
      'Sua família será notificada imediatamente sobre sua localização atual. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar SOS',
          style: 'destructive',
          onPress: async () => {
            if (familyData && familyData.members.length > 0) {
              const myLocation = familyData.members[0];
              const success = await sendSOS(myLocation.latitude, myLocation.longitude);
              
              if (success) {
                showToast('SOS enviado para sua família!', 'success');
              } else {
                showToast('Erro ao enviar SOS', 'error');
              }
            }
          },
        },
      ]
    );
  };

  const getMarkerColor = (userId: string) => {
    // Usar cores diferentes para cada membro
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const index = familyData?.members.findIndex((m) => m.userId === userId) || 0;
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="bg-white px-4 py-4 shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-gray-900">{familyName}</Text>
            <Text className="text-xs text-gray-500">
              {familyData?.members.length || 0} membros
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-indigo-50 p-2 rounded-lg"
        >
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: familyData?.members[0]?.latitude || -23.5505,
          longitude: familyData?.members[0]?.longitude || -46.6333,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {familyData?.members.map((member) => (
          <Marker
            key={member.userId}
            coordinate={{
              latitude: member.latitude,
              longitude: member.longitude,
            }}
            title={member.nickname || member.userName}
            description={member.address || 'Localização atual'}
            onPress={() => setSelectedMember(member)}
            pinColor={getMarkerColor(member.userId)}
          />
        ))}
      </MapView>

      {/* Member Info Card */}
      {selectedMember && (
        <View className="absolute bottom-24 left-4 right-4 bg-white rounded-lg p-4 shadow-lg">
          <TouchableOpacity
            onPress={() => setSelectedMember(null)}
            className="absolute top-2 right-2 p-1"
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          <View className="flex-row items-center mb-3">
            <View className="bg-indigo-100 p-3 rounded-full mr-3">
              <Ionicons name="person" size={24} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {selectedMember.nickname || selectedMember.userName}
              </Text>
              <Text className="text-sm text-gray-500">
                {selectedMember.isMoving ? '🚶 Em movimento' : '📍 Parado'}
              </Text>
            </View>
          </View>

          {selectedMember.address && (
            <View className="flex-row items-start mb-2">
              <Ionicons name="location-outline" size={16} color="#6b7280" className="mt-1" />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                {selectedMember.address}
              </Text>
            </View>
          )}

          {selectedMember.batteryLevel !== null && (
            <View className="flex-row items-center">
              <Ionicons
                name={selectedMember.batteryLevel > 0.5 ? 'battery-full' : 'battery-half'}
                size={16}
                color={selectedMember.batteryLevel > 0.2 ? '#10b981' : '#ef4444'}
              />
              <Text className="text-sm text-gray-600 ml-2">
                Bateria: {Math.round((selectedMember.batteryLevel || 0) * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View className="absolute bottom-6 right-4 space-y-3">
        <TouchableOpacity
          onPress={handleSOS}
          className="bg-red-600 p-4 rounded-full shadow-lg"
        >
          <Ionicons name="alert-circle" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleTracking}
          className={`${
            isTrackingActive ? 'bg-green-600' : 'bg-gray-400'
          } p-4 rounded-full shadow-lg`}
        >
          <Ionicons name="navigate" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (mapRef.current && familyData) {
              const coordinates = familyData.members.map((member) => ({
                latitude: member.latitude,
                longitude: member.longitude,
              }));
              
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
          className="bg-white p-4 rounded-full shadow-lg"
        >
          <Ionicons name="contract-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

