import { onMounted, onUnmounted } from 'vue'
import { useAppStore, useChatStore } from '@/stores'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean // Cmd on Mac
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboard(customShortcuts: KeyboardShortcut[] = []) {
  const appStore = useAppStore()
  const chatStore = useChatStore()

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
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
  ]

  const shortcuts = [...defaultShortcuts, ...customShortcuts]

  function handleKeyDown(event: KeyboardEvent) {
    // Ignore if typing in input
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Only allow Escape in inputs
      if (event.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      // For shortcuts that can use either Ctrl or Meta (Cmd)
      const modifierMatch =
        (shortcut.meta && event.metaKey) || (shortcut.ctrl && event.ctrlKey)

      if (
        keyMatch &&
        (modifierMatch || (metaMatch && ctrlMatch)) &&
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
  }
}

// Export shortcut descriptions for help display
export function getShortcutDescriptions(): {
  key: string
  description: string
}[] {
  return [
    { key: '⌘/Ctrl + N', description: 'New chat' },
    { key: '⌘/Ctrl + D', description: 'Toggle dark mode' },
    { key: '⌘/Ctrl + B', description: 'Toggle sidebar' },
    { key: '⌘/Ctrl + K', description: 'Search messages' },
    { key: 'Enter', description: 'Send message' },
    { key: 'Shift + Enter', description: 'New line' },
  ]
}
