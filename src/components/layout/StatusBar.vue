<script setup lang="ts">
import { computed } from 'vue'
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

// Format token count (e.g., 1234 -> "1.2k")
function formatTokens(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 1000000) return (count / 1000).toFixed(1) + 'k'
  return (count / 1000000).toFixed(2) + 'M'
}

// Format cost (e.g., 0.0123 -> "$0.01")
function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01'
  return '$' + cost.toFixed(2)
}

const tokenStatsDisplay = computed(() => {
  const stats = chatStore.tokenStats
  if (stats.totalTokens === 0) return null
  return {
    input: formatTokens(stats.inputTokens),
    output: formatTokens(stats.outputTokens),
    total: formatTokens(stats.totalTokens),
    cost: formatCost(stats.estimatedCost),
  }
})
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
      <!-- Token Stats -->
      <span
        v-if="tokenStatsDisplay"
        class="flex items-center gap-1"
        :title="`Input: ${tokenStatsDisplay.input} | Output: ${tokenStatsDisplay.output} | Est. cost: ${tokenStatsDisplay.cost}`"
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
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span>{{ tokenStatsDisplay.total }}</span>
        <span class="text-gray-400 dark:text-gray-500"
          >({{ tokenStatsDisplay.cost }})</span
        >
      </span>

      <span v-if="tokenStatsDisplay" class="text-gray-300 dark:text-gray-600"
        >|</span
      >

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
