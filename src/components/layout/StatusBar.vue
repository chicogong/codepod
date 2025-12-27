<script setup lang="ts">
import { useAppStore, useChatStore } from '@/stores'
import { useClaude, useProject } from '@/composables'
import { AVAILABLE_MODELS } from '@/types'

const appStore = useAppStore()
const chatStore = useChatStore()
const { selectProject } = useProject()
const { connectionMode, isInitialized } = useClaude()

const currentModelName = () => {
  const model = AVAILABLE_MODELS.find(m => m.id === chatStore.currentModel)
  return model?.name ?? 'Unknown'
}

const connectionModeText = () => {
  switch (connectionMode.value) {
    case 'tauri':
      return 'Tauri'
    case 'http':
      return 'HTTP'
    default:
      return 'Disconnected'
  }
}

const connectionModeClass = () => {
  switch (connectionMode.value) {
    case 'tauri':
      return 'text-blue-500'
    case 'http':
      return 'text-purple-500'
    default:
      return 'text-red-500'
  }
}
</script>

<template>
  <footer
    class="flex items-center justify-between h-7 px-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-center gap-4">
      <!-- Project Selector -->
      <button
        class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        title="Select project folder"
        @click="selectProject"
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
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span class="max-w-32 truncate">{{ appStore.projectName }}</span>
      </button>

      <span class="text-gray-300 dark:text-gray-600">|</span>

      <!-- Model -->
      <span>{{ currentModelName() }}</span>

      <span class="text-gray-300 dark:text-gray-600">|</span>

      <!-- Connection Mode -->
      <span :class="connectionModeClass()" class="font-medium">
        {{ connectionModeText() }}
      </span>
    </div>
    <div class="flex items-center gap-4">
      <span v-if="chatStore.isStreaming" class="flex items-center gap-1">
        <span class="animate-pulse text-green-500">●</span>
        Generating...
      </span>
      <span v-else-if="isInitialized" class="flex items-center gap-1">
        <span class="text-green-500">●</span>
        Ready
      </span>
      <span v-else class="flex items-center gap-1">
        <span class="text-red-500">●</span>
        Not Connected
      </span>
    </div>
  </footer>
</template>
