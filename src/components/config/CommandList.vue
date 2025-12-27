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
        Commands are loaded from
        <code class="font-mono">~/.claude/commands/</code>
      </p>
    </div>

    <!-- Command List -->
    <div class="space-y-3">
      <div
        v-for="command in configStore.commands"
        :key="command.name"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="font-medium text-gray-900 dark:text-white font-mono">
              /{{ command.name }}
            </div>
            <div
              v-if="command.description"
              class="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {{ command.description }}
            </div>
          </div>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="
              command.enabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            "
          >
            {{ command.enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>

        <!-- Preview -->
        <details class="mt-3">
          <summary
            class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Show content
          </summary>
          <pre
            class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300"
            >{{ command.content }}</pre
          >
        </details>
      </div>

      <!-- Empty State -->
      <div
        v-if="configStore.commands.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        No custom commands found
      </div>
    </div>

    <!-- Reload Button -->
    <button
      class="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      @click="configStore.loadCommands"
    >
      Reload Commands
    </button>
  </div>
</template>
