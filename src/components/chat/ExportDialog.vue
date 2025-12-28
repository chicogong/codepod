<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore, useSessionStore } from '@/stores'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()
const sessionStore = useSessionStore()

const exportFormat = ref<'markdown' | 'json'>('markdown')
const includeMetadata = ref(true)
const isExporting = ref(false)

const currentSession = computed(() => {
  if (!chatStore.currentSessionId) return null
  return sessionStore.sessions.find(s => s.id === chatStore.currentSessionId)
})

const previewContent = computed(() => {
  if (exportFormat.value === 'markdown') {
    return generateMarkdown()
  } else {
    return generateJson()
  }
})

function generateMarkdown(): string {
  const session = currentSession.value
  const messages = chatStore.messages

  let md = ''

  if (includeMetadata.value && session) {
    md += `# ${session.title}\n\n`
    md += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`
    md += `**Updated:** ${new Date(session.updatedAt).toLocaleString()}\n`
    md += `**Messages:** ${messages.length}\n\n`
    md += '---\n\n'
  }

  for (const msg of messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    md += `## ${role}\n\n`
    md += `${msg.content}\n\n`

    if (includeMetadata.value && msg.timestamp) {
      md += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`
    }

    md += '---\n\n'
  }

  return md.trim()
}

function generateJson(): string {
  const session = currentSession.value
  const messages = chatStore.messages

  const data: Record<string, unknown> = {
    messages: messages.map(msg => ({
      uuid: msg.uuid,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    })),
  }

  if (includeMetadata.value && session) {
    data.session = {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount,
    }
    data.exportedAt = new Date().toISOString()
  }

  return JSON.stringify(data, null, 2)
}

function copyToClipboard() {
  navigator.clipboard.writeText(previewContent.value)
}

async function downloadFile() {
  isExporting.value = true

  try {
    const content = previewContent.value
    const filename = `${currentSession.value?.title || 'chat'}-${Date.now()}`
    const ext = exportFormat.value === 'markdown' ? 'md' : 'json'
    const mimeType =
      exportFormat.value === 'markdown' ? 'text/markdown' : 'application/json'

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    emit('close')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="emit('close')"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">
              Export Conversation
            </h2>
            <button
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="emit('close')"
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
          </div>

          <!-- Options -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-6">
              <!-- Format Selection -->
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-600 dark:text-gray-400"
                  >Format:</span
                >
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="exportFormat"
                    type="radio"
                    value="markdown"
                    class="text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300"
                    >Markdown</span
                  >
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="exportFormat"
                    type="radio"
                    value="json"
                    class="text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300"
                    >JSON</span
                  >
                </label>
              </div>

              <!-- Metadata Toggle -->
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="includeMetadata"
                  type="checkbox"
                  class="rounded text-primary-500 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300"
                  >Include metadata</span
                >
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div class="flex-1 overflow-hidden px-6 py-4">
            <div class="h-full flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >Preview</span
                >
                <button
                  class="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                  @click="copyToClipboard"
                >
                  Copy to clipboard
                </button>
              </div>
              <pre
                class="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap"
                >{{ previewContent }}</pre
              >
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isExporting || chatStore.messages.length === 0"
              @click="downloadFile"
            >
              {{ isExporting ? 'Exporting...' : 'Download' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
