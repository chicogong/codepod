<script setup lang="ts">
import { useChatStore } from '@/stores'
import { SessionList } from '@/components/session'
import type { Session } from '@/types'

defineProps<{
  width: number
}>()

const chatStore = useChatStore()

function handleNewChat() {
  chatStore.clearMessages()
}

function handleSelectSession(session: Session) {
  // TODO: Load session messages from storage
  chatStore.loadSession(session.id, [])
}
</script>

<template>
  <aside
    class="flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    :style="{ width: `${width}px` }"
  >
    <!-- New Chat Button -->
    <div class="p-3">
      <button
        class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        @click="handleNewChat"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>New Chat</span>
      </button>
    </div>

    <!-- Session List -->
    <SessionList class="flex-1 overflow-hidden" @select="handleSelectSession" />
  </aside>
</template>
