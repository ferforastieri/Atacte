<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="inputId"
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      
      <!-- Ícone à esquerda -->
      <div v-if="leftIcon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <component :is="leftIcon" class="h-4 w-4 text-gray-400" />
      </div>
      
      <!-- Ícone à direita -->
      <div v-if="rightIcon || showPasswordToggle" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          v-if="showPasswordToggle"
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          @click="togglePasswordVisibility"
        >
          <component 
            :is="passwordVisible ? EyeSlashIcon : EyeIcon" 
            class="h-4 w-4" 
          />
        </button>
        <component 
          v-else-if="rightIcon" 
          :is="rightIcon" 
          class="h-4 w-4 text-gray-400" 
        />
      </div>
    </div>
    
    <p v-if="error" class="text-sm text-red-600">
      {{ error }}
    </p>
    
    <p v-else-if="help" class="text-sm text-gray-500">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  leftIcon?: any
  rightIcon?: any
  showPasswordToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  showPasswordToggle: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const passwordVisible = ref(false)

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const inputType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type
})

const inputClasses = computed(() => {
  const baseClasses = 'block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500'
  
  const sizeClasses = props.leftIcon || props.rightIcon || props.showPasswordToggle 
    ? 'pl-10 pr-10' 
    : 'px-3'
  
  const errorClasses = props.error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : ''
  
  const readonlyClasses = props.readonly 
    ? 'bg-gray-50 cursor-not-allowed' 
    : 'bg-white'
  
  return [
    baseClasses,
    sizeClasses,
    errorClasses,
    readonlyClasses,
    'py-2'
  ].join(' ')
})

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}
</script>

