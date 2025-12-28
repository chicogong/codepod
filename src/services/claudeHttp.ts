/**
 * Claude Code HTTP API 服务
 * 支持通过 HTTP API 连接本地 Claude Code 服务
 */

import type { ClaudeOptions, ContentBlock } from '@/types'

// CLI 类型
export type CliType = 'claude' | 'codebuddy'

// HTTP API 配置
export interface HttpApiConfig {
  host: string
  port: number
  baseUrl: string
  cliType: CliType
}

// Agent 请求参数
export interface AgentRequest {
  prompt: string
  model?: string
  outputFormat?: 'text' | 'json' | 'stream-json'
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
  allowedTools?: string[]
  disallowedTools?: string[]
  sessionId?: string
  continue?: boolean
  resume?: string
  dangerouslySkipPermissions?: boolean
  addDir?: string[]
  cliType?: CliType // 可选指定 CLI 类型
}

// 流式消息类型
export interface StreamMessage {
  type: 'system' | 'user' | 'assistant' | 'result'
  subtype?: 'init' | 'result'
  session_id?: string
  message?: {
    role?: string
    content?: ContentBlock[] | string
  }
  // result 类型的字段
  cost_usd?: number
  duration_ms?: number
  duration_api_ms?: number
  is_error?: boolean
  num_turns?: number
  result?: string
  total_cost_usd?: number
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

// 回调类型
export type StreamCallback = (message: StreamMessage) => void
export type ErrorCallback = (error: Error) => void
export type DoneCallback = () => void

class ClaudeHttpService {
  private config: HttpApiConfig = {
    host: '127.0.0.1',
    port: 3002,
    baseUrl: 'http://127.0.0.1:3002',
    cliType: 'claude',
  }

  private isServerRunning = false
  private availableClis: { claude: boolean; codebuddy: boolean } = {
    claude: false,
    codebuddy: false,
  }

  /**
   * 设置 API 配置
   */
  setConfig(config: Partial<HttpApiConfig>) {
    this.config = { ...this.config, ...config }
    this.config.baseUrl = `http://${this.config.host}:${this.config.port}`
  }

  /**
   * 获取当前配置
   */
  getConfig(): HttpApiConfig {
    return { ...this.config }
  }

