<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Nova Senha</h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Nome/Title -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome *
        </label>
        <BaseInput
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Ex: Gmail, Facebook, Netflix"
          required
          :error="errors.name"
        />
      </div>

      <!-- Website -->
      <div>
        <label for="website" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website
        </label>
        <BaseInput
          id="website"
          v-model="form.website"
          type="url"
          placeholder="https://exemplo.com"
          :error="errors.website"
        />
      </div>

      <!-- Username/Email -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username/Email
        </label>
        <BaseInput
          id="username"
          v-model="form.username"
          type="text"
          placeholder="usuario@exemplo.com"
          :error="errors.username"
        />
      </div>

      <!-- Senha -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Senha *
          </label>
          <button
            type="button"
            @click="generatePassword"
            class="text-sm text-primary-600 hover:text-primary-700"
          >
            Gerar senha
          </button>
        </div>
        <BaseInput
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Digite ou gere uma senha"
          required
          :error="errors.password"
        >
          <template #right-icon>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </template>
        </BaseInput>
        
        <!-- Password Strength Indicator -->
        <PasswordStrength v-if="form.password" :password="form.password" class="mt-2" />
      </div>

      <!-- Pasta -->
      <div>
        <label for="folder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pasta
        </label>
        <BaseInput
          id="folder"
          v-model="form.folder"
          type="text"
          placeholder="Ex: Trabalho, Pessoal, Bancos"
          :error="errors.folder"
        />
      </div>

      <!-- Notas -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notas
        </label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
          placeholder="Informações adicionais sobre esta senha..."
          :class="{ 'border-red-300 dark:border-red-600': errors.notes }"
        ></textarea>
        <p v-if="errors.notes" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.notes }}</p>
      </div>

      <!-- TOTP Section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-gray-100">Autenticação de Dois Fatores (TOTP)</h4>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="form.totpEnabled"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div v-if="form.totpEnabled" class="space-y-4">
          <!-- TOTP Secret -->
          <div>
            <label for="totpSecret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chave Secreta TOTP
            </label>
            <div class="flex space-x-2">
              <BaseInput
                id="totpSecret"
                v-model="form.totpSecret"
                type="text"
                placeholder="Digite a chave secreta do app autenticador"
                :error="errors.totpSecret"
                class="flex-1"
              />
              <button
                type="button"
                @click="generateTotpSecret"
                class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Gerar
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Cole a chave secreta do seu app autenticador (Google Authenticator, Authy, etc.)
            </p>
          </div>

          <!-- TOTP QR Code -->
          <div v-if="totpQrCode" class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Escaneie com seu app autenticador:</p>
            <div class="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <img :src="totpQrCode" alt="QR Code TOTP" class="w-32 h-32" />
            </div>
          </div>

          <!-- Test TOTP -->
          <div v-if="form.totpSecret" class="space-y-2">
            <label for="totpTest" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Teste o código TOTP
            </label>
            <div class="flex space-x-2">
              <BaseInput
                id="totpTest"
                v-model="totpTestCode"
                type="text"
                placeholder="Digite o código de 6 dígitos"
                maxlength="6"
                class="flex-1"
              />
              <button
                type="button"
                @click="testTotpCode"
                :disabled="!totpTestCode || totpTestCode.length !== 6"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
              >
                Testar
              </button>
            </div>
            <p v-if="totpTestResult" class="text-sm" :class="totpTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ totpTestResult.message }}
            </p>
          </div>
        </div>
      </div>

      <!-- Favorita -->
      <div class="flex items-center">
        <input
          id="isFavorite"
          v-model="form.isFavorite"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
        />
        <label for="isFavorite" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Marcar como favorita
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="ghost"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!isFormValid"
        >
          Salvar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '@/hooks/useToast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton, PasswordStrength } from '@/components/ui'
import { usePasswordsStore } from '@/stores/passwords'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()
const passwordsStore = usePasswordsStore()

// Form data
const form = ref({
  name: '',
  website: '',
  username: '',
  password: '',
  folder: '',
  notes: '',
  totpEnabled: false,
  totpSecret: '',
  isFavorite: false
})

