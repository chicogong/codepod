<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  resultCount: number
  isOpen: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  close: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.isOpen,
  open => {
    if (open) {
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <svg
      class="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <input
      ref="inputRef"
      :value="modelValue"
      type="text"
      placeholder="Search messages..."
      class="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <span v-if="modelValue" class="text-xs text-gray-400 dark:text-gray-500">
      {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}
    </span>
    <button
      class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="Close search (Esc)"
      @click="$emit('close')"
    >
      <svg
        class="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
