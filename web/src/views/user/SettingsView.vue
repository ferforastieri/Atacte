<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <router-link to="/dashboard" class="flex items-center">
              <ArrowLeftIcon class="h-5 w-5 text-gray-400 mr-2" />
              <span class="text-lg font-semibold text-gray-900">Configurações</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Security Settings -->
        <BaseCard>
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">Segurança</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Alterar Senha Master</h3>
                  <p class="text-sm text-gray-500">Atualize sua senha master</p>
                </div>
                <BaseButton variant="secondary" @click="showChangePasswordModal = true">
                  Alterar
                </BaseButton>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Exportar Dados</h3>
                  <p class="text-sm text-gray-500">Baixe todas as suas senhas</p>
                </div>
                <BaseButton variant="secondary" @click="exportData">
                  Exportar
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Preferences -->
        <BaseCard>
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">Preferências</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Tema</h3>
                  <p class="text-sm text-gray-500">Escolha o tema da aplicação</p>
                </div>
                <select v-model="theme" class="input-field w-32">
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Idioma</h3>
                  <p class="text-sm text-gray-500">Idioma da interface</p>
                </div>
                <select v-model="language" class="input-field w-32">
                  <option value="pt-BR">Português</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Danger Zone -->
        <BaseCard class="border-red-200 bg-red-50">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-red-900">Zona de Perigo</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-red-900">Deletar Conta</h3>
                  <p class="text-sm text-red-700">Esta ação não pode ser desfeita</p>
                </div>
                <BaseButton variant="danger" @click="showDeleteAccountModal = true">
                  Deletar
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Modals -->
    <ChangePasswordModal
      :show="showChangePasswordModal"
      @close="showChangePasswordModal = false"
    />

    <DeleteAccountModal
      :show="showDeleteAccountModal"
      @close="showDeleteAccountModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { BaseButton, BaseCard } from '@/components/ui'

// Components (serão criados depois)
// import ChangePasswordModal from '@/components/user/ChangePasswordModal.vue'
// import DeleteAccountModal from '@/components/user/DeleteAccountModal.vue'

const router = useRouter()
const toast = useToast()

const showChangePasswordModal = ref(false)
const showDeleteAccountModal = ref(false)
const theme = ref('light')
const language = ref('pt-BR')

const exportData = async () => {
  try {
    // Implementar exportação
    toast.success('Exportação iniciada!')
  } catch (error) {
    toast.error('Erro ao exportar dados')
  }
}
</script>

