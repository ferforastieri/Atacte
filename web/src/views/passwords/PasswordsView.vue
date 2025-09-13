<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <router-link to="/dashboard" class="flex items-center">
              <ArrowLeftIcon class="h-5 w-5 text-gray-400 mr-2" />
              <span class="text-lg font-semibold text-gray-900">Todas as Senhas</span>
            </router-link>
          </div>
          
          <BaseButton
            variant="primary"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Nova Senha
          </BaseButton>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <BaseCard class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BaseInput
            v-model="filters.query"
            type="text"
            placeholder="Buscar senhas..."
            left-icon="MagnifyingGlassIcon"
          />
          
          <select
            v-model="filters.folder"
            class="input-field"
          >
            <option value="">Todas as pastas</option>
            <option v-for="folder in passwordsStore.folders" :key="folder" :value="folder">
              {{ folder }}
            </option>
          </select>

          <select
            v-model="filters.sortBy"
            class="input-field"
          >
            <option value="name">Nome</option>
            <option value="createdAt">Data de criação</option>
            <option value="updatedAt">Última atualização</option>
            <option value="lastUsed">Último uso</option>
          </select>

          <select
            v-model="filters.sortOrder"
            class="input-field"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
      </BaseCard>

      <!-- Passwords Table -->
      <BaseCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasta
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="password in filteredPasswords"
                :key="password.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="viewPassword(password)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-primary-600">
                          {{ password.name.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">{{ password.name }}</div>
                        <HeartIcon
                          v-if="password.isFavorite"
                          class="ml-2 h-4 w-4 text-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ password.website || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ password.username || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ password.folder || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span
                      v-if="password.totpEnabled"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <KeyIcon class="w-3 h-3 mr-1" />
                      TOTP
                    </span>
                    <span
                      v-if="password.isFavorite"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      <HeartIcon class="w-3 h-3 mr-1" />
                      Favorita
                    </span>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click.stop="copyPassword(password)"
                      class="text-gray-400 hover:text-gray-600"
                      title="Copiar senha"
                    >
                      <ClipboardIcon class="h-4 w-4" />
                    </button>
                    
                    <button
                      @click.stop="editPassword(password)"
                      class="text-gray-400 hover:text-gray-600"
                      title="Editar"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    
                    <button
                      @click.stop="deletePassword(password)"
                      class="text-gray-400 hover:text-red-600"
                      title="Deletar"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPasswords.length === 0" class="text-center py-12">
          <LockClosedIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma senha encontrada</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ passwordsStore.totalCount === 0 ? 'Comece criando sua primeira senha.' : 'Tente ajustar os filtros de busca.' }}
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Modals -->
    <CreatePasswordModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handlePasswordCreated"
    />

    <EditPasswordModal
      :show="showEditModal"
      :password="selectedPassword"
      @close="showEditModal = false"
      @updated="handlePasswordUpdated"
    />

    <DeletePasswordModal
      :show="showDeleteModal"
      :password="selectedPassword"
      @close="showDeleteModal = false"
      @deleted="handlePasswordDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  KeyIcon,
  ClipboardIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import { usePasswordsStore } from '@/stores/passwords'
import { BaseButton, BaseInput, BaseCard } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'

// Components (serão criados depois)
// import CreatePasswordModal from '@/components/passwords/CreatePasswordModal.vue'
// import EditPasswordModal from '@/components/passwords/EditPasswordModal.vue'
// import DeletePasswordModal from '@/components/passwords/DeletePasswordModal.vue'

const router = useRouter()
const toast = useToast()
const passwordsStore = usePasswordsStore()

// Estado
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedPassword = ref<PasswordEntry | null>(null)

const filters = ref({
  query: '',
  folder: '',
  sortBy: 'name' as const,
  sortOrder: 'asc' as const
})

// Computed
const filteredPasswords = computed(() => {
  return passwordsStore.searchResults
})

// Watchers
watch(filters, (newFilters) => {
  passwordsStore.setSearchFilters(newFilters)
}, { deep: true })

// Methods
const viewPassword = (password: PasswordEntry) => {
  router.push(`/passwords/${password.id}`)
}

const copyPassword = async (password: PasswordEntry) => {
  try {
    await navigator.clipboard.writeText(password.password)
    toast.success('Senha copiada!')
  } catch (error) {
    toast.error('Erro ao copiar senha')
  }
}

const editPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showEditModal.value = true
}

const deletePassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showDeleteModal.value = true
}

const handlePasswordCreated = () => {
  showCreateModal.value = false
  passwordsStore.fetchPasswords()
}

const handlePasswordUpdated = () => {
  showEditModal.value = false
  passwordsStore.fetchPasswords()
}

const handlePasswordDeleted = () => {
  showDeleteModal.value = false
  passwordsStore.fetchPasswords()
}

// Lifecycle
onMounted(async () => {
  await passwordsStore.fetchPasswords()
  await passwordsStore.fetchFolders()
})
</script>