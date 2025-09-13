<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <Logo :size="32" text-size="text-xl" />

          <!-- User Menu -->
          <div class="flex items-center space-x-3">
            <ThemeToggle />
            
            <BaseButton
              variant="ghost"
              size="sm"
              @click="refreshPasswords"
              :loading="isRefreshing"
            >
              <ArrowPathIcon class="w-4 h-4 mr-1" />
              <span class="hidden sm:inline">Atualizar</span>
            </BaseButton>

            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserIcon class="h-5 w-5 text-primary-600" />
                </div>
                <span class="text-gray-700">{{ authStore.userEmail }}</span>
                <ChevronDownIcon class="h-4 w-4 text-gray-400" />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="fade">
                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                >
                  <router-link
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="showUserMenu = false"
                  >
                    Perfil
                  </router-link>
                  <router-link
                    to="/settings"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="showUserMenu = false"
                  >
                    Configurações
                  </router-link>
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Sair
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <BaseCard class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <LockClosedIcon class="h-8 w-8" />
            </div>
            <div class="ml-4">
              <p class="text-blue-100">Total de Senhas</p>
              <p class="text-2xl font-bold">{{ passwordsStore.totalCount }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <HeartIcon class="h-8 w-8" />
            </div>
            <div class="ml-4">
              <p class="text-green-100">Favoritas</p>
              <p class="text-2xl font-bold">{{ passwordsStore.allFavoritePasswords.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FolderIcon class="h-8 w-8" />
            </div>
            <div class="ml-4">
              <p class="text-purple-100">Pastas</p>
              <p class="text-2xl font-bold">{{ passwordsStore.folders.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <KeyIcon class="h-8 w-8" />
            </div>
            <div class="ml-4">
              <p class="text-orange-100">Com TOTP</p>
              <p class="text-2xl font-bold">{{ totpEnabledCount }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-4 mb-8">
        <BaseButton
          variant="primary"
          @click="showCreateModal = true"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Nova Senha
        </BaseButton>

        <BaseButton
          variant="secondary"
          @click="showImportModal = true"
        >
          <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
          Importar
        </BaseButton>

        <BaseButton
          variant="secondary"
          @click="exportPasswords"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          Exportar
        </BaseButton>
      </div>

      <!-- Search and Filters -->
      <BaseCard class="mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <BaseInput
              v-model="searchQuery"
              type="text"
              placeholder="Buscar senhas..."
              left-icon="MagnifyingGlassIcon"
              @input="handleSearch"
            />
          </div>
          
          <select
            v-model="selectedFolder"
            @change="handleFolderFilter"
            class="input-field w-full sm:w-48"
          >
            <option value="">Todas as pastas</option>
            <option v-for="folder in passwordsStore.folders" :key="folder" :value="folder">
              {{ folder }}
            </option>
          </select>

          <BaseButton
            variant="ghost"
            @click="toggleFavorites"
            :class="{ 'bg-primary-100 text-primary-700': showOnlyFavorites }"
          >
            <HeartIcon class="w-4 h-4 mr-1" />
            {{ showOnlyFavorites ? 'Todas' : 'Favoritas' }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Passwords List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <BaseCard
          v-for="password in filteredPasswords"
          :key="password.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewPassword(password)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900">{{ password.name }}</h3>
                <HeartIcon
                  v-if="password.isFavorite"
                  class="h-4 w-4 text-red-500"
                />
                <KeyIcon
                  v-if="password.totpEnabled"
                  class="h-4 w-4 text-blue-500"
                />
              </div>
              
              <p v-if="password.website" class="text-sm text-gray-600 mt-1">
                {{ password.website }}
              </p>
              
              <p v-if="password.username" class="text-sm text-gray-500 mt-1">
                @{{ password.username }}
              </p>
              
              <p v-if="password.folder" class="text-xs text-gray-400 mt-2">
                📁 {{ password.folder }}
              </p>
            </div>
            
            <div class="flex flex-col space-y-1">
              <button
                @click.stop="copyPassword(password)"
                class="text-gray-400 hover:text-gray-600"
                title="Copiar senha"
              >
                <ClipboardIcon class="h-4 w-4" />
              </button>
              
              <button
                @click.stop="toggleFavorite(password)"
                class="text-gray-400 hover:text-red-500"
                :class="{ 'text-red-500': password.isFavorite }"
                title="Marcar como favorita"
              >
                <HeartIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Paginação -->
      <div v-if="passwordsStore.pagination.total > passwordsStore.pagination.limit" class="mt-8">
        <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div class="text-sm text-gray-700">
            Mostrando {{ passwordsStore.pagination.offset + 1 }} a {{ Math.min(passwordsStore.pagination.offset + passwordsStore.pagination.limit, passwordsStore.pagination.total) }} de {{ passwordsStore.pagination.total }} senhas
          </div>
          <div class="flex space-x-2">
            <button
              @click="passwordsStore.fetchPasswords({ offset: passwordsStore.pagination.offset - passwordsStore.pagination.limit })"
              :disabled="passwordsStore.pagination.offset === 0"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              @click="passwordsStore.fetchPasswords({ offset: passwordsStore.pagination.offset + passwordsStore.pagination.limit })"
              :disabled="passwordsStore.pagination.offset + passwordsStore.pagination.limit >= passwordsStore.pagination.total"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPasswords.length === 0" class="text-center py-12">
        <LockClosedIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma senha encontrada</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ passwordsStore.totalCount === 0 ? 'Comece criando sua primeira senha.' : 'Tente ajustar os filtros de busca.' }}
        </p>
        <div class="mt-6">
          <BaseButton
            variant="primary"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Nova Senha
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreatePasswordModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handlePasswordCreated"
    />

    <ImportPasswordModal
      :show="showImportModal"
      @close="showImportModal = false"
    />

    <PasswordDetailModal
      :show="showDetailModal"
      :password="selectedPassword"
      @close="showDetailModal = false"
      @updated="handlePasswordUpdated"
      @deleted="handlePasswordDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  LockClosedIcon,
  UserIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  FolderIcon,
  KeyIcon,
  ClipboardIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import { BaseButton, BaseInput, BaseCard, ThemeToggle, Logo } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'

// Components
import CreatePasswordModal from '@/components/passwords/CreatePasswordModal.vue'
import ImportPasswordModal from '@/components/passwords/ImportPasswordModal.vue'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()

// Estado
const showUserMenu = ref(false)
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showDetailModal = ref(false)
const selectedPassword = ref<PasswordEntry | null>(null)
const searchQuery = ref('')
const selectedFolder = ref('')
const showOnlyFavorites = ref(false)
const isRefreshing = ref(false)

// Computed
const totpEnabledCount = computed(() => {
  return passwordsStore.allTotpEnabledPasswords.length
})

const filteredPasswords = computed(() => {
  let filtered = passwordsStore.searchResults

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.website?.toLowerCase().includes(query) ||
      p.username?.toLowerCase().includes(query)
    )
  }

  if (selectedFolder.value) {
    filtered = filtered.filter(p => p.folder === selectedFolder.value)
  }

  if (showOnlyFavorites.value) {
    filtered = filtered.filter(p => p.isFavorite)
  }

  return filtered
})

// Methods
const refreshPasswords = async () => {
  isRefreshing.value = true
  try {
    await passwordsStore.fetchPasswords()
    await passwordsStore.loadCompleteStats() // Recarregar estatísticas também
    toast.success('Senhas atualizadas!')
  } catch (error) {
    toast.error('Erro ao atualizar senhas')
  } finally {
    isRefreshing.value = false
  }
}

const handleSearch = () => {
  passwordsStore.setSearchFilters({ query: searchQuery.value })
}

const handleFolderFilter = () => {
  passwordsStore.setSearchFilters({ folder: selectedFolder.value })
}

const toggleFavorites = () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
  passwordsStore.setSearchFilters({ isFavorite: showOnlyFavorites.value })
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showDetailModal.value = true
}

const copyPassword = async (password: PasswordEntry) => {
  try {
    await navigator.clipboard.writeText(password.password)
    toast.success('Senha copiada!')
  } catch (error) {
    toast.error('Erro ao copiar senha')
  }
}

const toggleFavorite = async (password: PasswordEntry) => {
  try {
    await passwordsStore.updatePassword(password.id, {
      isFavorite: !password.isFavorite
    })
    toast.success(password.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
  } catch (error) {
    toast.error('Erro ao atualizar favorito')
  }
}

const exportPasswords = async () => {
  try {
    // Implementar exportação
    toast.success('Exportação iniciada!')
  } catch (error) {
    toast.error('Erro ao exportar senhas')
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    toast.error('Erro ao fazer logout')
  }
}

const handlePasswordCreated = () => {
  showCreateModal.value = false
  refreshPasswords()
}

const handlePasswordUpdated = () => {
  showDetailModal.value = false
  refreshPasswords()
}

const handlePasswordDeleted = () => {
  showDetailModal.value = false
  refreshPasswords()
}

// Lifecycle
onMounted(async () => {
  // Verificar se dados já foram carregados globalmente
  if (passwordsStore.passwords.length === 0 && authStore.isAuthenticated) {
    try {
      await passwordsStore.fetchPasswords()
      await passwordsStore.fetchFolders()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }
  
  // Carregar estatísticas completas
  if (!passwordsStore.statsLoaded) {
    await passwordsStore.loadCompleteStats()
  }
})

// Fechar menu ao clicar fora
const handleClickOutside = (event: Event) => {
  if (!(event.target as Element).closest('.relative')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
