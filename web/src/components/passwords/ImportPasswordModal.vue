<template>
  <BaseModal :show="show" @close="$emit('close')" size="md">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900">Importar Senhas</h3>
    </template>

    <div class="space-y-6">
      <div class="text-center py-8">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Em desenvolvimento</h3>
        <p class="mt-1 text-sm text-gray-500">
          A funcionalidade de importação será implementada em breve.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <BaseButton variant="ghost" @click="$emit('close')">
          Fechar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { BaseModal, BaseButton } from '@/components/ui'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

