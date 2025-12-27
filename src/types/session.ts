// 会话相关类型定义

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
