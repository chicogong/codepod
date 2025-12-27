<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const content = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function handleSend() {
  if (!content.value.trim()) return
  emit('send', content.value)
  content.value = ''
  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function autoResize(e: Event) {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="relative max-w-3xl mx-auto">
    <div
      class="flex items-end gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary-500 dark:focus-within:border-primary-500 transition-colors"
    >
      <textarea
        ref="textareaRef"
        v-model="content"
        :disabled="disabled"
        placeholder="Message Claude..."
        rows="1"
        class="flex-1 px-3 py-2 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none"
        style="max-height: 200px"
        @keydown="handleKeydown"
        @input="autoResize"
      />
      <button
        :disabled="disabled || !content.trim()"
        class="p-2 rounded-xl transition-colors"
        :class="
          content.trim() && !disabled
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        "
        @click="handleSend"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
    <p class="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
      Press Enter to send, Shift+Enter for new line
    </p>
  </div>
</template>
