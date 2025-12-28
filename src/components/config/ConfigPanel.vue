<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '@/stores'
import McpServerList from './McpServerList.vue'
import CommandList from './CommandList.vue'
import AgentList from './AgentList.vue'
import CliSettings from './CliSettings.vue'

const configStore = useConfigStore()

type TabType = 'cli' | 'mcp' | 'commands' | 'agents'
const activeTab = ref<TabType>('cli')

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'cli', label: 'CLI', icon: '⚙️' },
  { id: 'mcp', label: 'MCP Servers', icon: '🔌' },
  { id: 'commands', label: 'Commands', icon: '⚡' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
]

onMounted(() => {
  configStore.loadAll()
})
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Configuration
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Manage Claude Code settings
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
        :class="[
          activeTab === tab.id
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
        @click="activeTab = tab.id"
      >
        <span class="mr-2">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="configStore.isLoading"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-gray-500 dark:text-gray-400">Loading...</div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="configStore.error"
      class="flex-1 flex items-center justify-center p-4"
    >
      <div class="text-red-500">{{ configStore.error }}</div>
    </div>

    <!-- Content -->
    <div v-else class="flex-1 overflow-auto">
      <CliSettings v-if="activeTab === 'cli'" />
      <McpServerList v-else-if="activeTab === 'mcp'" />
      <CommandList v-else-if="activeTab === 'commands'" />
      <AgentList v-else-if="activeTab === 'agents'" />
    </div>
  </div>
</template>
