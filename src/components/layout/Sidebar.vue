<script setup lang="ts">
import { useSessionStore, useChatStore } from '@/stores'

defineProps<{
  width: number
}>()

const sessionStore = useSessionStore()
const chatStore = useChatStore()

function handleNewChat() {
  chatStore.clearMessages()
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
        <span>+</span>
        <span>New Chat</span>
      </button>
    </div>

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto px-2">
      <template
        v-for="(sessions, group) in sessionStore.groupedSessions"
        :key="group"
      >
        <div class="mb-4">
          <h3
            class="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
          >
            {{ group }}
          </h3>
          <ul class="space-y-1">
            <li
              v-for="session in sessions"
              :key="session.id"
              class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer truncate"
            >
              {{ session.title }}
            </li>
          </ul>
        </div>
      </template>

      <!-- Empty State -->
      <div
        v-if="sessionStore.sessionCount === 0"
        class="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500"
      >
        <p class="text-sm">No conversations yet</p>
        <p class="text-xs mt-1">Start a new chat to begin</p>
      </div>
    </div>
  </aside>
</template>
