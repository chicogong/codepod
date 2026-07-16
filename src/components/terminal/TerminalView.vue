<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import { isTauri, safeInvoke, safeListen } from '@/utils'
import { NInput, NButton, NIcon, NButtonGroup } from 'naive-ui'
import {
  SearchOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  CloseOutline,
} from '@vicons/ionicons5'
import { useAppStore } from '@/stores'
import '@xterm/xterm/css/xterm.css'

const appStore = useAppStore()

import { themes } from '@/utils/terminalThemes'

// Current theme based on app store setting
const currentTheme = computed(() => {
  const themeId = appStore.terminalTheme || 'tokyo-night'
  return themes[themeId]?.theme || themes['tokyo-night']?.theme
})

const props = defineProps<{
  sessionId?: string
  cwd?: string
  autoConnect?: boolean
}>()

const emit = defineEmits<{
  connected: [sessionId: string]
  disconnected: []
  error: [message: string]
}>()

// Terminal container ref
const terminalContainer = ref<HTMLDivElement>()

// Terminal instance
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let searchAddon: SearchAddon | null = null

// Search state
const showSearch = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<InstanceType<typeof NInput> | null>(null)

function findNext() {
  if (!searchAddon || !searchQuery.value) return
  searchAddon.findNext(searchQuery.value)
}

function findPrev() {
  if (!searchAddon || !searchQuery.value) return
  searchAddon.findPrevious(searchQuery.value)
}

function closeSearch() {
  showSearch.value = false
  terminal?.focus()
}

function onSearchInputKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) {
      findPrev()
    } else {
      findNext()
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closeSearch()
  }
}

// State
const isConnected = ref(false)
const currentSessionId = ref<string | null>(null)

// Tauri event unlisten functions
let unlistenOutput: (() => void) | null = null
let unlistenExit: (() => void) | null = null

// Initialize terminal
async function initTerminal() {
  if (!terminalContainer.value) return

  // Create terminal with modern settings
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 14,
    fontFamily:
      '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
    theme: currentTheme.value,
    allowTransparency: true,
    scrollback: 10000,
    tabStopWidth: 4,
  })

  // Add fit addon
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  // Add web links addon
  terminal.loadAddon(new WebLinksAddon())

  // Add search addon
  searchAddon = new SearchAddon()
  terminal.loadAddon(searchAddon)

  // Handle Ctrl/Cmd+F for search
  terminal.attachCustomKeyEventHandler(e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      if (e.type === 'keydown') {
        e.preventDefault()
        showSearch.value = true
        nextTick(() => searchInputRef.value?.focus())
      }
      return false
    }
    return true
  })

  // Open terminal in container
  terminal.open(terminalContainer.value)

  // Fit to container
  await nextTick()
  fitAddon.fit()

  // Handle user input
  terminal.onData(data => {
    if (currentSessionId.value) {
      sendInput(data)
    }
  })

  // Auto connect if enabled
  if (props.autoConnect) {
    await connectPty()
  }
}

