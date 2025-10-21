import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components/shared';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function MapScreen({ route, navigation }: any) {
  const { familyId, familyName } = route.params;
  const [locations, setLocations] = useState<FamilyMemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberLocation | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const { showError } = useToast();
  const { isDark } = useTheme();
  const { currentLocation } = useLocation();

  useEffect(() => {
    loadFamilyLocations();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadFamilyLocations, 30000);
    return () => clearInterval(interval);
  }, [familyId]);

  useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      // Centralizar no primeiro membro
      const firstLocation = locations[0];
      setMapRegion({
        latitude: firstLocation.latitude,
        longitude: firstLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } else if (currentLocation) {
      // Se não houver membros, centralizar na localização atual
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [locations, currentLocation]);

  const loadFamilyLocations = async () => {
    try {
      const response = await locationService.getFamilyLocations(familyId);
      
      if (response.success && response.data) {
        const familyData = response.data;
        const locationsData = Array.isArray(familyData.members) 
          ? familyData.members 
          : [];
        
        setLocations(locationsData);
      } else {
        setLocations([]);
        showError(response.message || 'Erro ao carregar localizações');
      }
    } catch (error) {
      setLocations([]);
      showError('Erro ao carregar localizações');
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnMember = (member: FamilyMemberLocation) => {
    setMapRegion({
      latitude: member.latitude,
      longitude: member.longitude,
      latitudeDelta: LATITUDE_DELTA / 2,
      longitudeDelta: LONGITUDE_DELTA / 2,
    });
    setSelectedMember(member);
  };

  const getMarkerColor = (member: FamilyMemberLocation) => {
    if (member.isMoving) return '#16a34a'; // Verde se em movimento
    if (member.batteryLevel && member.batteryLevel < 0.2) return '#dc2626'; // Vermelho se bateria baixa
    return '#2563eb'; // Azul padrão
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    header: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      minHeight: 60,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#6b7280' : '#9ca3af',
      textAlign: 'center',
    },
    memberListContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
    },
    memberCard: {
      marginBottom: 8,
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#16a34a',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 2,
    },
    memberStatus: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    centerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    memberDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    detailIcon: {
      marginRight: 4,
    },
    detailText: {
      fontSize: 12,
      color: isDark ? '#d1d5db' : '#374151',
    },
    myLocationButton: {
      position: 'absolute',
      right: 16,
      bottom: locations.length > 0 ? 180 : 32,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header} edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{familyName}</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{familyName}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadFamilyLocations}>
            <Ionicons name="refresh" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="location-outline" 
            size={64} 
            color={isDark ? '#4b5563' : '#d1d5db'} 
            style={styles.emptyIcon} 
          />
          <Text style={styles.emptyTitle}>Nenhuma localização disponível</Text>
          <Text style={styles.emptyText}>
            Os membros da família ainda não compartilharam suas localizações
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {Array.isArray(locations) && locations.map((member) => (
                <Marker
                  key={member.userId}
                  coordinate={{
                    latitude: member.latitude,
                    longitude: member.longitude,
                  }}
                  title={member.userName || member.nickname || undefined}
                  description={formatLastUpdate(member.timestamp)}
                  pinColor={getMarkerColor(member)}
                  onPress={() => setSelectedMember(member)}
                />
              ))}
            </MapView>

            {currentLocation && (
              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={() => {
                  setMapRegion({
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: LATITUDE_DELTA / 2,
                    longitudeDelta: LONGITUDE_DELTA / 2,
                  });
                }}
              >
                <Ionicons name="locate" size={24} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.memberListContainer}>
            {Array.isArray(locations) && locations.map((member) => (
              <Card key={member.userId} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <View style={[styles.memberAvatar, { backgroundColor: getMarkerColor(member) }]}>
                    <Text style={styles.memberAvatarText}>
                      {(member.nickname || member.userName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.nickname || member.userName}
                    </Text>
                    <Text style={styles.memberStatus}>
                      {formatLastUpdate(member.timestamp)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => centerOnMember(member)}
                  >
                    <Ionicons name="navigate" size={20} color="#16a34a" />
                  </TouchableOpacity>
                </View>

                <View style={styles.memberDetails}>
                  {member.batteryLevel !== null && member.batteryLevel !== undefined && (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="battery-charging"
                        size={14}
                        color={member.batteryLevel < 0.2 ? '#dc2626' : '#16a34a'}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>
                        {Math.round(member.batteryLevel * 100)}%
                      </Text>
                    </View>
                  )}
                  
                  {member.isMoving && (
                    <View style={styles.detailItem}>
                      <Ionicons name="walk" size={14} color="#16a34a" style={styles.detailIcon} />
                      <Text style={styles.detailText}>Em movimento</Text>
                    </View>
                  )}
                  
                  {member.accuracy && (
                    <View style={styles.detailItem}>
                      <Ionicons name="radio-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} style={styles.detailIcon} />
                      <Text style={styles.detailText}>±{Math.round(member.accuracy)}m</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
