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
  | 'claude-4.5'
  | 'claude-opus-4.5'
  | 'claude-haiku-4.5'
  | 'gemini-2.5-pro'
  | 'gpt-5.1'
  | 'deepseek-v3-2-volc-ioa'

export interface Model {
  id: ModelId
  name: string
  description: string
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'claude-4.5',
    name: 'Claude 4.5',
    description: '平衡性能与速度',
  },
  {
    id: 'claude-opus-4.5',
    name: 'Claude Opus 4.5',
    description: '最强能力',
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    description: '快速响应',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google Gemini',
  },
  {
    id: 'gpt-5.1',
    name: 'GPT 5.1',
    description: 'OpenAI GPT',
  },
  {
    id: 'deepseek-v3-2-volc-ioa',
    name: 'DeepSeek V3',
    description: 'DeepSeek',
  },
]
