// Claude Code Configuration Types

// MCP Tool Definition
export interface McpTool {
  name: string
  description?: string
  inputSchema?: {
    type: string
    properties?: Record<string, unknown>
    required?: string[]
  }
  serverName: string
}

// MCP Tool Call History
export interface McpToolCall {
  id: string
  toolName: string
  serverName: string
  input: Record<string, unknown>
  output?: string
  error?: string
  timestamp: Date
  duration?: number
  status: 'pending' | 'success' | 'error'
}

// MCP Server Types
export interface McpServerBase {
  type?: 'stdio' | 'http' | 'sse'
  env?: Record<string, string>
}

export interface McpServerStdio extends McpServerBase {
  type?: 'stdio'
  command: string
  args?: string[]
}

export interface McpServerHttp extends McpServerBase {
  type: 'http'
  url: string
  headers?: Record<string, string>
}

export interface McpServerSse extends McpServerBase {
  type: 'sse'
  url: string
  headers?: Record<string, string>
}

export type McpServer = McpServerStdio | McpServerHttp | McpServerSse

export interface McpConfig {
  mcpServers?: Record<string, McpServer>
  disabledMcpServers?: string[]
}

// Settings Types
export interface SettingsPermissions {
  allow?: string[]
  deny?: string[]
  ask?: string[]
}

export interface SettingsConfig {
  env?: Record<string, string>
  permissions?: SettingsPermissions
  enableAllProjectMcpServers?: boolean
  enabledMcpjsonServers?: string[]
}

// Skill Definition
export interface Skill {
  name: string
  description: string
  content: string
  enabled: boolean
}

// Command Definition
export interface Command {
  name: string
  description?: string
  content: string
  enabled: boolean
}

// Agent Definition
export interface Agent {
  name: string
  description?: string
  systemPrompt: string
  tools?: string[]
  enabled: boolean
}

// Full Config State
export interface ConfigState {
  mcp: McpConfig
  settings: SettingsConfig
  skills: Skill[]
  commands: Command[]
  agents: Agent[]
}

// Config File Paths
export const CONFIG_PATHS = {
  globalMcp: '~/.mcp.json',
  globalSettings: '~/.claude/settings.json',
  localSettings: '~/.claude/settings.local.json',
  projectMcp: '.mcp.json',
  projectSettings: '.claude/settings.json',
  projectLocalSettings: '.claude/settings.local.json',
  commands: '~/.claude/commands/',
  agents: '~/.claude/agents/',
} as const
