<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Terminal, type ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { isTauri, safeInvoke, safeListen } from '@/utils'
import { useAppStore } from '@/stores'
import '@xterm/xterm/css/xterm.css'

const appStore = useAppStore()

// Theme definitions
const darkTheme: ITheme = {
  background: '#1a1b26',
  foreground: '#a9b1d6',
  cursor: '#c0caf5',
  cursorAccent: '#1a1b26',
  selectionBackground: '#33467c',
  selectionForeground: '#c0caf5',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#f7768e',
  brightGreen: '#9ece6a',
  brightYellow: '#e0af68',
  brightBlue: '#7aa2f7',
  brightMagenta: '#bb9af7',
  brightCyan: '#7dcfff',
  brightWhite: '#c0caf5',
}

const lightTheme: ITheme = {
  background: '#fafafa',
  foreground: '#383a42',
  cursor: '#526fff',
  cursorAccent: '#fafafa',
  selectionBackground: '#d7d7ff',
  selectionForeground: '#383a42',
  black: '#383a42',
  red: '#e45649',
  green: '#50a14f',
  yellow: '#c18401',
  blue: '#4078f2',
  magenta: '#a626a4',
  cyan: '#0184bc',
  white: '#a0a1a7',
  brightBlack: '#696c77',
  brightRed: '#e45649',
  brightGreen: '#50a14f',
  brightYellow: '#c18401',
  brightBlue: '#4078f2',
  brightMagenta: '#a626a4',
  brightCyan: '#0184bc',
  brightWhite: '#fafafa',
}

// Current theme based on dark mode
const currentTheme = computed(() =>
  appStore.isDarkMode ? darkTheme : lightTheme
)

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
  () => appStore.isDarkMode,
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
</style>
