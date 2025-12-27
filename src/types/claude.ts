// Claude CLI 相关类型定义

export interface TextBlock {
  type: 'text'
  text: string
}

export interface ThinkingBlock {
  type: 'thinking'
  thinking: string
}

export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

export type ContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | ToolResultBlock

export interface Message {
  uuid: string
  parentUuid: string | null
  role: 'user' | 'assistant'
  content: ContentBlock[]
  timestamp: Date
  model?: string
  tokenUsage?: {
    input: number
    output: number
  }
}

export interface StreamEvent {
  type: string
  data: Record<string, unknown>
}

export interface ClaudeOptions {
  model?: string
  sessionId?: string
  continueSession?: boolean
  cwd?: string
}

export type ModelId =
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'claude-haiku-3-5-20241022'

export interface Model {
  id: ModelId
  name: string
  description: string
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: '平衡性能与速度',
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: '最强能力',
  },
  {
    id: 'claude-haiku-3-5-20241022',
    name: 'Claude Haiku 3.5',
    description: '快速响应',
  },
]
