<script setup lang="ts">
import { useConfigStore } from '@/stores'

const configStore = useConfigStore()
</script>

<template>
  <div class="p-4">
    <!-- Info Banner -->
    <div
      class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <p class="text-sm text-blue-700 dark:text-blue-300">
        Agents are loaded from <code class="font-mono">~/.claude/agents/</code>
      </p>
    </div>

    <!-- Agent List -->
    <div class="space-y-3">
      <div
        v-for="agent in configStore.agents"
        :key="agent.name"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ agent.name }}
            </div>
            <div
              v-if="agent.description"
              class="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {{ agent.description }}
            </div>
          </div>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="
              agent.enabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            "
          >
            {{ agent.enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>

        <!-- Tools -->
        <div v-if="agent.tools && agent.tools.length > 0" class="mt-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">Tools: </span>
          <span
            v-for="(tool, index) in agent.tools"
            :key="tool"
            class="text-xs font-mono text-gray-600 dark:text-gray-300"
          >
            {{ tool }}<span v-if="index < agent.tools.length - 1">, </span>
          </span>
        </div>

        <!-- Preview -->
        <details class="mt-3">
          <summary
            class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Show system prompt
          </summary>
          <pre
            class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300"
            >{{ agent.systemPrompt }}</pre
          >
        </details>
      </div>

      <!-- Empty State -->
      <div
        v-if="configStore.agents.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        No custom agents found
      </div>
    </div>

    <!-- Reload Button -->
    <button
      class="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      @click="configStore.loadAgents"
    >
      Reload Agents
    </button>
  </div>
</template>
