<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NDrawer, useMessage } from 'naive-ui'
import { useChatStore, useSessionStore } from '@/stores'
import { useClaude, useSearch, useKeyboard } from '@/composables'
import { CheckpointPanel } from '@/components/session'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import SearchBar from './SearchBar.vue'
import ExportDialog from './ExportDialog.vue'
import type { Checkpoint } from '@/types'

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const message = useMessage()
const {
  sendMessage,
  checkClaude,
  reconnect,
  claudeVersion,
  connectionMode,
  setHttpApiUrl,
} = useClaude()
const { searchQuery, isSearchOpen, resultCount, closeSearch, toggleSearch } =
  useSearch()
const initError = ref<string | null>(null)
const isConnecting = ref(false)
const customApiUrl = ref('http://127.0.0.1:3002')
const showExportDialog = ref(false)
const showCheckpointPanel = ref(false)

// 连接状态文本
const connectionStatusText = computed(() => {
  if (connectionMode.value === 'tauri') {
    return `Tauri: ${claudeVersion.value}`
  } else if (connectionMode.value === 'http') {
    return `HTTP API: ${customApiUrl.value}`
  }
  return null
})

// Register keyboard shortcuts
useKeyboard([
  {
    key: 'k',
    meta: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'k',
    ctrl: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'f',
    meta: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'f',
    ctrl: true,
    action: toggleSearch,
    description: 'Search messages',
  },
  {
    key: 'e',
    meta: true,
    shift: true,
    action: () => (showExportDialog.value = true),
    description: 'Export conversation',
  },
  {
    key: 'e',
    ctrl: true,
    shift: true,
    action: () => (showExportDialog.value = true),
    description: 'Export conversation',
  },
  {
    key: 'p',
    meta: true,
    shift: true,
    action: () => (showCheckpointPanel.value = !showCheckpointPanel.value),
    description: 'Toggle checkpoints panel',
  },
  {
    key: 'p',
    ctrl: true,
    shift: true,
    action: () => (showCheckpointPanel.value = !showCheckpointPanel.value),
    description: 'Toggle checkpoints panel',
  },
])

onMounted(async () => {
  await tryConnect()
})

async function tryConnect() {
  isConnecting.value = true
  initError.value = null

  try {
    const ok = await checkClaude()
    if (!ok) {
      initError.value =
        'Claude not connected. Start HTTP API server with: codebuddy --serve --port 3000'
    }
  } finally {
    isConnecting.value = false
  }
}

async function handleReconnect() {
  setHttpApiUrl(customApiUrl.value)
  await tryConnect()
}

async function handleSend(content: string) {
  await sendMessage(content)
}

function handleRestoreCheckpoint(checkpoint: Checkpoint) {
  try {
    // Restore messages from checkpoint
    chatStore.setMessages(checkpoint.messages)

    // Save to session
    if (chatStore.currentSessionId) {
      sessionStore.saveMessages(chatStore.currentSessionId, checkpoint.messages)
      sessionStore.updateSession(chatStore.currentSessionId, {
        messageCount: checkpoint.messageCount,
        updatedAt: new Date(),
      })
    }

    message.success(`已恢复到检查点: ${checkpoint.name}`)
    showCheckpointPanel.value = false
  } catch (error) {
    message.error('恢复检查点失败')
    console.error('Failed to restore checkpoint:', error)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search Bar -->
    <SearchBar
      v-model="searchQuery"
      :result-count="resultCount"
      :is-open="isSearchOpen"
      @close="closeSearch"
    />

    <!-- Connection Error Banner -->
    <div
      v-if="initError"
      class="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-amber-700 dark:text-amber-300">
          <span class="font-medium">{{ initError }}</span>
        </div>
      </div>
      <!-- 手动连接选项 -->
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model="customApiUrl"
          type="text"
          placeholder="HTTP API URL"
          class="flex-1 px-2 py-1 text-xs rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <button
          class="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors disabled:opacity-50"
          :disabled="isConnecting"
          @click="handleReconnect"
        >
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
      </div>
      <div class="mt-2 text-xs text-amber-600 dark:text-amber-400">
        Tip: Run
        <code class="bg-amber-100 dark:bg-amber-900 px-1 rounded"
          >codebuddy --serve --port 3000</code
        >
        to start HTTP API server
      </div>
    </div>

    <!-- Connected Badge -->
    <div
      v-else-if="connectionStatusText"
      class="bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-700 dark:text-green-300 flex items-center justify-between"
    >
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Connected: {{ connectionStatusText }}
      </span>
      <div class="flex items-center gap-3">
        <button
          v-if="chatStore.messages.length > 0 && chatStore.currentSessionId"
          class="text-green-600 dark:text-green-400 hover:underline"
          title="Checkpoints (⇧⌘P)"
          @click="showCheckpointPanel = true"
        >
          Checkpoints
        </button>
        <button
          v-if="chatStore.messages.length > 0"
          class="text-green-600 dark:text-green-400 hover:underline"
          title="Export (⇧⌘E)"
          @click="showExportDialog = true"
        >
          Export
        </button>
        <button
          class="text-green-600 dark:text-green-400 hover:underline"
          @click="reconnect"
        >
          Reconnect
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto">
      <MessageList :search-query="searchQuery" />
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <ChatInput
        ref="inputRef"
        :disabled="chatStore.isStreaming"
        @send="handleSend"
      />
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      :visible="showExportDialog"
      @close="showExportDialog = false"
    />

    <!-- Checkpoint Panel Drawer -->
    <NDrawer v-model:show="showCheckpointPanel" :width="400" placement="right">
      <CheckpointPanel
        v-if="chatStore.currentSessionId"
        :session-id="chatStore.currentSessionId"
        @restore="handleRestoreCheckpoint"
      />
    </NDrawer>
  </div>
</template>
