<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs'
import { useChatStore, useSessionStore } from '@/stores'

const tabsStore = useTabsStore()
const chatStore = useChatStore()
const sessionStore = useSessionStore()

function switchToTab(tabId: string) {
  const tab = tabsStore.tabs.find(t => t.id === tabId)
  if (tab && tab.sessionId !== chatStore.currentSessionId) {
    tabsStore.setActiveTab(tabId)
    chatStore.loadSessionFromStorage(tab.sessionId)
  }
}

function closeTab(tabId: string, event: MouseEvent) {
  event.stopPropagation()
  const tab = tabsStore.tabs.find(t => t.id === tabId)
  const wasActive = tab?.isActive

  tabsStore.closeTab(tabId)

  // If we closed the active tab, load the new active tab's session
  if (wasActive && tabsStore.activeTab) {
    chatStore.loadSessionFromStorage(tabsStore.activeTab.sessionId)
  } else if (tabsStore.tabs.length === 0) {
    // No more tabs, create a new session
    const newSession = sessionStore.createSession()
    chatStore.clearMessages()
    chatStore.setCurrentSessionId(newSession.id)
    tabsStore.addTab(newSession)
  }
}

function openNewTab() {
  const newSession = sessionStore.createSession()
  chatStore.saveCurrentSession()
  chatStore.clearMessages()
  chatStore.setCurrentSessionId(newSession.id)
  tabsStore.addTab(newSession)
}
</script>

<template>
  <div
    v-if="tabsStore.tabs.length > 0"
    class="flex items-center h-9 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
  >
    <!-- Tabs -->
    <div class="flex items-center flex-1 min-w-0">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        class="group flex items-center gap-1 px-3 h-9 cursor-pointer border-r border-gray-200 dark:border-gray-700 min-w-0 max-w-48 transition-colors"
        :class="[
          tab.isActive
            ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
        ]"
        @click="switchToTab(tab.id)"
      >
        <span class="truncate text-sm flex-1">{{ tab.title }}</span>
        <button
          class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          :class="tab.isActive ? 'opacity-100' : ''"
          @click="closeTab(tab.id, $event)"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- New Tab Button -->
    <button
      v-if="tabsStore.canAddTab"
      class="flex items-center justify-center w-9 h-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
      title="New Tab (⌘T)"
      @click="openNewTab"
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
    </button>
  </div>
</template>
