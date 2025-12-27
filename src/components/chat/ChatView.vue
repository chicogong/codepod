<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChatStore } from '@/stores'
import { useClaude } from '@/composables'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()
const { sendMessage, checkClaude, isInitialized, claudeVersion } = useClaude()
const initError = ref<string | null>(null)

onMounted(async () => {
  const ok = await checkClaude()
  if (!ok) {
    initError.value =
      'Claude CLI not found. Please install Claude Code CLI first.'
  }
})

async function handleSend(content: string) {
  await sendMessage(content)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Init Error Banner -->
    <div
      v-if="initError"
      class="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {{ initError }}
    </div>

    <!-- Claude Version Badge -->
    <div
      v-else-if="claudeVersion"
      class="bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-700 dark:text-green-300"
    >
      Connected to {{ claudeVersion }}
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto">
      <MessageList />
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <ChatInput
        ref="inputRef"
        :disabled="chatStore.isStreaming || !isInitialized"
        @send="handleSend"
      />
    </div>
  </div>
</template>
