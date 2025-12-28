<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore, useChatStore, useSessionStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'
import Sidebar from './Sidebar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import { ConfigPanel } from '@/components/config'

const appStore = useAppStore()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()
const showConfigPanel = ref(false)

// Initialize tabs on mount
onMounted(() => {
  tabsStore.loadTabs()

  // If we have a current session but no tabs, create a tab for it
  if (chatStore.currentSessionId && tabsStore.tabs.length === 0) {
    const session = sessionStore.sessions.find(
      s => s.id === chatStore.currentSessionId
    )
    if (session) {
      tabsStore.addTab(session)
    }
  }

  // If we have tabs but active tab's session doesn't match current, sync them
  if (
    tabsStore.activeTab &&
    tabsStore.activeTab.sessionId !== chatStore.currentSessionId
  ) {
    chatStore.loadSessionFromStorage(tabsStore.activeTab.sessionId)
  }
})
</script>

<template>
  <div class="flex flex-col h-screen bg-white dark:bg-gray-900">
    <!-- Top Bar -->
    <header
      class="flex items-center h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold text-gray-800 dark:text-white"
          >CodePod</span
        >
      </div>
      <div class="flex-1 flex justify-center">
        <button
          class="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {{ appStore.projectName }}
          <span class="ml-1 text-gray-400">▼</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="appStore.toggleDarkMode"
        >
          <span v-if="appStore.isDarkMode">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <Sidebar
        v-if="!appStore.isSidebarCollapsed"
        :width="appStore.sidebarWidth"
        @show-config="showConfigPanel = true"
      />

      <!-- Chat Area -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <TabBar />
        <slot />
      </main>

      <!-- Config Panel (Slide-over) -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="showConfigPanel"
          class="absolute right-0 top-12 bottom-6 w-96 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20"
        >
          <div class="h-full relative">
            <!-- Close button -->
            <button
              class="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
              @click="showConfigPanel = false"
            >
              <svg
                class="w-5 h-5"
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
            <ConfigPanel />
          </div>
        </div>
      </Transition>

      <!-- Backdrop -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showConfigPanel"
          class="fixed inset-0 bg-black/20 z-10"
          @click="showConfigPanel = false"
        />
      </Transition>
    </div>

    <!-- Status Bar -->
    <StatusBar />
  </div>
</template>