  /**
   * 检查服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      // 支持两种健康检查端点：/health (代理服务器) 和 /doctor (官方 HTTP API)
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        // 尝试解析健康检查响应，获取 CLI 可用性信息
        try {
          const data = (await response.json()) as {
            currentCli?: CliType
            availableClis?: { claude: boolean; codebuddy: boolean }
          }
          if (data.availableClis) {
            this.availableClis = data.availableClis
          }
          if (data.currentCli) {
            this.config.cliType = data.currentCli
          }
        } catch {
          // 忽略解析错误
        }
        return true
      }

      // 如果 /health 失败，尝试 /doctor
      const doctorResponse = await fetch(`${this.config.baseUrl}/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal,
      })

      return doctorResponse.ok
    } catch {
      return false
    }
  }

  /**
   * 获取 Claude 版本信息
   */
  async getVersion(): Promise<string | null> {
    try {
      // 通过简单请求测试服务
      const isHealthy = await this.checkHealth()
      if (isHealthy) {
        return 'HTTP API'
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * 发送消息并获取流式响应
   */
  async sendMessageStream(
    prompt: string,
    options: ClaudeOptions,
    callbacks: {
      onMessage: StreamCallback
      onError: ErrorCallback
      onDone: DoneCallback
    },
    signal?: AbortSignal
  ): Promise<void> {
    const request: AgentRequest = {
      prompt,
      model: options.model,
      outputFormat: 'stream-json',
      sessionId: options.sessionId,
      continue: options.continueSession,
      dangerouslySkipPermissions: true, // 非交互模式需要
    }

    if (options.cwd) {
      request.addDir = [options.cwd]
    }

    console.log(
      '[ClaudeHttp] Sending request to:',
      `${this.config.baseUrl}/agent`
    )
    console.log('[ClaudeHttp] Request:', JSON.stringify(request, null, 2))

    try {
      const response = await fetch(`${this.config.baseUrl}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal, // 传递 AbortSignal
      })

      console.log(
        '[ClaudeHttp] Response status:',
        response.status,
        response.statusText
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 处理 SSE 流
      await this.processSSEStream(response.body, callbacks)
    } catch (error) {
      // 如果是用户主动中断，不算错误
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[ClaudeHttp] Request aborted by user')
        callbacks.onDone()
        return
      }
      console.error('[ClaudeHttp] Error:', error)
      callbacks.onError(
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * 处理 SSE 流
   */
  private async processSSEStream(
    body: ReadableStream<Uint8Array>,
    callbacks: {
      onMessage: StreamCallback
      onError: ErrorCallback
      onDone: DoneCallback
    }
  ): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    console.log('[ClaudeHttp] Starting SSE stream processing')

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('[ClaudeHttp] Stream done')
          callbacks.onDone()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        console.log('[ClaudeHttp] Received chunk:', buffer.substring(0, 200))

        // 按行处理
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()

          if (!trimmedLine) continue

          // SSE 格式: event: xxx 或 data: xxx
          if (trimmedLine.startsWith('event:')) {
            console.log('[ClaudeHttp] Event:', trimmedLine)
            continue
          }

          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.slice(5).trim()
            console.log('[ClaudeHttp] Data:', data.substring(0, 100))

            if (data === '{}' || data === '[DONE]') {
              continue
            }

            try {
              const message = JSON.parse(data) as StreamMessage
              console.log('[ClaudeHttp] Parsed message type:', message.type)
              callbacks.onMessage(message)
            } catch {
              // 非 JSON 格式，尝试作为原始文本处理
              if (data) {
                callbacks.onMessage({
                  type: 'assistant',
                  message: {
                    content: data,
                  },
                })
              }
            }
          } else {
            // 可能是 JSONL 格式（每行一个 JSON）
            try {
              const message = JSON.parse(trimmedLine) as StreamMessage
              console.log(
                '[ClaudeHttp] Parsed JSONL message type:',
                message.type
              )
              callbacks.onMessage(message)
            } catch {
              // 忽略解析失败的行
            }
          }
        }
      }
    } catch (error) {
      console.error('[ClaudeHttp] Stream error:', error)
      callbacks.onError(
        error instanceof Error ? error : new Error(String(error))
      )
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 发送单次请求（非流式）
   */
  async sendMessage(
    prompt: string,
    options: ClaudeOptions
  ): Promise<{ output: string; usage?: { input: number; output: number } }> {
    const request: AgentRequest = {
      prompt,
      model: options.model,
      outputFormat: 'json',
      sessionId: options.sessionId,
      continue: options.continueSession,
      dangerouslySkipPermissions: true,
    }

    if (options.cwd) {
      request.addDir = [options.cwd]
    }

    const response = await fetch(`${this.config.baseUrl}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      output?: string
      usage?: { inputTokens?: number; outputTokens?: number }
    }

    return {
      output: result.output || '',
      usage: result.usage
        ? {
            input: result.usage.inputTokens || 0,
            output: result.usage.outputTokens || 0,
          }
        : undefined,
    }
  }

  /**
   * 获取配置项
   */
  async getConfigValue(key: string, global = false): Promise<unknown> {
    const response = await fetch(`${this.config.baseUrl}/config/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, global }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 列出 MCP 服务器
   */
  async listMcpServers(
    scope: 'local' | 'project' | 'user' = 'user'
  ): Promise<unknown> {
    const response = await fetch(`${this.config.baseUrl}/mcp/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 设置服务运行状态
   */
  setServerRunning(running: boolean) {
    this.isServerRunning = running
  }

  /**
   * 获取服务运行状态
   */
  getServerRunning(): boolean {
    return this.isServerRunning
  }

  /**
   * 获取当前 CLI 类型
   */
  getCliType(): CliType {
    return this.config.cliType
  }

  /**
   * 设置 CLI 类型
   */
  async setCliType(cliType: CliType): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/cli`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliType }),
      })

      if (response.ok) {
        this.config.cliType = cliType
        return true
      }

      const error = (await response.json()) as { error?: string }
      console.error('[ClaudeHttp] Failed to set CLI type:', error.error)
      return false
    } catch (error) {
      console.error('[ClaudeHttp] Error setting CLI type:', error)
      return false
    }
  }

  /**
   * 获取可用的 CLI 类型
   */
  getAvailableClis(): { claude: boolean; codebuddy: boolean } {
    return { ...this.availableClis }
  }

  /**
   * 获取 CLI 状态信息
   */
  async getCliStatus(): Promise<{
    currentCli: CliType
    cliPath: string
    availableClis: string[]
  } | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/cli`, {
        method: 'GET',
      })

      if (response.ok) {
        return response.json()
      }
      return null
    } catch {
      return null
    }
  }
}

// 导出单例
export const claudeHttpService = new ClaudeHttpService()
