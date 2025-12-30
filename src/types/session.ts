// 会话相关类型定义
import type { Message } from './claude'

export interface Session {
  id: string
  projectPath: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export interface SessionMessage {
  uuid: string
  parentUuid: string | null
  role: 'user' | 'assistant'
  content: unknown[]
  timestamp: Date
}

export interface Project {
  path: string
  name: string
  lastOpened?: Date
}

/**
 * Session checkpoint - a snapshot of conversation state
 */
export interface Checkpoint {
  id: string
  sessionId: string
  name: string
  description?: string
  timestamp: Date
  messages: Message[]
  messageCount: number
}
