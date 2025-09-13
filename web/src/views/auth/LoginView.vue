<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <Logo :size="48" text-size="text-2xl" class="justify-center mb-4" />
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Entre na sua conta
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Ou
          <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">
            crie uma nova conta
          </router-link>
        </p>
      </div>

      <!-- Form -->
      <BaseCard>
        <form @submit.prevent="handleLogin" class="space-y-6">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="seu@email.com"
            required
            :error="errors.email"
            left-icon="EnvelopeIcon"
          />

          <BaseInput
            v-model="form.masterPassword"
            type="password"
            label="Senha Master"
            placeholder="Digite sua senha master"
            required
            :error="errors.masterPassword"
            left-icon="LockClosedIcon"
            show-password-toggle
          />

          <BaseInput
            v-model="form.deviceName"
            type="text"
            label="Nome do Dispositivo (opcional)"
            placeholder="Ex: Meu Computador"
            left-icon="ComputerDesktopIcon"
          />

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            class="w-full"
          >
            Entrar
          </BaseButton>
        </form>
      </BaseCard>

      <!-- Demo Info -->
      <BaseCard variant="outlined" class="bg-blue-50 border-blue-200">
        <div class="text-center">
          <h3 class="text-sm font-medium text-blue-800">Demonstração</h3>
          <p class="mt-1 text-sm text-blue-600">
            Use estas credenciais para testar:
          </p>
          <div class="mt-2 text-xs text-blue-500 font-mono">
            Email: admin@atacte.com<br>
            Senha: MasterPassword123!
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { LockClosedIcon, EnvelopeIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { BaseButton, BaseInput, BaseCard, Logo } from '@/components/ui'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive({
  email: '',
  masterPassword: '',
  deviceName: ''
})

const handleLogin = async () => {
  errors.value = {}
  isLoading.value = true

  try {
    await authStore.login({
      email: form.email,
      masterPassword: form.masterPassword,
      deviceName: form.deviceName || 'Dispositivo Web'
    })

    toast.success('Login realizado com sucesso!')
    router.push('/dashboard')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors.reduce((acc: any, err: any) => {
        acc[err.field] = err.message
        return acc
      }, {})
    } else {
      toast.error(error.message || 'Erro ao fazer login')
    }
  } finally {
    isLoading.value = false
  }
}

// Preencher dados de demo
const fillDemoData = () => {
  form.email = 'admin@atacte.com'
  form.masterPassword = 'MasterPassword123!'
  form.deviceName = 'Demo Web'
}
</script>

