import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useClaude } from '@/composables/useClaude'
import { useChatStore } from '@/stores'

describe('useClaude', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('checkClaude', () => {
    it('returns true and sets version when CLI is available', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: true,
        data: 'claude 1.0.0',
      })

      const { checkClaude, isInitialized, claudeVersion } = useClaude()
      const result = await checkClaude()

      expect(result).toBe(true)
      expect(isInitialized.value).toBe(true)
      expect(claudeVersion.value).toBe('claude 1.0.0')
      expect(invoke).toHaveBeenCalledWith('get_claude_version')
    })

    it('returns false when CLI is not available', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: false,
        error: 'Claude CLI not found',
      })

      const { checkClaude, isInitialized } = useClaude()
      const result = await checkClaude()

      expect(result).toBe(false)
      expect(isInitialized.value).toBe(false)
    })

    it('returns false on error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Network error'))

      const { checkClaude, isInitialized } = useClaude()
      const result = await checkClaude()

      expect(result).toBe(false)
      expect(isInitialized.value).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('does nothing for empty content', async () => {
      const { sendMessage } = useClaude()
      const chatStore = useChatStore()

      await sendMessage('')
      await sendMessage('   ')

      expect(chatStore.messages).toHaveLength(0)
      expect(invoke).not.toHaveBeenCalled()
    })

    it('does nothing when already streaming', async () => {
      const { sendMessage } = useClaude()
      const chatStore = useChatStore()
      chatStore.startStreaming()

      await sendMessage('Hello')

      expect(chatStore.messages).toHaveLength(0)
    })

    it('adds user message and starts streaming', async () => {
      vi.mocked(listen).mockResolvedValue(() => {})
      vi.mocked(invoke).mockResolvedValue({ success: true })

      const { sendMessage } = useClaude()
      const chatStore = useChatStore()

      await sendMessage('Hello Claude')

      expect(chatStore.messages).toHaveLength(1)
      expect(chatStore.messages[0].role).toBe('user')
      expect(chatStore.messages[0].content[0]).toEqual({
        type: 'text',
        text: 'Hello Claude',
      })
    })

    it('sets error on invoke failure', async () => {
      vi.mocked(listen).mockResolvedValue(() => {})
      vi.mocked(invoke).mockResolvedValue({
        success: false,
        error: 'Failed to spawn Claude',
      })

      const { sendMessage } = useClaude()
      const chatStore = useChatStore()

      await sendMessage('Hello')

      expect(chatStore.error).toBe('Failed to spawn Claude')
    })
  })
})
