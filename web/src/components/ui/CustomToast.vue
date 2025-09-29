<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-4 p-4 flex items-start space-x-3"
      :class="borderColorClass"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        <component
          :is="iconComponent"
          :class="iconColorClass"
          class="h-6 w-6"
        />
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ title }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ message }}
        </p>
      </div>
      
      <!-- Close Button -->
      <div class="flex-shrink-0">
        <button
          @click="$emit('close')"
          class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md p-1"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'info':
      return InformationCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
})

const borderColorClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'border-l-green-500'
    case 'error':
      return 'border-l-red-500'
    case 'info':
      return 'border-l-blue-500'
    case 'warning':
      return 'border-l-yellow-500'
    default:
      return 'border-l-blue-500'
  }
})

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    case 'info':
      return 'text-blue-500'
    case 'warning':
      return 'text-yellow-500'
    default:
      return 'text-blue-500'
  }
})
</script>
