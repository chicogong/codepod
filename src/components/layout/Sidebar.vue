<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane, NIcon } from 'naive-ui'
import {
  ChatbubblesOutline,
  FolderOutline,
  GitBranchOutline,
  BuildOutline,
} from '@vicons/ionicons5'
import { useChatStore, useSessionStore, useAppStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'
import { SessionList } from '@/components/session'
import FileExplorer from '@/components/explorer/FileExplorer.vue'
import GitStatus from '@/components/explorer/GitStatus.vue'
import { McpToolsPanel } from '@/components/mcp'
import type { Session, FileEntry } from '@/types'

defineProps<{
  width: number
}>()

const emit = defineEmits<{
  showConfig: []
  fileSelect: [file: FileEntry]
  fileOpen: [file: FileEntry]
}>()

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()
const appStore = useAppStore()

// Active tab in sidebar
const activeTab = ref('sessions')

// Current project path for file explorer
const projectPath = computed(() => appStore.projectPath)

function handleNewChat() {
  // 清空当前消息
  chatStore.clearMessages()
  // 创建新 session
  const session = sessionStore.createSession()
  // 设置当前 session
  chatStore.setCurrentSessionId(session.id)
  // 添加到 tabs
  tabsStore.addTab(session)
  // 切换到 Chat 视图
  appStore.setViewMode('chat')
}

function handleSelectSession(session: Session) {
  // Save current session before switching
  chatStore.saveCurrentSession()
  // Load messages from storage
  chatStore.loadSessionFromStorage(session.id)
  // Add or switch to tab
  tabsStore.addTab(session)
  // 切换到 Chat 视图
  appStore.setViewMode('chat')
}

function handleFileSelect(file: FileEntry) {
  emit('fileSelect', file)
}

function handleFileOpen(file: FileEntry) {
  emit('fileOpen', file)
}
</script>

<template>
  <aside
    class="sidebar flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    :style="{ width: `${width}px` }"
  >
    <!-- New Chat Button -->
    <div class="p-3">
      <button
        class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        @click="handleNewChat"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>New Chat</span>
      </button>
    </div>

    <!-- Tabbed Content -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <NTabs
        v-model:value="activeTab"
        type="line"
        size="small"
        justify-content="space-evenly"
        class="sidebar-tabs"
      >
        <NTabPane name="sessions">
          <template #tab>
            <div class="tab-label">
              <NIcon :component="ChatbubblesOutline" size="16" />
              <span class="hidden sm:inline">Sessions</span>
            </div>
          </template>
          <SessionList
            class="h-full overflow-hidden"
            @select="handleSelectSession"
          />
        </NTabPane>

        <NTabPane name="files">
          <template #tab>
            <div class="tab-label">
              <NIcon :component="FolderOutline" size="16" />
              <span class="hidden sm:inline">Files</span>
            </div>
          </template>
          <div class="h-full overflow-hidden">
            <FileExplorer
              v-if="projectPath"
              :root-path="projectPath"
              :show-hidden="false"
              @select="handleFileSelect"
              @open="handleFileOpen"
            />
            <div
              v-else
              class="flex items-center justify-center h-full text-gray-500 text-sm p-4 text-center"
            >
              Select a project folder to browse files
            </div>
          </div>
        </NTabPane>

        <NTabPane name="git">
          <template #tab>
            <div class="tab-label">
              <NIcon :component="GitBranchOutline" size="16" />
              <span class="hidden sm:inline">Git</span>
            </div>
          </template>
          <div class="h-full overflow-auto">
            <GitStatus v-if="projectPath" :path="projectPath" />
            <div
              v-else
              class="flex items-center justify-center h-full text-gray-500 text-sm p-4 text-center"
            >
              Select a project folder to view git status
            </div>
          </div>
        </NTabPane>

        <NTabPane name="mcp">
          <template #tab>
            <div class="tab-label">
              <NIcon :component="BuildOutline" size="16" />
              <span class="hidden sm:inline">MCP</span>
            </div>
          </template>
          <div class="h-full overflow-auto">
            <McpToolsPanel />
          </div>
        </NTabPane>
      </NTabs>
    </div>

    <!-- Config Button -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700">
      <button
        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        @click="emit('showConfig')"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Settings</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  min-width: 200px;
}

.sidebar-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-tabs :deep(.n-tabs-nav) {
  padding: 0 8px;
}

.sidebar-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
}

.sidebar-tabs :deep(.n-tab-pane) {
  height: 100%;
  padding: 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Responsive: hide text on smaller screens */
@media (max-width: 768px) {
  .sidebar {
    min-width: 60px;
  }

  .tab-label span {
    display: none;
  }
}
</style>
