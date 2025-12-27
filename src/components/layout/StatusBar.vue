<script setup lang="ts">
import { useChatStore } from '@/stores'
import { AVAILABLE_MODELS } from '@/types'

const chatStore = useChatStore()

const currentModelName = () => {
  const model = AVAILABLE_MODELS.find(m => m.id === chatStore.currentModel)
  return model?.name ?? 'Unknown'
}
</script>

<template>
  <footer
    class="flex items-center justify-between h-6 px-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-center gap-4">
      <span>Model: {{ currentModelName() }}</span>
    </div>
    <div class="flex items-center gap-4">
      <span v-if="chatStore.isStreaming" class="flex items-center gap-1">
        <span class="animate-pulse">●</span>
        Generating...
      </span>
      <span v-else>Ready</span>
    </div>
  </footer>
</template>
