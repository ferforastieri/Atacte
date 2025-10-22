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
import MapLibreGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/shared';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';

// Configurar MapLibre (gratuito, sem API Key)
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

export default function MapScreen({ route, navigation }: any) {
  const { familyId, familyName } = route.params;
  const [locations, setLocations] = useState<FamilyMemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();
  const { isDark } = useTheme();
  const { currentLocation } = useLocation();

  useEffect(() => {
    loadFamilyLocations();
    
    const interval = setInterval(loadFamilyLocations, 30000);
    return () => clearInterval(interval);
  }, [familyId]);

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

  const getMarkerColor = (member: FamilyMemberLocation) => {
    if (member.isMoving) return '#16a34a';
    if (member.batteryLevel && member.batteryLevel < 0.2) return '#dc2626';
    return '#2563eb';
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
      flex: 1,
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

  const centerCoordinate = locations.length > 0
    ? [locations[0].longitude, locations[0].latitude]
    : currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : [-46.6333, -23.5505];

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
            <MapLibreGL.MapView
              style={styles.map}
              styleURL="https://demotiles.maplibre.org/style.json"
            >
              <MapLibreGL.Camera
                zoomLevel={12}
                centerCoordinate={centerCoordinate as [number, number]}
              />
              
              {locations.map((member) => (
                <MapLibreGL.PointAnnotation
                  key={member.userId}
                  id={member.userId}
                  coordinate={[member.longitude, member.latitude]}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: getMarkerColor(member),
                      borderWidth: 3,
                      borderColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                      {(member.nickname || member.userName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                </MapLibreGL.PointAnnotation>
              ))}

              {currentLocation && (
                <MapLibreGL.PointAnnotation
                  id="user-location"
                  coordinate={[currentLocation.longitude, currentLocation.latitude]}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#3b82f6',
                      borderWidth: 3,
                      borderColor: 'white',
                    }}
                  />
                </MapLibreGL.PointAnnotation>
              )}
            </MapLibreGL.MapView>
          </View>

          <View style={styles.memberListContainer}>
            {locations.map((member) => (
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
