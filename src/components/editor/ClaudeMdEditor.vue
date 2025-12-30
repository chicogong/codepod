<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

// Editor state
const content = ref('')
const originalContent = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const saveSuccess = ref(false)

// File paths
const projectPath = computed(() => appStore.projectPath)
const claudeMdPath = computed(() =>
  projectPath.value ? `${projectPath.value}/CLAUDE.md` : null
)

// Check if content has been modified
const isModified = computed(() => content.value !== originalContent.value)

// Platform-aware shortcut key
const saveShortcutKey = computed(() => {
  if (typeof navigator !== 'undefined' && navigator.platform) {
    return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
  }
  return 'Ctrl'
})

// Detect Tauri environment
const isTauri = () => typeof window !== 'undefined' && '__TAURI__' in window

// Load CLAUDE.md content
async function loadContent() {
  if (!claudeMdPath.value) return

  isLoading.value = true
  error.value = null

  try {
    if (isTauri()) {
      const { readTextFile, exists } = await import('@tauri-apps/plugin-fs')
      const fileExists = await exists(claudeMdPath.value)

      if (fileExists) {
        const text = await readTextFile(claudeMdPath.value)
        content.value = text
        originalContent.value = text
      } else {
        // Create default content
        content.value = getDefaultContent()
        originalContent.value = ''
      }
    } else {
      // Fallback: show placeholder
      content.value = getDefaultContent()
      originalContent.value = ''
      error.value = 'File operations only available in desktop mode'
    }
  } catch (e) {
    console.error('Failed to load CLAUDE.md:', e)
    content.value = getDefaultContent()
    originalContent.value = ''
  } finally {
    isLoading.value = false
  }
}

// Save CLAUDE.md content
async function saveContent() {
  if (!claudeMdPath.value) return

  isSaving.value = true
  error.value = null
  saveSuccess.value = false

  try {
    if (isTauri()) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')
      await writeTextFile(claudeMdPath.value, content.value)
      originalContent.value = content.value
      saveSuccess.value = true
      setTimeout(() => {
        saveSuccess.value = false
      }, 2000)
    } else {
      error.value = 'Save only available in desktop mode'
    }
  } catch (e) {
    console.error('Failed to save CLAUDE.md:', e)
    error.value = e instanceof Error ? e.message : 'Failed to save file'
  } finally {
    isSaving.value = false
  }
}

// Reset to original content
function resetContent() {
  content.value = originalContent.value
}

// Get default CLAUDE.md template
function getDefaultContent(): string {
  return `# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

<!-- Describe your project here -->

## Development Commands

\`\`\`bash
# Add your common commands here
npm run dev
npm run build
npm run test
\`\`\`

## Architecture

<!-- Describe your project architecture -->

## Important Patterns

<!-- Document patterns and conventions used in your project -->

## Known Issues

<!-- List any known issues or gotchas -->
`
}

// Watch for project path changes
watch(projectPath, () => {
  loadContent()
})

// Load on mount
onMounted(() => {
  loadContent()
})

// Keyboard shortcut for save
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    if (isModified.value) {
      saveContent()
    }
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          CLAUDE.md
        </span>
        <span
          v-if="isModified"
          class="w-2 h-2 rounded-full bg-amber-500"
          title="Unsaved changes"
        />
      </div>
      <div class="flex items-center gap-2">
        <!-- Reset Button -->
        <button
          v-if="isModified"
          class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Discard changes"
          @click="resetContent"
        >
          Reset
        </button>
        <!-- Save Button -->
        <button
          class="px-3 py-1 text-xs font-medium rounded transition-colors"
          :class="
            isModified
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          "
          :disabled="!isModified || isSaving"
          @click="saveContent"
        >
          {{ isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-gray-500 dark:text-gray-400">Loading...</div>
    </div>

    <!-- No Project State -->
    <div
      v-else-if="!projectPath"
      class="flex-1 flex flex-col items-center justify-center p-4 text-center"
    >
      <div class="text-3xl mb-2">📝</div>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Select a project folder to edit CLAUDE.md
      </p>
    </div>

    <!-- Editor -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Error Banner -->
      <div
        v-if="error"
        class="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
      >
        {{ error }}
      </div>

      <!-- Textarea Editor -->
      <textarea
        v-model="content"
        class="flex-1 w-full p-4 text-sm font-mono resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400"
        placeholder="Start writing your CLAUDE.md content..."
        spellcheck="false"
        @keydown="handleKeydown"
      />

      <!-- Footer Hint -->
      <div
        class="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700"
      >
        <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
          {{ saveShortcutKey }}+S
        </kbd>
        to save
      </div>
    </div>
  </div>
</template>
