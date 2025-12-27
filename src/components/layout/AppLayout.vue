<script setup lang="ts">
import { useAppStore } from '@/stores'
import Sidebar from './Sidebar.vue'
import StatusBar from './StatusBar.vue'

const appStore = useAppStore()
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
      />

      <!-- Chat Area -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Status Bar -->
    <StatusBar />
  </div>
</template>
