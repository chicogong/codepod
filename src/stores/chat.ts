import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ContentBlock, ModelId } from '@/types'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentModel = ref<ModelId>('claude-sonnet-4-20250514')
  const currentSessionId = ref<string | null>(null)
  const streamingContent = ref<ContentBlock[]>([])
  const error = ref<string | null>(null)

  // Getters
  const lastMessage = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  )

  const messageCount = computed(() => messages.value.length)

  const hasMessages = computed(() => messages.value.length > 0)

  // Actions
  function addUserMessage(content: string): Message {
    const message: Message = {
      uuid: crypto.randomUUID(),
      parentUuid: lastMessage.value?.uuid ?? null,
      role: 'user',
      content: [{ type: 'text', text: content }],
      timestamp: new Date(),
    }
    messages.value.push(message)
    return message
  }

  function addAssistantMessage(content: ContentBlock[]): Message {
    const message: Message = {
      uuid: crypto.randomUUID(),
      parentUuid: lastMessage.value?.uuid ?? null,
      role: 'assistant',
      content,
      timestamp: new Date(),
      model: currentModel.value,
    }
    messages.value.push(message)
    return message
  }

  function appendToStreamingContent(block: ContentBlock) {
    const lastBlock = streamingContent.value[streamingContent.value.length - 1]

    if (block.type === 'text' && lastBlock?.type === 'text') {
      // Append to existing text block
      lastBlock.text += block.text
    } else {
      streamingContent.value.push(block)
    }
  }

  function finalizeStreaming() {
    if (streamingContent.value.length > 0) {
      addAssistantMessage([...streamingContent.value])
      streamingContent.value = []
    }
    isStreaming.value = false
  }

  function startStreaming() {
    isStreaming.value = true
    streamingContent.value = []
    error.value = null
  }

  function setError(message: string) {
    error.value = message
    isStreaming.value = false
  }

  function clearMessages() {
    messages.value = []
    currentSessionId.value = null
    streamingContent.value = []
    error.value = null
  }

  function setModel(model: ModelId) {
    currentModel.value = model
  }

  function loadSession(sessionId: string, sessionMessages: Message[]) {
    currentSessionId.value = sessionId
    messages.value = sessionMessages
    error.value = null
  }

  return {
    // State
    messages,
    isStreaming,
    currentModel,
    currentSessionId,
    streamingContent,
    error,

    // Getters
    lastMessage,
    messageCount,
    hasMessages,

    // Actions
    addUserMessage,
    addAssistantMessage,
    appendToStreamingContent,
    finalizeStreaming,
    startStreaming,
    setError,
    clearMessages,
    setModel,
    loadSession,
  }
})
