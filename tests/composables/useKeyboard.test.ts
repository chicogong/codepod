import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { getShortcutDescriptions } from '@/composables/useKeyboard'

describe('useKeyboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getShortcutDescriptions', () => {
    it('returns list of shortcuts', () => {
      const shortcuts = getShortcutDescriptions()

      expect(shortcuts.length).toBeGreaterThan(0)
      expect(shortcuts.some(s => s.description === 'New chat')).toBe(true)
      expect(shortcuts.some(s => s.description === 'Toggle dark mode')).toBe(
        true
      )
      expect(shortcuts.some(s => s.description === 'Toggle sidebar')).toBe(true)
    })

    it('shortcuts have key and description', () => {
      const shortcuts = getShortcutDescriptions()

      for (const shortcut of shortcuts) {
        expect(shortcut.key).toBeTruthy()
        expect(shortcut.description).toBeTruthy()
      }
    })
  })
})
