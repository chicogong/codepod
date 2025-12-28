<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores'
import { useClaude } from '@/composables'
import { AVAILABLE_MODELS, type ModelId } from '@/types'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const chatStore = useChatStore()
const { stopGeneration, regenerateMessage } = useClaude()

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

function handleModelChange(e: Event) {
  const target = e.target as HTMLSelectElement
  chatStore.setModel(target.value as ModelId)
}

function handleStop() {
  stopGeneration()
}

async function handleRegenerate() {
  await regenerateMessage()
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="relative max-w-3xl mx-auto">
    <!-- Model Selector Row -->
    <div class="flex items-center justify-between mb-2 px-1">
      <!-- Model Selector -->
      <select
        id="model-selector"
        name="model-selector"
        :value="chatStore.currentModel"
        :disabled="chatStore.isStreaming"
        class="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        @change="handleModelChange"
      >
        <option
          v-for="model in AVAILABLE_MODELS"
          :key="model.id"
          :value="model.id"
          class="bg-white dark:bg-gray-800"
        >
          {{ model.name }}
        </option>
      </select>

      <!-- Regenerate Button (only show when not streaming and has messages) -->
      <button
        v-if="!chatStore.isStreaming && chatStore.lastUserMessage"
        class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Regenerate last response"
        @click="handleRegenerate"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Regenerate</span>
      </button>
    </div>

    <!-- Input Area -->
    <div
      class="flex items-end gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary-500 dark:focus-within:border-primary-500 transition-colors"
    >
      <textarea
        id="chat-input"
        ref="textareaRef"
        v-model="content"
        :disabled="disabled || chatStore.isStreaming"
        placeholder="Message Claude..."
        name="chat-input"
        rows="1"
        class="flex-1 px-3 py-2 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none disabled:opacity-50"
        style="max-height: 200px"
        @keydown="handleKeydown"
        @input="autoResize"
      />

      <!-- Stop Button (when streaming) -->
      <button
        v-if="chatStore.isStreaming"
        class="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
        title="Stop generating"
        @click="handleStop"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>

      <!-- Send Button (when not streaming) -->
      <button
        v-else
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
