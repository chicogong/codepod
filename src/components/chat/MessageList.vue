<script setup lang="ts">
import { computed, nextTick, watch, ref } from 'vue'
import { useChatStore } from '@/stores'
import MessageItem from './MessageItem.vue'

defineProps<{
  searchQuery?: string
}>()

const chatStore = useChatStore()
const containerRef = ref<HTMLDivElement | null>(null)

const allMessages = computed(() => {
  const msgs = [...chatStore.messages]

  // Add streaming message if any
  if (chatStore.isStreaming && chatStore.streamingContent.length > 0) {
    msgs.push({
      uuid: 'streaming',
      parentUuid: chatStore.lastMessage?.uuid ?? null,
      role: 'assistant' as const,
      content: chatStore.streamingContent,
      timestamp: new Date(),
    })
  }

  return msgs
})

// Auto-scroll to bottom
watch(
  () => chatStore.streamingContent.length,
  async () => {
    await nextTick()
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }
)

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }
)
</script>

<template>
  <div ref="containerRef" class="h-full overflow-y-auto">
    <!-- Empty State -->
    <div
      v-if="allMessages.length === 0"
      class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500"
    >
      <div class="text-6xl mb-4">💬</div>
      <h2 class="text-xl font-medium text-gray-600 dark:text-gray-300">
        Start a conversation
      </h2>
      <p class="mt-2 text-sm">Ask Claude anything about your code</p>
    </div>

    <!-- Messages -->
    <div v-else class="max-w-3xl mx-auto py-4 px-4">
      <MessageItem
        v-for="message in allMessages"
        :key="message.uuid"
        :message="message"
        :search-query="searchQuery"
      />
    </div>
  </div>
</template>
