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
    try {
      // Primeiro buscar as famílias do usuário
      const familiesResponse = await api.get('/family')
      const families = familiesResponse.data.data // Acessar o array dentro de data
      
      console.log('Famílias encontradas:', families)
      
      if (!families || families.length === 0) {
        console.log('Nenhuma família encontrada')
        return []
      }
      
      // Para cada família, buscar as localizações
      const allMembers: FamilyMember[] = []
      
      for (const family of families) {
        try {
          console.log(`Buscando localizações da família ${family.id}`)
          const locationResponse = await api.get(`/location/family/${family.id}`)
          const familyData = locationResponse.data
          
          console.log(`Dados da família ${family.id}:`, familyData)
          
          if (familyData && familyData.data && familyData.data.members) {
            // Mapear os dados para o formato esperado
            const members = familyData.data.members.map((member: any) => ({
              id: member.userId,
              name: member.userName || member.nickname || 'Membro',
              email: '', // Não temos email na resposta
              lastSeen: member.timestamp,
              batteryLevel: member.batteryLevel,
              latitude: member.latitude,
              longitude: member.longitude,
              isOnline: true // Assumir online se tem localização recente
            }))
            
            allMembers.push(...members)
            console.log(`Adicionados ${members.length} membros da família ${family.id}`)
          }
        } catch (error) {
          console.error(`Erro ao buscar localizações da família ${family.id}:`, error)
          // Continuar com outras famílias mesmo se uma falhar
        }
      }
      
      console.log('Total de membros encontrados:', allMembers.length)
      return allMembers
    } catch (error) {
      console.error('Erro ao buscar famílias:', error)
      return []
    }
  },

  // Buscar zonas do usuário
  async getZones(): Promise<GeofenceZone[]> {
    const response = await api.get('/geofence/zones')
    return response.data.data || response.data || []
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
