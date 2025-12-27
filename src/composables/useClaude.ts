import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useChatStore, useAppStore } from '@/stores'
import type { ClaudeOptions, ContentBlock } from '@/types'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface StreamEvent {
  event_type: string
  data: Record<string, unknown>
}

export function useClaude() {
  const chatStore = useChatStore()
  const appStore = useAppStore()
  const isInitialized = ref(false)
  const claudeVersion = ref<string | null>(null)

  async function checkClaude(): Promise<boolean> {
    try {
      const result = await invoke<CommandResult<string>>('get_claude_version')
      if (result.success && result.data) {
        claudeVersion.value = result.data
        isInitialized.value = true
        return true
      }
      return false
    } catch {
      isInitialized.value = false
      return false
    }
  }

  async function sendMessage(content: string): Promise<void> {
    if (!content.trim() || chatStore.isStreaming) return

    // Add user message
    chatStore.addUserMessage(content)
    chatStore.startStreaming()

    const requestId = crypto.randomUUID()
    let unlisten: UnlistenFn | null = null

    try {
      // Set up event listener for streaming
      unlisten = await listen<StreamEvent>(
        `claude-stream-${requestId}`,
        event => {
          const { event_type, data } = event.payload

          if (event_type === 'stream') {
            handleStreamData(data)
          } else if (event_type === 'done') {
            chatStore.finalizeStreaming()
          }
        }
      )

      // Build options
      const options: ClaudeOptions = {
        model: chatStore.currentModel,
        cwd: appStore.projectPath || undefined,
        continueSession: chatStore.hasMessages,
        sessionId: chatStore.currentSessionId || undefined,
      }

      // Invoke Claude CLI
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      chatStore.setError(message)

      // Add error as assistant message
      chatStore.appendToStreamingContent({
        type: 'text',
        text: `Error: ${message}`,
      })
      chatStore.finalizeStreaming()
    } finally {
      // Clean up listener after a delay to ensure all events are received
      if (unlisten) {
        setTimeout(() => unlisten?.(), 1000)
      }
    }
  }

  function handleStreamData(data: Record<string, unknown>) {
    // Handle different stream event types from Claude CLI
    // The exact format depends on Claude CLI's stream-json output

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
      // Fallback for raw text
      chatStore.appendToStreamingContent({
        type: 'text',
        text: data.raw,
      })
    }
  }

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

  return {
    isInitialized,
    claudeVersion,
    checkClaude,
    sendMessage,
  }
}
