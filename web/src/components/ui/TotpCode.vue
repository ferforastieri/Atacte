<template>
  <div class="totp-container">
    <div class="totp-code-wrapper">
      <div class="totp-code" :class="{ 'animate-pulse': timeRemaining < 5 }">
        {{ formattedCode }}
      </div>
      
      <div class="totp-timer-container">
        <div class="totp-timer" :style="timerStyle">
          <div class="totp-timer-inner">
            {{ timeRemaining }}s
          </div>
        </div>
      </div>
    </div>
    
    <div class="totp-actions">
      <BaseButton
        variant="ghost"
        size="sm"
        @click="copyCode"
        :disabled="!code"
      >
        <ClipboardIcon class="w-4 h-4 mr-1" />
        Copiar
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        @click="refreshCode"
        :loading="isRefreshing"
      >
        <ArrowPathIcon class="w-4 h-4 mr-1" />
        Atualizar
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/hooks/useToast'
import { ClipboardIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import BaseButton from './BaseButton.vue'

interface Props {
  code?: string
  timeRemaining?: number
  period?: number
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true
})

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()
const isRefreshing = ref(false)
let intervalId: number | null = null

const formattedCode = computed(() => {
  if (!props.code) return '------'
  return props.code.replace(/(.{3})/g, '$1 ').trim()
})

const timerStyle = computed(() => {
  if (!props.timeRemaining || !props.period) return {}
  
  const progress = (props.timeRemaining / props.period) * 100
  return {
    '--progress': `${progress * 3.6}deg`
  }
})

const copyCode = async () => {
  if (!props.code) return
  
  try {
    await navigator.clipboard.writeText(props.code)
    toast.success('Código copiado!')
  } catch (error) {
    toast.error('Erro ao copiar código')
  }
}

const refreshCode = async () => {
  isRefreshing.value = true
  emit('refresh')
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}

const startTimer = () => {
  if (intervalId) return
  
  intervalId = window.setInterval(() => {
    // O timer será controlado pelo componente pai
    // Aqui apenas verificamos se precisa fazer refresh
    if (props.timeRemaining && props.timeRemaining <= 1) {
      emit('refresh')
    }
  }, 1000)
}

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => {
  if (props.autoRefresh) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.totp-container {
  @apply bg-white rounded-lg border border-gray-200 p-4 space-y-4;
}

.totp-code-wrapper {
  @apply relative;
}

.totp-code {
  @apply font-mono text-3xl font-bold text-center bg-gray-50 rounded-lg py-4 px-6 border-2 border-dashed border-gray-300 tracking-widest;
}

.totp-timer-container {
  @apply absolute -top-2 -right-2;
}

.totp-timer {
  @apply w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center;
  background: conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 var(--progress), #e5e7eb var(--progress), #e5e7eb 360deg);
}

.totp-timer-inner {
  @apply w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700;
}

.totp-actions {
  @apply flex justify-center space-x-2;
}
</style>