// UI state
const showPassword = ref(false)
const isSubmitting = ref(false)
const totpQrCode = ref('')
const totpTestCode = ref('')
const totpTestResult = ref<{ success: boolean; message: string } | null>(null)

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed
const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.password.trim()
})

// Watch for TOTP secret changes to generate QR code
watch(() => form.value.totpSecret, (newSecret) => {
  if (newSecret && form.value.name) {
    generateQrCode()
  }
}, { immediate: false })

// Methods
const generatePassword = () => {
  // Gerar senha segura
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  form.value.password = password
  showPassword.value = true
}

const generateTotpSecret = () => {
  // Gerar chave secreta aleatória (base32)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.totpSecret = secret
}

const generateQrCode = async () => {
  if (!form.value.totpSecret || !form.value.name) return
  
  try {
    // Simular geração de QR code (em produção, usar biblioteca real)
    const otpAuthUrl = `otpauth://totp/${form.value.name}?secret=${form.value.totpSecret}&issuer=Atacte`
    // Em produção, usar: import QRCode from 'qrcode'
    // totpQrCode.value = await QRCode.toDataURL(otpAuthUrl)
    
    // Placeholder para demonstração
    totpQrCode.value = `data:image/svg+xml;base64,${btoa(`
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" fill="white"/>
        <text x="64" y="64" text-anchor="middle" font-family="Arial" font-size="10">
          QR Code
        </text>
        <text x="64" y="80" text-anchor="middle" font-family="Arial" font-size="8">
          ${form.value.totpSecret.substring(0, 16)}...
        </text>
      </svg>
    `)}`
  } catch (error) {
    console.error('Erro ao gerar QR code:', error)
  }
}

const testTotpCode = async () => {
  if (!form.value.totpSecret || totpTestCode.value.length !== 6) return
  
  try {
    // Simular validação TOTP (em produção, usar biblioteca real)
    // const isValid = await passwordsStore.validateTotpCode(form.value.totpSecret, totpTestCode.value)
    
    // Placeholder para demonstração
    const isValid = Math.random() > 0.5 // Simular sucesso/falha
    
    totpTestResult.value = {
      success: isValid,
      message: isValid ? 'Código válido! ✅' : 'Código inválido. Verifique o app autenticador.'
    }
  } catch (error) {
    totpTestResult.value = {
      success: false,
      message: 'Erro ao validar código'
    }
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Nome é obrigatório'
  }
  
  if (!form.value.password.trim()) {
    errors.value.password = 'Senha é obrigatória'
  }
  
  if (form.value.website && !isValidUrl(form.value.website)) {
    errors.value.website = 'URL inválida'
  }
  
  if (form.value.totpEnabled && !form.value.totpSecret.trim()) {
    errors.value.totpSecret = 'Chave secreta é obrigatória quando TOTP está habilitado'
  }
  
  return Object.keys(errors.value).length === 0
}

const isValidUrl = (string: string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('Por favor, corrija os erros no formulário')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const passwordData: any = {
      name: form.value.name.trim(),
      password: form.value.password,
      totpEnabled: form.value.totpEnabled,
      isFavorite: form.value.isFavorite
    }
    
    if (form.value.website.trim()) {
      passwordData.website = form.value.website.trim()
    }
    
    if (form.value.username.trim()) {
      passwordData.username = form.value.username.trim()
    }
    
    if (form.value.folder.trim()) {
      passwordData.folder = form.value.folder.trim()
    }
    
    if (form.value.notes.trim()) {
      passwordData.notes = form.value.notes.trim()
    }
    
    if (form.value.totpEnabled && form.value.totpSecret.trim()) {
      passwordData.totpSecret = form.value.totpSecret.trim()
    }
    
    await passwordsStore.createPassword(passwordData)
    
    toast.success('Senha criada com sucesso!')
    emit('created')
    
    // Reset form
    resetForm()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao criar senha')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    website: '',
    username: '',
    password: '',
    folder: '',
    notes: '',
    totpEnabled: false,
    totpSecret: '',
    isFavorite: false
  }
  showPassword.value = false
  totpQrCode.value = ''
  totpTestCode.value = ''
  totpTestResult.value = null
  errors.value = {}
}

// Reset form when modal closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
  }
})
</script>

