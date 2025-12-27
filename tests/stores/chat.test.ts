import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have empty messages', () => {
      const store = useChatStore()
      expect(store.messages).toHaveLength(0)
    })

    it('should not be streaming', () => {
      const store = useChatStore()
      expect(store.isStreaming).toBe(false)
    })

    it('should have default model', () => {
      const store = useChatStore()
      expect(store.currentModel).toBe('claude-4.5')
    })

    it('should have no error', () => {
      const store = useChatStore()
      expect(store.error).toBeNull()
    })
  })

  describe('addUserMessage', () => {
    it('should add a user message', () => {
      const store = useChatStore()
      const message = store.addUserMessage('Hello, Claude!')

      expect(store.messages).toHaveLength(1)
      expect(message.role).toBe('user')
      expect(message.content[0]).toEqual({
        type: 'text',
        text: 'Hello, Claude!',
      })
    })

    it('should link messages with parentUuid', () => {
      const store = useChatStore()
      const first = store.addUserMessage('First message')
      const second = store.addUserMessage('Second message')

      expect(second.parentUuid).toBe(first.uuid)
    })
  })

  describe('addAssistantMessage', () => {
    it('should add an assistant message', () => {
      const store = useChatStore()
      const message = store.addAssistantMessage([
        { type: 'text', text: 'Hello! How can I help?' },
      ])

      expect(store.messages).toHaveLength(1)
      expect(message.role).toBe('assistant')
      expect(message.model).toBe(store.currentModel)
    })
  })

  describe('streaming', () => {
    it('should start streaming', () => {
      const store = useChatStore()
      store.startStreaming()

      expect(store.isStreaming).toBe(true)
      expect(store.streamingContent).toHaveLength(0)
      expect(store.error).toBeNull()
    })

    it('should append to streaming content', () => {
      const store = useChatStore()
      store.startStreaming()
      store.appendToStreamingContent({ type: 'text', text: 'Hello' })
      store.appendToStreamingContent({ type: 'text', text: ' World' })

      expect(store.streamingContent).toHaveLength(1)
      expect(store.streamingContent[0]).toEqual({
        type: 'text',
        text: 'Hello World',
      })
    })

    it('should finalize streaming', () => {
      const store = useChatStore()
      store.startStreaming()
      store.appendToStreamingContent({ type: 'text', text: 'Response' })
      store.finalizeStreaming()

      expect(store.isStreaming).toBe(false)
      expect(store.streamingContent).toHaveLength(0)
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].role).toBe('assistant')
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const store = useChatStore()
      store.addUserMessage('Test')
      store.clearMessages()

      expect(store.messages).toHaveLength(0)
      expect(store.currentSessionId).toBeNull()
    })
  })

  describe('setModel', () => {
    it('should change the current model', () => {
      const store = useChatStore()
      store.setModel('claude-opus-4.5')

      expect(store.currentModel).toBe('claude-opus-4.5')
    })
  })

  describe('setError', () => {
    it('should set error and stop streaming', () => {
      const store = useChatStore()
      store.startStreaming()
      store.setError('Something went wrong')

      expect(store.error).toBe('Something went wrong')
      expect(store.isStreaming).toBe(false)
    })
  })

  describe('getters', () => {
    it('should return last message', () => {
      const store = useChatStore()
      store.addUserMessage('First')
      store.addUserMessage('Second')

      expect(store.lastMessage?.content[0]).toEqual({
        type: 'text',
        text: 'Second',
      })
    })

    it('should return message count', () => {
      const store = useChatStore()
      store.addUserMessage('One')
      store.addUserMessage('Two')

      expect(store.messageCount).toBe(2)
    })

    it('should return hasMessages correctly', () => {
      const store = useChatStore()
      expect(store.hasMessages).toBe(false)

      store.addUserMessage('Test')
      expect(store.hasMessages).toBe(true)
    })
  })
})
