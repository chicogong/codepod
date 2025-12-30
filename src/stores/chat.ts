import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { Message, ContentBlock, ModelId } from '@/types'
import { useSessionStore } from './session'
import { useAppStore } from './app'

// Token statistics interface
export interface TokenStats {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
}

// Pricing per 1M tokens (approximate)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-4.5': { input: 3.0, output: 15.0 },
  'claude-4-opus': { input: 15.0, output: 75.0 },
  'claude-4-sonnet': { input: 3.0, output: 15.0 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3.5-haiku': { input: 0.8, output: 4.0 },
}

// 防抖保存的定时器
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 1000 // 1秒防抖

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentModel = ref<ModelId>('claude-4.5')
  const currentSessionId = ref<string | null>(null)
  // 使用 shallowRef 减少流式内容的响应式开销
  const streamingContent = shallowRef<ContentBlock[]>([])
  const error = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)
  const lastUserMessage = ref<string | null>(null)

  // Token tracking
  const sessionInputTokens = ref(0)
  const sessionOutputTokens = ref(0)

  // Auto-checkpoint tracking
  const lastAutoCheckpointMessageCount = ref(0)

  // Getters
  const lastMessage = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  )

  const messageCount = computed(() => messages.value.length)

  const hasMessages = computed(() => messages.value.length > 0)

  // Token statistics getter
  const tokenStats = computed<TokenStats>(() => {
    const totalTokens = sessionInputTokens.value + sessionOutputTokens.value
    const pricing =
      MODEL_PRICING[currentModel.value] || MODEL_PRICING['claude-4.5']
    const estimatedCost =
      (sessionInputTokens.value / 1_000_000) * (pricing?.input || 3) +
      (sessionOutputTokens.value / 1_000_000) * (pricing?.output || 15)

    return {
      inputTokens: sessionInputTokens.value,
      outputTokens: sessionOutputTokens.value,
      totalTokens,
      estimatedCost,
    }
  })

  // Auto-save messages when they change (with debounce)
  function saveCurrentSession() {
    if (currentSessionId.value && messages.value.length > 0) {
      // 清除之前的定时器
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
      }
      // 设置新的防抖定时器
      saveDebounceTimer = setTimeout(() => {
        const sessionStore = useSessionStore()
        sessionStore.saveMessages(currentSessionId.value!, messages.value)
        // Update session metadata
        sessionStore.updateSession(currentSessionId.value!, {
          messageCount: messages.value.length,
          updatedAt: new Date(),
        })
      }, SAVE_DEBOUNCE_MS)
    }
  }

  // 立即保存（用于关键操作如停止生成）
  function saveCurrentSessionNow() {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
      saveDebounceTimer = null
    }
    if (currentSessionId.value && messages.value.length > 0) {
      const sessionStore = useSessionStore()
      sessionStore.saveMessages(currentSessionId.value, messages.value)
      sessionStore.updateSession(currentSessionId.value, {
        messageCount: messages.value.length,
        updatedAt: new Date(),
      })
    }
  }

  // Auto-checkpoint logic
  function checkAndCreateAutoCheckpoint() {
    if (!currentSessionId.value || messages.value.length === 0) {
      return
    }

    const appStore = useAppStore()
    const config = appStore.autoCheckpointConfig

    if (!config.enabled) {
      return
    }

    const messagesSinceLastCheckpoint =
      messages.value.length - lastAutoCheckpointMessageCount.value

    if (messagesSinceLastCheckpoint >= config.messageInterval) {
      const sessionStore = useSessionStore()
      const checkpointNumber = Math.floor(
        messages.value.length / config.messageInterval
      )
      const checkpointName = `${config.namePrefix} ${checkpointNumber}`

      try {
        sessionStore.createCheckpoint(
          currentSessionId.value,
          checkpointName,
          messages.value,
          `在 ${messages.value.length} 条消息时自动创建`
        )
        lastAutoCheckpointMessageCount.value = messages.value.length
      } catch (error) {
        console.error('Failed to create auto-checkpoint:', error)
      }
    }
  }

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
    saveCurrentSession()
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
    saveCurrentSession()
    // Check if we should create an auto-checkpoint
    checkAndCreateAutoCheckpoint()
    return message
  }

  function appendToStreamingContent(block: ContentBlock) {
    const currentContent = streamingContent.value
    const lastBlock = currentContent[currentContent.length - 1]

    if (block.type === 'text' && lastBlock?.type === 'text') {
      // 直接修改最后一个块的文本，然后触发更新
      lastBlock.text += block.text
      // 使用 shallowRef 需要手动触发更新
      streamingContent.value = [...currentContent]
    } else {
      streamingContent.value = [...currentContent, block]
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
    // Reset token counters
    sessionInputTokens.value = 0
    sessionOutputTokens.value = 0
    // Reset auto-checkpoint counter
    lastAutoCheckpointMessageCount.value = 0
  }

  function setModel(model: ModelId) {
    currentModel.value = model
  }

  // Update token counts
  function addTokens(input: number, output: number) {
    sessionInputTokens.value += input
    sessionOutputTokens.value += output
  }

  // Reset token counts (for new session)
  function resetTokens() {
    sessionInputTokens.value = 0
    sessionOutputTokens.value = 0
  }

  // Set current session ID
  function setCurrentSessionId(sessionId: string) {
    currentSessionId.value = sessionId
  }

  function loadSession(sessionId: string, sessionMessages: Message[]) {
    currentSessionId.value = sessionId
    messages.value = sessionMessages
    error.value = null
    // Reset auto-checkpoint counter for loaded session
    lastAutoCheckpointMessageCount.value = 0
  }

  function setMessages(newMessages: Message[]) {
    messages.value = newMessages
  }

  // Load session from storage
  function loadSessionFromStorage(sessionId: string) {
    const sessionStore = useSessionStore()
    const storedMessages = sessionStore.loadMessages(sessionId)
    loadSession(sessionId, storedMessages)
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
    // 立即保存
    saveCurrentSessionNow()
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
      saveCurrentSession()
    }
  }

  // 删除指定消息
  function deleteMessage(uuid: string) {
    const index = messages.value.findIndex(m => m.uuid === uuid)
    if (index > -1) {
      messages.value.splice(index, 1)
      saveCurrentSession()
    }
  }

  // 编辑消息内容
  function editMessage(uuid: string, newContent: string) {
    const message = messages.value.find(m => m.uuid === uuid)
    if (message && message.role === 'user') {
      message.content = [{ type: 'text', text: newContent }]
      message.timestamp = new Date()
      saveCurrentSession()
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
    sessionInputTokens,
    sessionOutputTokens,

    // Getters
    lastMessage,
    messageCount,
    hasMessages,
    tokenStats,

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
    setMessages,
    loadSessionFromStorage,
    createAbortController,
    stopStreaming,
    setLastUserMessage,
    removeLastAssistantMessage,
    deleteMessage,
    editMessage,
    saveCurrentSession,
    saveCurrentSessionNow,
    addTokens,
    resetTokens,
    setCurrentSessionId,
  }
})
