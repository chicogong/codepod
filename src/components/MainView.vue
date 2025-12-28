<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NTabs, NTabPane, NButton, NIcon, NTooltip } from 'naive-ui'
import { ChatboxOutline, TerminalOutline, AddOutline } from '@vicons/ionicons5'
import { ChatView } from './chat'
import { TerminalView } from './terminal'
import { useAppStore } from '@/stores'

type ViewMode = 'chat' | 'terminal'

const appStore = useAppStore()

// Current view mode
const viewMode = ref<ViewMode>('chat')

// Terminal sessions
interface TerminalSession {
  id: string
  name: string
  cwd?: string
}

const terminalSessions = ref<TerminalSession[]>([])
const activeTerminalId = ref<string | null>(null)
const terminalRefs = ref<Map<string, InstanceType<typeof TerminalView>>>(
  new Map()
)

// Computed
const hasTerminals = computed(() => terminalSessions.value.length > 0)

// Create new terminal session
function createTerminal() {
  const id = crypto.randomUUID()
  const index = terminalSessions.value.length + 1

  terminalSessions.value.push({
    id,
    name: `Terminal ${index}`,
    cwd: appStore.projectPath || undefined,
  })

  activeTerminalId.value = id
  viewMode.value = 'terminal'
}

// Close terminal session
function closeTerminal(id: string) {
  const ref = terminalRefs.value.get(id)
  if (ref) {
    ref.disconnect()
    terminalRefs.value.delete(id)
  }

  const index = terminalSessions.value.findIndex(s => s.id === id)
  if (index > -1) {
    terminalSessions.value.splice(index, 1)
  }

  // Switch to another terminal or chat
  if (activeTerminalId.value === id) {
    if (terminalSessions.value.length > 0) {
      const firstSession = terminalSessions.value[0]
      activeTerminalId.value = firstSession ? firstSession.id : null
    } else {
      activeTerminalId.value = null
      viewMode.value = 'chat'
    }
  }
}

// Handle terminal connected
function onTerminalConnected(sessionId: string, ptySessionId: string) {
  const session = terminalSessions.value.find(s => s.id === sessionId)
  if (session) {
    // Could update session info here
    console.log('Terminal connected:', ptySessionId)
  }
}

// Handle terminal error
function onTerminalError(sessionId: string, message: string) {
  console.error('Terminal error:', sessionId, message)
}

// Store terminal ref
function setTerminalRef(
  id: string,
  ref: InstanceType<typeof TerminalView> | null
) {
  if (ref) {
    terminalRefs.value.set(id, ref)
  } else {
    terminalRefs.value.delete(id)
  }
}

// Focus active terminal when switching
watch(viewMode, mode => {
  if (mode === 'terminal' && activeTerminalId.value) {
    const ref = terminalRefs.value.get(activeTerminalId.value)
    if (ref) {
      setTimeout(() => ref.focus(), 100)
    }
  }
})

// Auto-create first terminal when switching to terminal view if none exists
watch(viewMode, mode => {
  if (mode === 'terminal' && terminalSessions.value.length === 0) {
    createTerminal()
  }
})
</script>

<template>
  <div class="main-view">
    <!-- View Mode Tabs -->
    <div class="view-tabs">
      <NTabs v-model:value="viewMode" type="segment" size="small" animated>
        <template #prefix>
          <span class="tab-label">View:</span>
        </template>
        <NTabPane name="chat" tab="Chat">
          <template #tab>
            <div class="tab-content">
              <NIcon :component="ChatboxOutline" />
              <span>Chat</span>
            </div>
          </template>
        </NTabPane>
        <NTabPane name="terminal" tab="Terminal">
          <template #tab>
            <div class="tab-content">
              <NIcon :component="TerminalOutline" />
              <span>Terminal</span>
              <span v-if="hasTerminals" class="terminal-count">
                {{ terminalSessions.length }}
              </span>
            </div>
          </template>
        </NTabPane>
      </NTabs>

      <!-- Terminal Actions -->
      <div v-if="viewMode === 'terminal'" class="terminal-actions">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton size="tiny" quaternary circle @click="createTerminal">
              <template #icon>
                <NIcon :component="AddOutline" />
              </template>
            </NButton>
          </template>
          New Terminal
        </NTooltip>
      </div>
    </div>

    <!-- View Content -->
    <div class="view-content">
      <!-- Chat View -->
      <div v-show="viewMode === 'chat'" class="chat-container">
        <ChatView />
      </div>

      <!-- Terminal View -->
      <div v-show="viewMode === 'terminal'" class="terminal-container">
        <!-- Terminal Tabs -->
        <div v-if="terminalSessions.length > 1" class="terminal-tabs">
          <NTabs
            :value="activeTerminalId || undefined"
            type="card"
            size="small"
            closable
            @update:value="(val: string) => (activeTerminalId = val)"
            @close="closeTerminal"
          >
            <NTabPane
              v-for="session in terminalSessions"
              :key="session.id"
              :name="session.id"
              :tab="session.name"
            />
          </NTabs>
        </div>

        <!-- Terminal Instances -->
        <div class="terminal-instances">
          <template v-for="session in terminalSessions" :key="session.id">
            <div
              v-show="session.id === activeTerminalId"
              class="terminal-instance"
            >
              <TerminalView
                :ref="el => setTerminalRef(session.id, el as any)"
                :cwd="session.cwd"
                auto-connect
                @connected="ptyId => onTerminalConnected(session.id, ptyId)"
                @error="msg => onTerminalError(session.id, msg)"
              />
            </div>
          </template>

          <!-- Empty State -->
          <div v-if="terminalSessions.length === 0" class="terminal-empty">
            <NIcon :component="TerminalOutline" :size="48" />
            <p>No terminals open</p>
            <NButton @click="createTerminal">
              <template #icon>
                <NIcon :component="AddOutline" />
              </template>
              Create Terminal
            </NButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.view-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color);
}

.tab-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-right: 8px;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.terminal-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color-1);
  background: var(--n-color-target);
  border-radius: 9px;
}

.terminal-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.chat-container,
.terminal-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.terminal-tabs {
  flex-shrink: 0;
  padding: 4px 8px 0;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
}

.terminal-instances {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.terminal-instance {
  position: absolute;
  inset: 0;
  padding: 8px;
}

.terminal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--n-text-color-3);
}

.terminal-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
