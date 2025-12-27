import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ContentBlock, ModelId } from '@/types'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentModel = ref<ModelId>('claude-4.5')
  const currentSessionId = ref<string | null>(null)
  const streamingContent = ref<ContentBlock[]>([])
  const error = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)
  const lastUserMessage = ref<string | null>(null)

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

  // 创建 AbortController 用于中断请求
  function createAbortController(): AbortController {
    abortController.value = new AbortController()
    return abortController.value
  }

  // 停止流式生成
  function stopStreaming() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    // 保留已生成的内容
    if (streamingContent.value.length > 0) {
      addAssistantMessage([...streamingContent.value])
      streamingContent.value = []
    }
    isStreaming.value = false
  }

  // 记录最后的用户消息（用于重新生成）
  function setLastUserMessage(content: string) {
    lastUserMessage.value = content
  }

  // 移除最后一条 assistant 消息（用于重新生成）
  function removeLastAssistantMessage() {
    const lastMsg = messages.value[messages.value.length - 1]
    if (messages.value.length > 0 && lastMsg && lastMsg.role === 'assistant') {
      messages.value.pop()
    }
  }

  return {
    // State
    messages,
    isStreaming,
    currentModel,
    currentSessionId,
    streamingContent,
    error,
    abortController,
    lastUserMessage,

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
    createAbortController,
    stopStreaming,
    setLastUserMessage,
    removeLastAssistantMessage,
  }
})
