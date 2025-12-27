import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Tauri APIs - need to mock BEFORE importing useClaude
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}))

// Mock claudeHttpService
vi.mock('@/services/claudeHttp', () => ({
  claudeHttpService: {
    checkHealth: vi.fn().mockResolvedValue(false),
    sendMessageStream: vi.fn(),
    setConfig: vi.fn(),
  },
}))

import { invoke } from '@tauri-apps/api/core'
import { useClaude } from '@/composables/useClaude'
import { useChatStore } from '@/stores'
import { claudeHttpService } from '@/services/claudeHttp'

describe('useClaude', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('checkClaude', () => {
    it('returns true and sets version when Tauri is available', async () => {
      // Mock window.__TAURI__ to simulate Tauri environment
      const originalWindow = global.window
      // @ts-expect-error - mocking window
      global.window = { __TAURI__: {} }

      vi.mocked(invoke).mockResolvedValue({
        success: true,
        data: 'claude 1.0.0',
      })

      const { checkClaude, isInitialized, claudeVersion, connectionMode } =
        useClaude()
      const result = await checkClaude()

      expect(result).toBe(true)
      expect(isInitialized.value).toBe(true)
      expect(claudeVersion.value).toBe('claude 1.0.0')
      expect(connectionMode.value).toBe('tauri')

      global.window = originalWindow
    })

    it('returns true when HTTP API is available (non-Tauri)', async () => {
      vi.mocked(claudeHttpService.checkHealth).mockResolvedValue(true)

      const { checkClaude, isInitialized, connectionMode } = useClaude()
      const result = await checkClaude()

      expect(result).toBe(true)
      expect(isInitialized.value).toBe(true)
      expect(connectionMode.value).toBe('http')
    })

    it('returns false when neither Tauri nor HTTP API is available', async () => {
      vi.mocked(claudeHttpService.checkHealth).mockResolvedValue(false)

      const { checkClaude, isInitialized, connectionMode } = useClaude()
      const result = await checkClaude()

      expect(result).toBe(false)
      expect(isInitialized.value).toBe(false)
      expect(connectionMode.value).toBe('none')
    })
  })

  describe('sendMessage', () => {
    it('does nothing for empty content', async () => {
      const { sendMessage } = useClaude()
      const chatStore = useChatStore()

      await sendMessage('')
      await sendMessage('   ')

      expect(chatStore.messages).toHaveLength(0)
    })

    it('does nothing when already streaming', async () => {
      const { sendMessage } = useClaude()
      const chatStore = useChatStore()
      chatStore.startStreaming()

      await sendMessage('Hello')

      expect(chatStore.messages).toHaveLength(0)
    })

    it('adds user message and handles no connection', async () => {
      const { sendMessage } = useClaude()
      const chatStore = useChatStore()

      await sendMessage('Hello Claude')

      // User message is added
      expect(chatStore.messages.length).toBeGreaterThanOrEqual(1)
      expect(chatStore.messages[0].role).toBe('user')
      expect(chatStore.messages[0].content[0]).toEqual({
        type: 'text',
        text: 'Hello Claude',
      })

      // Error is set because no connection
      expect(chatStore.error).toBe(
        'Claude not connected. Please start the HTTP API server or run in Tauri.'
      )
    })
  })

  describe('stopGeneration', () => {
    it('calls chatStore.stopStreaming', () => {
      const { stopGeneration } = useClaude()
      const chatStore = useChatStore()

      // Start streaming first
      chatStore.startStreaming()
      expect(chatStore.isStreaming).toBe(true)

      stopGeneration()

      expect(chatStore.isStreaming).toBe(false)
    })
  })

  describe('regenerateMessage', () => {
    it('does nothing if no last user message', async () => {
      const { regenerateMessage } = useClaude()
      const chatStore = useChatStore()

      await regenerateMessage()

      expect(chatStore.messages).toHaveLength(0)
    })

    it('removes last assistant message and resends', async () => {
      const { regenerateMessage } = useClaude()
      const chatStore = useChatStore()

      // Add user message
      chatStore.addUserMessage('Hello')
      chatStore.setLastUserMessage('Hello')

      // Add assistant message
      chatStore.addAssistantMessage([{ type: 'text', text: 'Hi there!' }])

      expect(chatStore.messages).toHaveLength(2)

      // Regenerate
      await regenerateMessage()

      // Assistant message was removed, then new user message added (error flow adds assistant error)
      expect(chatStore.messages.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('setHttpApiUrl', () => {
    it('updates the HTTP API URL', () => {
      const { setHttpApiUrl, httpApiUrl } = useClaude()

      setHttpApiUrl('http://localhost:4000')

      expect(httpApiUrl.value).toBe('http://localhost:4000')
      expect(claudeHttpService.setConfig).toHaveBeenCalledWith({
        host: 'localhost',
        port: 4000,
      })
    })
  })
})
