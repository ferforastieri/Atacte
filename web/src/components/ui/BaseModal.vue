<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <!-- Header -->
          <div v-if="$slots.header || title" class="modal-header">
            <slot name="header">
              <h3 class="modal-title">{{ title }}</h3>
            </slot>
            
            <button
              v-if="closable"
              type="button"
              class="modal-close"
              @click="$emit('close')"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>
          
          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  title?: string
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  size: 'md'
})

const emit = defineEmits<{
  close: []
}>()

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.show) {
    emit('close')
  }
}

const preventBodyScroll = () => {
  document.body.style.overflow = 'hidden'
}

const restoreBodyScroll = () => {
  document.body.style.overflow = ''
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  if (props.show) {
    preventBodyScroll()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  restoreBodyScroll()
})

// Atualizar scroll do body quando modal abre/fecha
watch(() => props.show, (show) => {
  if (show) {
    preventBodyScroll()
  } else {
    restoreBodyScroll()
  }
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-h-full overflow-hidden flex flex-col;
  width: 90vw;
  max-width: 32rem;
}

.modal-container.size-sm {
  max-width: 24rem;
}

.modal-container.size-lg {
  max-width: 48rem;
}

.modal-container.size-xl {
  max-width: 64rem;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600;
}

.modal-body {
  @apply p-6 overflow-y-auto flex-1;
}

.modal-footer {
  @apply flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50;
}

/* Transições */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
