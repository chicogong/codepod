<script setup lang="ts">
import { useAppStore } from '@/stores'
import { useProject } from '@/composables'

const appStore = useAppStore()
const { selectProject, openRecentProject, isSelecting } = useProject()

function formatDate(date: Date | string | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="p-4">
    <!-- Current Project -->
    <div class="mb-4">
      <div
        class="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        @click="selectProject"
      >
        <div
          class="w-10 h-10 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-lg"
        >
          <svg
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ appStore.projectName }}
          </p>
          <p
            v-if="appStore.projectPath"
            class="text-xs text-gray-500 dark:text-gray-400 truncate"
          >
            {{ appStore.projectPath }}
          </p>
          <p v-else class="text-xs text-gray-400 dark:text-gray-500">
            Click to select a project folder
          </p>
        </div>
        <svg
          v-if="isSelecting"
          class="w-5 h-5 text-gray-400 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <svg
          v-else
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>

    <!-- Recent Projects -->
    <div v-if="appStore.recentProjects.length > 0">
      <h3
        class="px-1 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        Recent Projects
      </h3>
      <ul class="space-y-1">
        <li
          v-for="project in appStore.recentProjects"
          :key="project.path"
          class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
          :class="
            appStore.projectPath === project.path
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          @click="openRecentProject(project)"
        >
          <svg
            class="w-4 h-4 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span class="flex-1 truncate text-sm">{{ project.name }}</span>
          <span class="text-xs text-gray-400">
            {{ formatDate(project.lastOpened) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
