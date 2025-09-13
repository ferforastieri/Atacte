<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900">{{ password?.name || 'Detalhes da Senha' }}</h3>
    </template>

    <div v-if="password" class="space-y-6">
      <!-- Informações básicas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <p class="text-sm text-gray-900">{{ password.name }}</p>
        </div>
        
        <div v-if="password.website">
          <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <a :href="password.website" target="_blank" class="text-sm text-primary-600 hover:text-primary-700">
            {{ password.website }}
          </a>
        </div>
        
        <div v-if="password.username">
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <p class="text-sm text-gray-900">{{ password.username }}</p>
        </div>
        
        <div v-if="password.folder">
          <label class="block text-sm font-medium text-gray-700 mb-1">Pasta</label>
          <p class="text-sm text-gray-900">📁 {{ password.folder }}</p>
        </div>
      </div>

      <!-- Senha -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <div class="flex items-center space-x-2">
          <BaseInput
            :value="password.password"
            type="password"
            readonly
            showPasswordToggle
            class="flex-1"
          />
          <button
            @click="copyPassword"
            class="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Copiar
          </button>
        </div>
      </div>

      <!-- TOTP -->
      <div v-if="password.totpEnabled">
        <label class="block text-sm font-medium text-gray-700 mb-2">Código TOTP</label>
        <TotpCode 
          :code="totpCode?.code"
          :time-remaining="totpCode?.timeRemaining"
          :period="totpCode?.period"
          @refresh="refreshTotpCode"
        />
      </div>

      <!-- Notas -->
      <div v-if="password.notes">
        <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ password.notes }}</p>
      </div>

      <!-- Status -->
      <div class="flex items-center space-x-4">
        <div v-if="password.isFavorite" class="flex items-center text-red-500">
          <HeartIcon class="h-4 w-4 mr-1" />
          <span class="text-sm">Favorita</span>
        </div>
        <div v-if="password.totpEnabled" class="flex items-center text-blue-500">
          <KeyIcon class="h-4 w-4 mr-1" />
          <span class="text-sm">TOTP Ativo</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <BaseButton
            variant="danger"
            @click="handleDelete"
            :loading="isDeleting"
          >
            Excluir
          </BaseButton>
        </div>
        <div class="flex space-x-3">
          <BaseButton variant="ghost" @click="$emit('close')">
            Fechar
          </BaseButton>
          <BaseButton variant="primary" @click="handleEdit">
            Editar
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { HeartIcon, KeyIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton, TotpCode } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { usePasswordsStore } from '@/stores/passwords'

interface Props {
  show: boolean
  password: PasswordEntry | null
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()
const passwordsStore = usePasswordsStore()

const isDeleting = ref(false)
const totpCode = ref<{ code: string; timeRemaining: number; period: number } | null>(null)

const copyPassword = async () => {
  if (!props.password) return
  
  try {
    await navigator.clipboard.writeText(props.password.password)
    toast.success('Senha copiada!')
  } catch (error) {
    toast.error('Erro ao copiar senha')
  }
}

const handleEdit = () => {
  // TODO: Implementar edição
  toast.info('Funcionalidade de edição em desenvolvimento')
}

const handleDelete = async () => {
  if (!props.password) return
  
  if (!confirm('Tem certeza que deseja excluir esta senha?')) return
  
  isDeleting.value = true
  
  try {
    // TODO: Implementar exclusão via API
    toast.success('Senha excluída!')
    emit('deleted')
  } catch (error) {
    toast.error('Erro ao excluir senha')
  } finally {
    isDeleting.value = false
  }
}

const loadTotpCode = async () => {
  if (!props.password?.id || !props.password?.totpEnabled) return
  
  try {
    const code = await passwordsStore.getTotpCode(props.password.id)
    totpCode.value = code
  } catch (error) {
    console.error('Erro ao carregar código TOTP:', error)
  }
}

const refreshTotpCode = async () => {
  await loadTotpCode()
}

// Carregar código TOTP quando o modal abrir e a senha tiver TOTP habilitado
watch(() => props.show, async (show) => {
  if (show && props.password?.totpEnabled) {
    await loadTotpCode()
  }
})

watch(() => props.password?.id, async (id) => {
  if (id && props.password?.totpEnabled) {
    await loadTotpCode()
  }
})
</script>

