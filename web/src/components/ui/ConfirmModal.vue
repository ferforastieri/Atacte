<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" @click="handleBackdropClick">
    <div class="bg-white rounded-lg p-6 max-w-md mx-4" @click.stop>
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
        </div>
      </div>
      
      <p class="text-gray-600 mb-6">
        {{ message }}
      </p>
      
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="ghost"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="danger"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue'

interface Props {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  loading?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmar Ação',
  confirmText: 'Confirmar',
  loading: false
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleBackdropClick = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>
