import { ref, computed } from 'vue'
import { useChatStore, useAppStore, useUsageStore } from '@/stores'
import type { ClaudeOptions, ContentBlock } from '@/types'
import { claudeHttpService, type StreamMessage } from '@/services/claudeHttp'

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface StreamEvent {
  event_type: string
  data: Record<string, unknown>
}

// 连接模式
export type ConnectionMode = 'tauri' | 'http' | 'none'

// 全局共享状态（在模块级别定义，所有组件共享）
const isInitialized = ref(false)
const claudeVersion = ref<string | null>(null)
const connectionMode = ref<ConnectionMode>('none')
const httpApiUrl = ref('http://127.0.0.1:3002')

export function useClaude() {
  const chatStore = useChatStore()
  const appStore = useAppStore()
  const usageStore = useUsageStore()

  // 计算属性：是否可用
  const isAvailable = computed(() => connectionMode.value !== 'none')

  /**
   * 检查 Claude 可用性（优先 Tauri，其次 HTTP API）
   */
  async function checkClaude(): Promise<boolean> {
    // 1. 首先尝试 Tauri 模式
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<CommandResult<string>>('get_claude_version')
        if (result.success && result.data) {
          claudeVersion.value = result.data
          isInitialized.value = true
          connectionMode.value = 'tauri'
          console.log('[Claude] Connected via Tauri IPC:', result.data)
          return true
        }
      } catch (e) {
        console.log('[Claude] Tauri IPC not available:', e)
      }
    }

    // 2. 尝试 HTTP API 模式
    try {
      const isHealthy = await claudeHttpService.checkHealth()
      if (isHealthy) {
        claudeVersion.value = 'HTTP API'
        isInitialized.value = true
        connectionMode.value = 'http'
        console.log('[Claude] Connected via HTTP API')
        return true
      }
    } catch (e) {
      console.log('[Claude] HTTP API not available:', e)
    }

    // 3. 都不可用
    isInitialized.value = false
    connectionMode.value = 'none'
    return false
  }

  /**
   * 设置 HTTP API URL
   */
  function setHttpApiUrl(url: string) {
    httpApiUrl.value = url
    const urlObj = new URL(url)
    claudeHttpService.setConfig({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3000,
    })
  }

  /**
   * 发送消息
   */
  async function sendMessage(content: string): Promise<void> {
    console.log('[Claude] sendMessage called:', {
      content: content.substring(0, 50),
      isStreaming: chatStore.isStreaming,
      connectionMode: connectionMode.value,
      isInitialized: isInitialized.value,
    })

    if (!content.trim() || chatStore.isStreaming) {
      console.log('[Claude] sendMessage blocked:', {
        emptyContent: !content.trim(),
        isStreaming: chatStore.isStreaming,
      })
      return
    }

    // Add user message
    chatStore.addUserMessage(content)
    chatStore.setLastUserMessage(content) // 记录用于重新生成
    chatStore.startStreaming()

    const options: ClaudeOptions = {
      model: chatStore.currentModel,
      cwd: appStore.projectPath || undefined,
      continueSession: chatStore.hasMessages,
      sessionId: chatStore.currentSessionId || undefined,
    }

    console.log('[Claude] Sending with options:', options)

    try {
      if (connectionMode.value === 'tauri') {
        console.log('[Claude] Using Tauri mode')
        await sendMessageViaTauri(content, options)
      } else if (connectionMode.value === 'http') {
        console.log('[Claude] Using HTTP mode')
        await sendMessageViaHttp(content, options)
      } else {
        console.log('[Claude] No connection mode available')
        throw new Error(
          'Claude not connected. Please start the HTTP API server or run in Tauri.'
        )
      }
    } catch (error) {
      console.error('[Claude] Error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      chatStore.setError(message)
      chatStore.appendToStreamingContent({
        type: 'text',
        text: `Error: ${message}`,
      })
      chatStore.finalizeStreaming()
    }
  }

  /**
   * 通过 Tauri IPC 发送消息
   */
  async function sendMessageViaTauri(
    content: string,
    options: ClaudeOptions
  ): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    const { listen } = await import('@tauri-apps/api/event')

    const requestId = crypto.randomUUID()
    let unlisten: (() => void) | null = null

    try {
      unlisten = await listen<StreamEvent>(
        `claude-stream-${requestId}`,
        event => {
          const { event_type, data } = event.payload

          if (event_type === 'stream') {
            handleTauriStreamData(data)
          } else if (event_type === 'done') {
            chatStore.finalizeStreaming()
          }
        }
      )

      const result = await invoke<CommandResult<void>>('invoke_claude_stream', {
        prompt: content,
        requestId,
        options: {
          model: options.model,
          session_id: options.sessionId,
          continue_session: options.continueSession,
          cwd: options.cwd,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to invoke Claude')
      }
    } finally {
      if (unlisten) {
        setTimeout(() => unlisten?.(), 1000)
      }
    }
  }

  /**
   * 通过 HTTP API 发送消息
   */
  async function sendMessageViaHttp(
    content: string,
    options: ClaudeOptions
  ): Promise<void> {
    // 创建 AbortController 用于中断请求
    const controller = chatStore.createAbortController()

    await claudeHttpService.sendMessageStream(
      content,
      options,
      {
        onMessage: (message: StreamMessage) => {
          handleHttpStreamMessage(message)
        },
        onError: (error: Error) => {
          chatStore.setError(error.message)
          chatStore.appendToStreamingContent({
            type: 'text',
            text: `Error: ${error.message}`,
          })
          chatStore.finalizeStreaming()
        },
        onDone: () => {
          chatStore.finalizeStreaming()
        },
      },
      controller.signal // 传递 AbortSignal
    )
  }

  /**
   * 处理 Tauri 流数据
   */
  function handleTauriStreamData(data: Record<string, unknown>) {
    if ('text' in data && typeof data.text === 'string') {
      chatStore.appendToStreamingContent({
        type: 'text',
        text: data.text,
      })
    } else if ('type' in data) {
      const block = parseContentBlock(data)
      if (block) {
        chatStore.appendToStreamingContent(block)
      }
    } else if ('raw' in data && typeof data.raw === 'string') {
      chatStore.appendToStreamingContent({
        type: 'text',
        text: data.raw,
      })
    }
  }

  // 跟踪是否已通过流式事件接收到内容
  let hasReceivedStreamContent = false

  /**
   * 处理 HTTP 流消息
   */
  function handleHttpStreamMessage(message: StreamMessage) {
    // 处理不同类型的消息
    if (message.type === 'system') {
      if (message.subtype === 'init' && message.session_id) {
        // 可以保存 session_id 用于后续会话
        console.log('[Claude] Session ID:', message.session_id)
        // 重置流式内容标记
        hasReceivedStreamContent = false
      }
      return
    }

    // 处理流式事件 (stream_event) - 增量更新
    if (message.type === 'stream_event') {
      const event = (
        message as unknown as {
          event?: { type?: string; delta?: { type?: string; text?: string } }
        }
      ).event
      if (
        event?.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta.text
      ) {
        hasReceivedStreamContent = true
        chatStore.appendToStreamingContent({
          type: 'text',
          text: event.delta.text,
        })
      }
      return
    }

    // 只有在没有通过流式事件接收内容时，才处理 assistant 消息
    // 这避免了流式内容和完整消息的重复
    if (
      message.type === 'assistant' &&
      message.message &&
      !hasReceivedStreamContent
    ) {
      const content = message.message.content

      if (typeof content === 'string') {
        chatStore.appendToStreamingContent({
          type: 'text',
          text: content,
        })
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && 'text' in block) {
            chatStore.appendToStreamingContent({
              type: 'text',
              text: block.text,
            })
          } else {
            chatStore.appendToStreamingContent(block)
          }
        }
      }
    }

    if (message.type === 'result') {
      // 最终结果，记录统计信息
      console.log('[Claude] Result:', message)

      // 更新 token 统计
      if (message.usage) {
        const inputTokens = message.usage.input_tokens || 0
        const outputTokens = message.usage.output_tokens || 0
        chatStore.addTokens(inputTokens, outputTokens)
        console.log('[Claude] Token usage:', { inputTokens, outputTokens })

        // 记录到 usage store 进行持久化
        usageStore.loadRecords() // 确保已加载
        usageStore.addRecord(
          chatStore.currentModel,
          inputTokens,
          outputTokens,
          chatStore.currentSessionId || undefined,
          appStore.projectPath || undefined
        )
      }
    }
  }

  /**
   * 解析内容块
   */
  function parseContentBlock(
    data: Record<string, unknown>
  ): ContentBlock | null {
    const type = data.type as string

    switch (type) {
      case 'text':
        return {
          type: 'text',
          text: (data.text as string) || '',
        }
      case 'thinking':
        return {
          type: 'thinking',
          thinking: (data.thinking as string) || '',
        }
      case 'tool_use':
        return {
          type: 'tool_use',
          id: (data.id as string) || '',
          name: (data.name as string) || '',
          input: (data.input as Record<string, unknown>) || {},
        }
      case 'tool_result':
        return {
          type: 'tool_result',
          tool_use_id: (data.tool_use_id as string) || '',
          content: (data.content as string) || '',
          is_error: data.is_error as boolean,
        }
      default:
        return null
    }
  }

  /**
   * 重新连接
   */
  async function reconnect(): Promise<boolean> {
    isInitialized.value = false
    connectionMode.value = 'none'
    return checkClaude()
  }

  /**
   * 停止生成
   */
  function stopGeneration(): void {
    console.log('[Claude] Stopping generation')
    chatStore.stopStreaming()
  }

  /**
   * 重新生成最后一条消息
   */
  async function regenerateMessage(): Promise<void> {
    const lastContent = chatStore.lastUserMessage
    if (!lastContent) {
      console.log('[Claude] No last user message to regenerate')
      return
    }

    console.log('[Claude] Regenerating message:', lastContent.substring(0, 50))

    // 移除最后一条 assistant 消息
    chatStore.removeLastAssistantMessage()

    // 重新发送
    await sendMessage(lastContent)
  }

  return {
    // State
    isInitialized,
    claudeVersion,
    connectionMode,
    httpApiUrl,

    // Computed
    isAvailable,

    // Actions
    checkClaude,
    sendMessage,
    setHttpApiUrl,
    reconnect,
    stopGeneration,
    regenerateMessage,
  }
}
