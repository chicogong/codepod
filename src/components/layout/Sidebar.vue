<script setup lang="ts">
import { useChatStore, useSessionStore, useAppStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'
import { SessionList } from '@/components/session'
import type { Session } from '@/types'

defineProps<{
  width: number
}>()

const emit = defineEmits<{
  showConfig: []
}>()

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()
const appStore = useAppStore()

function handleNewChat() {
  // 清空当前消息
  chatStore.clearMessages()
  // 创建新 session
  const session = sessionStore.createSession('New Chat')
  // 设置当前 session
  chatStore.setCurrentSessionId(session.id)
  // 添加到 tabs
  tabsStore.addTab(session)
  // 切换到 Chat 视图
  appStore.setViewMode('chat')
}

function handleSelectSession(session: Session) {
  // Save current session before switching
  chatStore.saveCurrentSession()
  // Load messages from storage
  chatStore.loadSessionFromStorage(session.id)
  // Add or switch to tab
  tabsStore.addTab(session)
  // 切换到 Chat 视图
  appStore.setViewMode('chat')
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

    <!-- Config Button -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700">
      <button
        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        @click="emit('showConfig')"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Settings</span>
      </button>
    </div>
  </aside>
</template>
