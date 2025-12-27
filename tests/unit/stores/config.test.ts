import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfigStore } from '@/stores/config'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('useConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should have initial state', () => {
    const store = useConfigStore()

    expect(store.mcpConfig).toEqual({ mcpServers: {}, disabledMcpServers: [] })
    expect(store.skills).toEqual([])
    expect(store.commands).toEqual([])
    expect(store.agents).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should compute mcpServers from config', () => {
    const store = useConfigStore()

    store.mcpConfig = {
      mcpServers: {
        filesystem: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@mcp/filesystem'],
        },
        disabled: {
          type: 'stdio',
          command: 'other',
        },
      },
      disabledMcpServers: ['disabled'],
    }

    expect(store.mcpServers).toHaveLength(2)
    expect(store.mcpServers[0].name).toBe('filesystem')
    expect(store.mcpServers[0].enabled).toBe(true)
    expect(store.mcpServers[1].name).toBe('disabled')
    expect(store.mcpServers[1].enabled).toBe(false)
  })

  it('should compute enabledMcpServers', () => {
    const store = useConfigStore()

    store.mcpConfig = {
      mcpServers: {
        enabled1: { type: 'stdio', command: 'cmd1' },
        enabled2: { type: 'stdio', command: 'cmd2' },
        disabled: { type: 'stdio', command: 'cmd3' },
      },
      disabledMcpServers: ['disabled'],
    }

    expect(store.enabledMcpServers).toHaveLength(2)
  })

  it('should add MCP server', () => {
    const store = useConfigStore()

    store.addMcpServer('test', {
      type: 'stdio',
      command: 'npx',
      args: ['test'],
    })

    expect(store.mcpConfig.mcpServers?.test).toBeDefined()
    expect(store.mcpConfig.mcpServers?.test.command).toBe('npx')
  })

  it('should remove MCP server', () => {
    const store = useConfigStore()

    store.mcpConfig = {
      mcpServers: {
        test: { type: 'stdio', command: 'cmd' },
      },
      disabledMcpServers: ['test'],
    }

    store.removeMcpServer('test')

    expect(store.mcpConfig.mcpServers?.test).toBeUndefined()
    expect(store.mcpConfig.disabledMcpServers).not.toContain('test')
  })

  it('should toggle MCP server', () => {
    const store = useConfigStore()

    store.mcpConfig = {
      mcpServers: { test: { type: 'stdio', command: 'cmd' } },
      disabledMcpServers: [],
    }

    // Disable
    store.toggleMcpServer('test')
    expect(store.mcpConfig.disabledMcpServers).toContain('test')

    // Enable
    store.toggleMcpServer('test')
    expect(store.mcpConfig.disabledMcpServers).not.toContain('test')
  })

  it('should add and remove skills', () => {
    const store = useConfigStore()

    store.addSkill({
      name: 'test-skill',
      description: 'A test skill',
      content: 'skill content',
      enabled: true,
    })

    expect(store.skills).toHaveLength(1)
    expect(store.skills[0].name).toBe('test-skill')

    store.removeSkill('test-skill')
    expect(store.skills).toHaveLength(0)
  })

  it('should toggle skills', () => {
    const store = useConfigStore()

    store.skills = [
      { name: 'test', description: '', content: '', enabled: true },
    ]

    store.toggleSkill('test')
    expect(store.skills[0].enabled).toBe(false)

    store.toggleSkill('test')
    expect(store.skills[0].enabled).toBe(true)
  })

  it('should add and remove commands', () => {
    const store = useConfigStore()

    store.addCommand({
      name: 'test-cmd',
      description: 'A test command',
      content: 'command content',
      enabled: true,
    })

    expect(store.commands).toHaveLength(1)

    store.removeCommand('test-cmd')
    expect(store.commands).toHaveLength(0)
  })

  it('should add and remove agents', () => {
    const store = useConfigStore()

    store.addAgent({
      name: 'test-agent',
      description: 'A test agent',
      systemPrompt: 'You are a test agent',
      tools: ['read', 'write'],
      enabled: true,
    })

    expect(store.agents).toHaveLength(1)
    expect(store.agents[0].tools).toContain('read')

    store.removeAgent('test-agent')
    expect(store.agents).toHaveLength(0)
  })

  it('should compute enabled items', () => {
    const store = useConfigStore()

    store.skills = [
      { name: 's1', description: '', content: '', enabled: true },
      { name: 's2', description: '', content: '', enabled: false },
    ]
    store.commands = [
      { name: 'c1', description: '', content: '', enabled: true },
      { name: 'c2', description: '', content: '', enabled: false },
    ]
    store.agents = [
      {
        name: 'a1',
        description: '',
        systemPrompt: '',
        tools: [],
        enabled: true,
      },
      {
        name: 'a2',
        description: '',
        systemPrompt: '',
        tools: [],
        enabled: false,
      },
    ]

    expect(store.enabledSkills).toHaveLength(1)
    expect(store.enabledCommands).toHaveLength(1)
    expect(store.enabledAgents).toHaveLength(1)
  })
})
