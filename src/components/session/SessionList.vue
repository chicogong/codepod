<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSessionStore, useChatStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'
import type { Session } from '@/types'

const sessionStore = useSessionStore()
const chatStore = useChatStore()
const tabsStore = useTabsStore()

const emit = defineEmits<{
  select: [session: Session]
}>()

// Editing state
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')

// Initialize sessions from storage on mount
onMounted(() => {
  sessionStore.init()
})

function handleSelect(session: Session) {
  // Save current session before switching
  chatStore.saveCurrentSession()
  // Load messages from storage
  chatStore.loadSessionFromStorage(session.id)
  // Add or switch to tab
  tabsStore.addTab(session)
  emit('select', session)
}

function handleDelete(session: Session, event: Event) {
  event.stopPropagation()
  if (confirm(`Delete "${session.title}"?`)) {
    // Close tab if open
    const tab = tabsStore.tabs.find(t => t.sessionId === session.id)
    if (tab) {
      tabsStore.closeTab(tab.id)
    }
    sessionStore.removeSession(session.id)
    // Clear chat if current session was deleted
    if (chatStore.currentSessionId === session.id) {
      chatStore.clearMessages()
    }
  }
}

function startEditing(session: Session, event: Event) {
  event.stopPropagation()
  editingSessionId.value = session.id
  editingTitle.value = session.title
}

function saveEditing() {
  if (editingSessionId.value && editingTitle.value.trim()) {
    const newTitle = editingTitle.value.trim()
    sessionStore.renameSession(editingSessionId.value, newTitle)
    // Update tab title if session is open in a tab
    tabsStore.updateTabBySessionId(editingSessionId.value, { title: newTitle })
  }
  cancelEditing()
}

function cancelEditing() {
  editingSessionId.value = null
  editingTitle.value = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveEditing()
  } else if (event.key === 'Escape') {
    cancelEditing()
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Session Groups -->
    <div class="flex-1 overflow-y-auto">
      <template
        v-for="(sessions, group) in sessionStore.groupedSessions"
        :key="group"
      >
        <div class="mb-4">
          <h3
            class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            {{ group }}
          </h3>
          <ul class="space-y-1 px-2">
            <li
              v-for="session in sessions"
              :key="session.id"
              class="group relative flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors"
              :class="
                chatStore.currentSessionId === session.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              @click="handleSelect(session)"
            >
              <div class="flex-1 min-w-0">
                <!-- Editing mode -->
                <input
                  v-if="editingSessionId === session.id"
                  v-model="editingTitle"
                  class="w-full px-1 py-0.5 text-sm bg-white dark:bg-gray-800 border border-primary-500 rounded focus:outline-none"
                  autofocus
                  @click.stop
                  @blur="saveEditing"
                  @keydown="handleKeydown"
                />
                <!-- Display mode -->
                <template v-else>
                  <p class="truncate font-medium">{{ session.title }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {{ formatDate(session.updatedAt) }} ·
                    {{ session.messageCount }} msgs
                  </p>
                </template>
              </div>
              <!-- Action Buttons -->
              <div
                class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <!-- Rename Button -->
                <button
                  class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Rename"
                  @click="startEditing(session, $event)"
                >
                  <svg
                    class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <!-- Delete Button -->
                <button
                  class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Delete"
                  @click="handleDelete(session, $event)"
                >
                  <svg
                    class="w-4 h-4 text-gray-400 hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <!-- Empty State -->
      <div
        v-if="sessionStore.sessionCount === 0"
        class="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500"
      >
        <svg
          class="w-12 h-12 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p class="text-sm">No conversations yet</p>
        <p class="text-xs mt-1">Start a new chat to begin</p>
      </div>
    </div>
  </div>
</template>
