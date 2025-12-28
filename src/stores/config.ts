import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type {
  McpConfig,
  McpServer,
  SettingsConfig,
  Skill,
  Command,
  Agent,
} from '@/types/config'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

export const useConfigStore = defineStore('config', () => {
  // State
  const mcpConfig = ref<McpConfig>({ mcpServers: {}, disabledMcpServers: [] })
  const settingsConfig = ref<SettingsConfig>({})
  const skills = ref<Skill[]>([])
  const commands = ref<Command[]>([])
  const agents = ref<Agent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const mcpServers = computed(() => {
    const servers = mcpConfig.value.mcpServers || {}
    return Object.entries(servers).map(([name, config]) => ({
      name,
      ...config,
      enabled: !mcpConfig.value.disabledMcpServers?.includes(name),
    }))
  })

  const enabledMcpServers = computed(() =>
    mcpServers.value.filter(s => s.enabled)
  )

  const enabledSkills = computed(() => skills.value.filter(s => s.enabled))
  const enabledCommands = computed(() => commands.value.filter(c => c.enabled))
  const enabledAgents = computed(() => agents.value.filter(a => a.enabled))

  // Actions
  async function loadMcpConfig() {
    isLoading.value = true
    error.value = null
    try {
      const result = await invoke<CommandResult<string>>('read_config_file', {
        path: '~/.mcp.json',
      })
      if (result.success && result.data) {
        mcpConfig.value = JSON.parse(result.data)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load MCP config'
    } finally {
      isLoading.value = false
    }
  }

  async function saveMcpConfig() {
    isLoading.value = true
    error.value = null
    try {
      await invoke<CommandResult<void>>('write_config_file', {
        path: '~/.mcp.json',
        content: JSON.stringify(mcpConfig.value, null, 2),
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save MCP config'
    } finally {
      isLoading.value = false
    }
  }

  function addMcpServer(name: string, config: McpServer) {
    if (!mcpConfig.value.mcpServers) {
      mcpConfig.value.mcpServers = {}
    }
    mcpConfig.value.mcpServers[name] = config
  }

  function removeMcpServer(name: string) {
    if (mcpConfig.value.mcpServers) {
      delete mcpConfig.value.mcpServers[name]
    }
    // Also remove from disabled list
    if (mcpConfig.value.disabledMcpServers) {
      mcpConfig.value.disabledMcpServers =
        mcpConfig.value.disabledMcpServers.filter(n => n !== name)
    }
  }

  function toggleMcpServer(name: string) {
    if (!mcpConfig.value.disabledMcpServers) {
      mcpConfig.value.disabledMcpServers = []
    }
    const index = mcpConfig.value.disabledMcpServers.indexOf(name)
    if (index > -1) {
      mcpConfig.value.disabledMcpServers.splice(index, 1)
    } else {
      mcpConfig.value.disabledMcpServers.push(name)
    }
  }

  async function loadSettings() {
    isLoading.value = true
    error.value = null
    try {
      const result = await invoke<CommandResult<string>>('read_config_file', {
        path: '~/.claude/settings.json',
      })
      if (result.success && result.data) {
        settingsConfig.value = JSON.parse(result.data)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings'
    } finally {
      isLoading.value = false
    }
  }

  async function loadCommands() {
    isLoading.value = true
    error.value = null
    try {
      const result = await invoke<CommandResult<Command[]>>('list_commands')
      if (result.success && result.data) {
        commands.value = result.data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load commands'
    } finally {
      isLoading.value = false
    }
  }

  async function loadAgents() {
    isLoading.value = true
    error.value = null
    try {
      const result = await invoke<CommandResult<Agent[]>>('list_agents')
      if (result.success && result.data) {
        agents.value = result.data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load agents'
    } finally {
      isLoading.value = false
    }
  }

  async function loadSkills() {
    isLoading.value = true
    error.value = null
    try {
      const result = await invoke<CommandResult<Skill[]>>('list_skills')
      if (result.success && result.data) {
        skills.value = result.data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load skills'
    } finally {
      isLoading.value = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadMcpConfig(),
      loadSettings(),
      loadCommands(),
      loadAgents(),
      loadSkills(),
    ])
  }

  function addSkill(skill: Skill) {
    skills.value.push(skill)
  }

  function removeSkill(name: string) {
    skills.value = skills.value.filter(s => s.name !== name)
  }

  function toggleSkill(name: string) {
    const skill = skills.value.find(s => s.name === name)
    if (skill) {
      skill.enabled = !skill.enabled
    }
  }

  function addCommand(command: Command) {
    commands.value.push(command)
  }

  function removeCommand(name: string) {
    commands.value = commands.value.filter(c => c.name !== name)
  }

  function addAgent(agent: Agent) {
    agents.value.push(agent)
  }

  function removeAgent(name: string) {
    agents.value = agents.value.filter(a => a.name !== name)
  }

  return {
    // State
    mcpConfig,
    settingsConfig,
    skills,
    commands,
    agents,
    isLoading,
    error,

    // Getters
    mcpServers,
    enabledMcpServers,
    enabledSkills,
    enabledCommands,
    enabledAgents,

    // Actions
    loadMcpConfig,
    saveMcpConfig,
    addMcpServer,
    removeMcpServer,
    toggleMcpServer,
    loadSettings,
    loadCommands,
    loadAgents,
    loadSkills,
    loadAll,
    addSkill,
    removeSkill,
    toggleSkill,
    addCommand,
    removeCommand,
    addAgent,
    removeAgent,
  }
})
