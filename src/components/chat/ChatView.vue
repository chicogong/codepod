<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChatStore } from '@/stores'
import { useClaude, useSearch, useKeyboard } from '@/composables'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import SearchBar from './SearchBar.vue'

const chatStore = useChatStore()
const { sendMessage, checkClaude, isInitialized, claudeVersion } = useClaude()
const { searchQuery, isSearchOpen, resultCount, closeSearch, toggleSearch } =
  useSearch()
const initError = ref<string | null>(null)

// Register keyboard shortcuts
useKeyboard([
  {
    key: 'k',
    meta: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'k',
    ctrl: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'f',
    meta: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'f',
    ctrl: true,
    action: toggleSearch,
    description: 'Search messages',
  },
])

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
    <!-- Search Bar -->
    <SearchBar
      v-model="searchQuery"
      :result-count="resultCount"
      :is-open="isSearchOpen"
      @close="closeSearch"
    />

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
      <MessageList :search-query="searchQuery" />
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
