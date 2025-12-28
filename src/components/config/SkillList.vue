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
        Skills are loaded from
        <code class="font-mono">~/.claude/skills/</code> directory
      </p>
    </div>

    <!-- Skill List -->
    <div class="space-y-3">
      <div
        v-for="skill in configStore.skills"
        :key="skill.name"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">🎯</span>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ skill.name }}
              </div>
            </div>
            <div
              v-if="skill.description"
              class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-7"
            >
              {{ skill.description }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-1 text-xs rounded-full"
              :class="
                skill.enabled
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              "
            >
              {{ skill.enabled ? 'Enabled' : 'Disabled' }}
            </span>
            <button
              class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              :title="skill.enabled ? 'Disable skill' : 'Enable skill'"
              @click="configStore.toggleSkill(skill.name)"
            >
              <svg
                v-if="skill.enabled"
                class="w-4 h-4 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4 text-gray-400"
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

        <!-- Preview -->
        <details class="mt-3">
          <summary
            class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Show skill content
          </summary>
          <pre
            class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto"
            >{{ skill.content }}</pre
          >
        </details>
      </div>

      <!-- Empty State -->
      <div
        v-if="configStore.skills.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <div class="text-4xl mb-2">🎯</div>
        <p>No skills found</p>
        <p class="text-xs mt-1">
          Add markdown files to <code class="font-mono">~/.claude/skills/</code>
        </p>
      </div>
    </div>

    <!-- Reload Button -->
    <button
      class="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      @click="configStore.loadSkills"
    >
      Reload Skills
    </button>
  </div>
</template>
