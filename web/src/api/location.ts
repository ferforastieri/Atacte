import api from './index'

export interface LocationData {
  id: string
  userId: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  address?: string
  timestamp: string
  batteryLevel?: number
  isMoving: boolean
}

export interface FamilyMember {
  id: string
  name: string
  email: string
  lastSeen: string | null
  batteryLevel: number | null
  latitude?: number
  longitude?: number
  isOnline: boolean
}

export interface GeofenceZone {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  notifyOnEnter: boolean
  notifyOnExit: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateZoneData {
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

export const locationApi = {
  // Buscar localizações da família
  async getFamilyLocations(): Promise<FamilyMember[]> {
    const response = await api.get('/location/family')
    return response.data
  },

  // Buscar zonas do usuário
  async getZones(): Promise<GeofenceZone[]> {
    const response = await api.get('/geofence/zones')
    return response.data
  },

  // Criar nova zona
  async createZone(data: CreateZoneData): Promise<GeofenceZone> {
    const response = await api.post('/geofence/zones', data)
    return response.data
  },

  // Atualizar zona
  async updateZone(id: string, data: Partial<CreateZoneData>): Promise<GeofenceZone> {
    const response = await api.patch(`/geofence/zones/${id}`, data)
    return response.data
  },

  // Deletar zona
  async deleteZone(id: string): Promise<void> {
    await api.delete(`/geofence/zones/${id}`)
  },

  // Ativar/desativar zona
  async toggleZone(id: string, isActive: boolean): Promise<GeofenceZone> {
    const response = await api.patch(`/geofence/zones/${id}`, { isActive })
    return response.data
  }
}