// Connect to PTY backend
async function connectPty() {
  if (isConnected.value) return

  // Check if running in Tauri
  if (!isTauri()) {
    // In browser mode, show a friendly message and mark as "connected" to hide overlay
    terminal?.writeln('')
    terminal?.writeln('\x1b[1;33m  ⚠ Terminal - Browser Mode\x1b[0m')
    terminal?.writeln('')
    terminal?.writeln(
      '\x1b[90m  Terminal PTY requires the Tauri native environment.\x1b[0m'
    )
    terminal?.writeln('')
    terminal?.writeln('\x1b[32m  To use terminal features, run:\x1b[0m')
    terminal?.writeln('\x1b[37m    $ npm run tauri:dev\x1b[0m')
    terminal?.writeln('')
    terminal?.writeln(
      '\x1b[90m  Meanwhile, you can use the Chat view to interact\x1b[0m'
    )
    terminal?.writeln('\x1b[90m  with Claude via HTTP API.\x1b[0m')
    terminal?.writeln('')

    // Mark as connected to hide the overlay
    isConnected.value = true
    return
  }

  try {
    // Get terminal dimensions
    const cols = terminal?.cols || 80
    const rows = terminal?.rows || 24

    // Create Claude PTY session
    const sessionId = await safeInvoke<string>('create_claude_pty', {
      cwd: props.cwd,
      resumeSession: props.sessionId,
      cols,
      rows,
    })

    currentSessionId.value = sessionId
    isConnected.value = true

    // Listen for PTY output
    unlistenOutput = await safeListen<{ session_id: string; data: string }>(
      'pty-output',
      event => {
        if (event.payload.session_id === currentSessionId.value) {
          terminal?.write(event.payload.data)
        }
      }
    )

    // Listen for PTY exit
    unlistenExit = await safeListen<{
      session_id: string
      exit_code: number | null
    }>('pty-exit', event => {
      if (event.payload.session_id === currentSessionId.value) {
        terminal?.writeln(
          `\r\n\x1b[33m[Process exited with code: ${event.payload.exit_code ?? 'unknown'}]\x1b[0m`
        )
        isConnected.value = false
        currentSessionId.value = null
        emit('disconnected')
      }
    })

    emit('connected', sessionId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    emit('error', message)
    terminal?.writeln(`\x1b[31mError: ${message}\x1b[0m`)
  }
}

// Send input to PTY
async function sendInput(data: string) {
  if (!currentSessionId.value || !isTauri()) return

  try {
    await safeInvoke('write_to_pty', {
      sessionId: currentSessionId.value,
      data,
    })
  } catch (error) {
    console.error('Failed to send input:', error)
  }
}

// Resize PTY
async function resizePty() {
  if (!currentSessionId.value || !terminal || !isTauri()) return

  try {
    await safeInvoke('resize_pty', {
      sessionId: currentSessionId.value,
      cols: terminal.cols,
      rows: terminal.rows,
    })
  } catch (error) {
    console.error('Failed to resize PTY:', error)
  }
}

// Handle container resize
function handleResize() {
  if (fitAddon && terminal) {
    fitAddon.fit()
    resizePty()
  }
}

// Disconnect from PTY
async function disconnect() {
  if (!currentSessionId.value || !isTauri()) return

  try {
    await safeInvoke('close_pty_session', {
      sessionId: currentSessionId.value,
    })
  } catch (error) {
    console.error('Failed to close PTY:', error)
  }

  cleanup()
}

// Cleanup
function cleanup() {
  unlistenOutput?.()
  unlistenExit?.()
  unlistenOutput = null
  unlistenExit = null
  isConnected.value = false
  currentSessionId.value = null
}

// Focus terminal
function focus() {
  terminal?.focus()
}

// Clear terminal
function clear() {
  terminal?.clear()
}

// Expose methods
defineExpose({
  connect: connectPty,
  disconnect,
  focus,
  clear,
  isConnected,
  sessionId: currentSessionId,
})

// Watch for cwd changes
watch(
  () => props.cwd,
  async newCwd => {
    if (isConnected.value && newCwd) {
      // Optionally reconnect with new cwd
    }
  }
)

// Watch for theme changes
watch(
  () => appStore.terminalTheme,
  () => {
    if (terminal) {
      terminal.options.theme = currentTheme.value
    }
  }
)

// Lifecycle
onMounted(() => {
  initTerminal()

  // Add resize observer
  const observer = new (window as typeof globalThis).ResizeObserver(
    handleResize
  )
  if (terminalContainer.value) {
    observer.observe(terminalContainer.value)
  }

  // Cleanup observer on unmount
  onUnmounted(() => {
    observer.disconnect()
    disconnect()
    terminal?.dispose()
  })
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="terminal-wrapper">
    <div ref="terminalContainer" class="terminal-container" @click="focus" />

    <!-- Connection status overlay -->
    <div v-if="!isConnected" class="connection-overlay">
      <div class="connection-message">
        <div class="spinner" />
        <span>Connecting to Claude...</span>
      </div>
    </div>

    <!-- Search Bar -->
    <div v-if="showSearch" class="search-bar">
      <n-input
        ref="searchInputRef"
        v-model:value="searchQuery"
        placeholder="Search terminal..."
        size="small"
        clearable
        @keydown="onSearchInputKeyDown"
        @input="findNext"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
      <n-button-group size="small">
        <n-button ghost @click="findPrev">
          <template #icon>
            <n-icon><ArrowUpOutline /></n-icon>
          </template>
        </n-button>
        <n-button ghost @click="findNext">
          <template #icon>
            <n-icon><ArrowDownOutline /></n-icon>
          </template>
        </n-button>
      </n-button-group>
      <n-button size="small" text style="margin-left: 8px" @click="closeSearch">
        <template #icon>
          <n-icon><CloseOutline /></n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.terminal-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* Dark mode background */
:global(.dark) .terminal-wrapper {
  background: #1a1b26;
}

/* Light mode background */
:global(:not(.dark)) .terminal-wrapper {
  background: #fafafa;
}

.terminal-container {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.terminal-container :deep(.xterm) {
  height: 100%;
}

.terminal-container :deep(.xterm-viewport) {
  overflow-y: auto !important;
}

.terminal-container :deep(.xterm-screen) {
  height: 100%;
}

.connection-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

:global(.dark) .connection-overlay {
  background: rgba(26, 27, 38, 0.9);
}

:global(:not(.dark)) .connection-overlay {
  background: rgba(250, 250, 250, 0.9);
}

.connection-message {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

:global(.dark) .connection-message {
  color: #a9b1d6;
}

:global(:not(.dark)) .connection-message {
  color: #383a42;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

:global(.dark) .spinner {
  border-color: #414868;
  border-top-color: #7aa2f7;
}

:global(:not(.dark)) .spinner {
  border-color: #d0d0d0;
  border-top-color: #4078f2;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.search-bar {
  position: absolute;
  top: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow:
    0 10px 30px -5px rgba(0, 0, 0, 0.2),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  animation: slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDownFade {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

:global(.dark) .search-bar {
  background: rgba(30, 32, 48, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

:global(:not(.dark)) .search-bar {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
