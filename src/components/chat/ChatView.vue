<script setup lang="ts">
import { useChatStore } from '@/stores'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()

async function handleSend(content: string) {
  if (!content.trim() || chatStore.isStreaming) return

  // Add user message
  chatStore.addUserMessage(content)

  // TODO: Call Claude CLI via Tauri
  // For now, simulate a response
  chatStore.startStreaming()

  setTimeout(() => {
    chatStore.appendToStreamingContent({
      type: 'text',
      text: 'This is a simulated response. Claude CLI integration coming soon!',
    })
    chatStore.finalizeStreaming()
  }, 1000)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Messages -->
    <div class="flex-1 overflow-y-auto">
      <MessageList />
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <ChatInput
        ref="inputRef"
        :disabled="chatStore.isStreaming"
        @send="handleSend"
      />
    </div>
  </div>
</template>
