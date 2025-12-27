// 配置相关类型定义

export type Transport = 'Stdio' | 'Sse' | 'Http'
export type Scope = 'User' | 'Project'
export type HealthStatus = 'Healthy' | 'Unhealthy' | 'Unknown' | 'Checking'

export interface MCPServer {
  name: string
  scope: Scope
  transport: Transport
  command?: string
  args: string[]
  url?: string
  env: Record<string, string>
}

export interface Skill {
  name: string
  scope: Scope
  path: string
  description: string
  content: string
}

export interface Command {
  name: string
  scope: Scope
  path: string
  description: string
  content: string
}

export interface Agent {
  name: string
  scope: Scope
  path: string
  description: string
  model?: string
  tools: string[]
  content: string
}

export interface ScanResult {
  mcpServers: MCPServer[]
  skills: Skill[]
  commands: Command[]
  agents: Agent[]
  errors: string[]
}

export interface HealthResult {
  serverName: string
  status: HealthStatus
  message: string
  details?: string
  suggestions: string[]
}
