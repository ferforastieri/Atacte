<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Localização da Família</h1>
            <p class="text-sm text-gray-600">Visualize a localização dos membros e gerencie zonas</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="refreshLocations"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
            <button
              @click="showCreateZoneModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Zona
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Map Container -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b">
              <h2 class="text-lg font-semibold text-gray-900">Mapa</h2>
            </div>
            <div class="relative">
              <!-- Map placeholder - você pode integrar com Leaflet ou Google Maps -->
              <div id="map" class="h-96 bg-gray-100 rounded-b-lg flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p class="text-gray-500">Mapa será carregado aqui</p>
                  <p class="text-sm text-gray-400">Integre com Leaflet ou Google Maps</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Family Members -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b">
              <h3 class="text-lg font-semibold text-gray-900">Membros da Família</h3>
            </div>
            <div class="p-4">
              <div v-if="isLoading" class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p class="text-sm text-gray-500 mt-2">Carregando...</p>
              </div>
              <div v-else-if="familyMembers.length === 0" class="text-center py-4">
                <p class="text-gray-500">Nenhum membro encontrado</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="member in familyMembers"
                  :key="member.id"
                  class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-green-800">
                        {{ member.name?.charAt(0) || '?' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ member.name || 'Membro' }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ member.lastSeen ? formatTime(member.lastSeen) : 'Nunca visto' }}
                    </p>
                  </div>
                  <div v-if="member.batteryLevel !== null" class="flex items-center space-x-1">
                    <svg class="w-4 h-4" :class="member.batteryLevel < 0.2 ? 'text-red-500' : 'text-green-500'" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-xs text-gray-500">{{ Math.round(member.batteryLevel * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Geofence Zones -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b">
              <h3 class="text-lg font-semibold text-gray-900">Zonas</h3>
            </div>
            <div class="p-4">
              <div v-if="zonesLoading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              </div>
              <div v-else-if="zones.length === 0" class="text-center py-4">
                <p class="text-gray-500 text-sm">Nenhuma zona criada</p>
                <button
                  @click="showCreateZoneModal = true"
                  class="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Criar primeira zona
                </button>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="zone in zones"
                  :key="zone.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ zone.name }}</p>
                    <p class="text-xs text-gray-500">{{ zone.radius }}m de raio</p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      :class="zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ zone.isActive ? 'Ativa' : 'Inativa' }}
                    </span>
                    <button
                      @click="deleteZone(zone.id)"
                      class="text-red-600 hover:text-red-700 text-sm"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Zone Modal -->
    <div v-if="showCreateZoneModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Criar Nova Zona</h3>
            <button
              @click="showCreateZoneModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="createZone" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nome da Zona</label>
              <input
                v-model="newZone.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Ex: Casa, Trabalho, Escola"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
              <textarea
                v-model="newZone.description"
                rows="2"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Descrição da zona..."
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  v-model.number="newZone.latitude"
                  type="number"
                  step="any"
                  required
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  v-model.number="newZone.longitude"
                  type="number"
                  step="any"
                  required
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="-46.6333"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Raio (metros)</label>
              <select
                v-model.number="newZone.radius"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="50">50m</option>
                <option value="100">100m</option>
                <option value="200">200m</option>
                <option value="500">500m</option>
                <option value="1000">1km</option>
                <option value="2000">2km</option>
                <option value="5000">5km</option>
                <option value="10000">10km</option>
              </select>
            </div>
            
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input
                  v-model="newZone.notifyOnEnter"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Notificar entrada</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="newZone.notifyOnExit"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Notificar saída</span>
              </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="showCreateZoneModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isCreatingZone"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {{ isCreatingZone ? 'Criando...' : 'Criar Zona' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { locationApi, type FamilyMember, type GeofenceZone, type CreateZoneData } from '@/api/location'

// Types
interface NewZone {
  name: string
  description: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

// Reactive data
const isLoading = ref(false)
const zonesLoading = ref(false)
const isCreatingZone = ref(false)
const showCreateZoneModal = ref(false)
const familyMembers = ref<FamilyMember[]>([])
const zones = ref<GeofenceZone[]>([])

const newZone = ref<NewZone>({
  name: '',
  description: '',
  latitude: -23.5505,
  longitude: -46.6333,
  radius: 100,
  notifyOnEnter: true,
  notifyOnExit: true
})

const toast = useToast()

// Methods
const refreshLocations = async () => {
  isLoading.value = true
  try {
    familyMembers.value = await locationApi.getFamilyLocations()
  } catch (error) {
    toast.error('Erro ao carregar localizações')
    console.error('Erro ao carregar localizações:', error)
  } finally {
    isLoading.value = false
  }
}

const loadZones = async () => {
  zonesLoading.value = true
  try {
    zones.value = await locationApi.getZones()
  } catch (error) {
    toast.error('Erro ao carregar zonas')
    console.error('Erro ao carregar zonas:', error)
  } finally {
    zonesLoading.value = false
  }
}

const createZone = async () => {
  isCreatingZone.value = true
  try {
    await locationApi.createZone(newZone.value)
    
    toast.success('Zona criada com sucesso!')
    showCreateZoneModal.value = false
    
    // Reset form
    newZone.value = {
      name: '',
      description: '',
      latitude: -23.5505,
      longitude: -46.6333,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: true
    }
    
    // Reload zones
    await loadZones()
  } catch (error) {
    toast.error('Erro ao criar zona')
    console.error('Erro ao criar zona:', error)
  } finally {
    isCreatingZone.value = false
  }
}

const deleteZone = async (zoneId: string) => {
  if (!confirm('Tem certeza que deseja deletar esta zona?')) return
  
  try {
    await locationApi.deleteZone(zoneId)
    
    toast.success('Zona deletada com sucesso!')
    await loadZones()
  } catch (error) {
    toast.error('Erro ao deletar zona')
    console.error('Erro ao deletar zona:', error)
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'Agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return `${Math.floor(diff / 86400000)}d atrás`
}

// Lifecycle
onMounted(() => {
  refreshLocations()
  loadZones()
})
</script>
