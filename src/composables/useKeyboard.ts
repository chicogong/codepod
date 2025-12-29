import { onMounted, onUnmounted, ref } from 'vue'
import { useAppStore, useChatStore } from '@/stores'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean // Cmd on Mac
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  // Allow in input fields (default: false, except Escape)
  allowInInput?: boolean
}

// Global state for command palette
export const showCommandPalette = ref(false)
export const showSessionSearch = ref(false)
export const showModelSelector = ref(false)

export function useKeyboard(customShortcuts: KeyboardShortcut[] = []) {
  const appStore = useAppStore()
  const chatStore = useChatStore()

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    // Command Palette (Cmd/Ctrl + K)
    {
      key: 'k',
      meta: true,
      action: () => {
        showCommandPalette.value = true
      },
      description: 'Open command palette',
      allowInInput: true,
    },
    {
      key: 'k',
      ctrl: true,
      action: () => {
        showCommandPalette.value = true
      },
      description: 'Open command palette',
      allowInInput: true,
    },
    // New chat (Cmd/Ctrl + N)
    {
      key: 'n',
      meta: true,
      action: () => chatStore.clearMessages(),
      description: 'New chat',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => chatStore.clearMessages(),
      description: 'New chat',
    },
    // Clear chat (Cmd/Ctrl + L)
    {
      key: 'l',
      meta: true,
      action: () => chatStore.clearMessages(),
      description: 'Clear current chat',
    },
    {
      key: 'l',
      ctrl: true,
      action: () => chatStore.clearMessages(),
      description: 'Clear current chat',
    },
    // Toggle dark mode (Cmd/Ctrl + D)
    {
      key: 'd',
      meta: true,
      action: () => appStore.toggleDarkMode(),
      description: 'Toggle dark mode',
    },
    {
      key: 'd',
      ctrl: true,
      action: () => appStore.toggleDarkMode(),
      description: 'Toggle dark mode',
    },
    // Toggle sidebar (Cmd/Ctrl + B)
    {
      key: 'b',
      meta: true,
      action: () => appStore.toggleSidebar(),
      description: 'Toggle sidebar',
    },
    {
      key: 'b',
      ctrl: true,
      action: () => appStore.toggleSidebar(),
      description: 'Toggle sidebar',
    },
    // Cross-session search (Cmd/Ctrl + Shift + F)
    {
      key: 'f',
      meta: true,
      shift: true,
      action: () => {
        showSessionSearch.value = true
      },
      description: 'Search all sessions',
      allowInInput: true,
    },
    {
      key: 'f',
      ctrl: true,
      shift: true,
      action: () => {
        showSessionSearch.value = true
      },
      description: 'Search all sessions',
      allowInInput: true,
    },
    // Switch model (Cmd/Ctrl + /)
    {
      key: '/',
      meta: true,
      action: () => {
        showModelSelector.value = true
      },
      description: 'Switch model',
      allowInInput: true,
    },
    {
      key: '/',
      ctrl: true,
      action: () => {
        showModelSelector.value = true
      },
      description: 'Switch model',
      allowInInput: true,
    },
    // Escape - close modals
    {
      key: 'Escape',
      action: () => {
        if (showCommandPalette.value) {
          showCommandPalette.value = false
        } else if (showSessionSearch.value) {
          showSessionSearch.value = false
        } else if (showModelSelector.value) {
          showModelSelector.value = false
        }
      },
      description: 'Close modal',
      allowInInput: true,
    },
  ]

  const shortcuts = [...defaultShortcuts, ...customShortcuts]

  function handleKeyDown(event: KeyboardEvent) {
    // Check if typing in input
    const target = event.target as HTMLElement
    const isInInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    for (const shortcut of shortcuts) {
      // Skip if in input and shortcut doesn't allow it
      if (isInInput && !shortcut.allowInInput) {
        continue
      }

      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      // For shortcuts that can use either Ctrl or Meta (Cmd)
      const modifierMatch =
        (shortcut.meta && event.metaKey) || (shortcut.ctrl && event.ctrlKey)

      // For shortcuts without modifiers (like Escape)
      const noModifierShortcut = !shortcut.meta && !shortcut.ctrl

      if (
        keyMatch &&
        (modifierMatch || (noModifierShortcut && metaMatch && ctrlMatch)) &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcuts,
    showCommandPalette,
    showSessionSearch,
    showModelSelector,
  }
}

// Export shortcut descriptions for help display
export function getShortcutDescriptions(): {
  key: string
  description: string
}[] {
  return [
    { key: '⌘/Ctrl + K', description: 'Command palette' },
    { key: '⌘/Ctrl + N', description: 'New chat' },
    { key: '⌘/Ctrl + L', description: 'Clear chat' },
    { key: '⌘/Ctrl + D', description: 'Toggle dark mode' },
    { key: '⌘/Ctrl + B', description: 'Toggle sidebar' },
    { key: '⌘/Ctrl + F', description: 'Search messages' },
    { key: '⌘/Ctrl + Shift + F', description: 'Search all sessions' },
    { key: '⌘/Ctrl + /', description: 'Switch model' },
    { key: 'Enter', description: 'Send message' },
    { key: 'Shift + Enter', description: 'New line' },
    { key: 'Escape', description: 'Close modal' },
  ]
}
