import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '@/types'

export type ViewMode = 'chat' | 'terminal'

export interface AutoCheckpointConfig {
  enabled: boolean
  messageInterval: number // Create checkpoint every N messages
  namePrefix: string // Prefix for auto-checkpoint names
}

export const useAppStore = defineStore('app', () => {
  // State
  const currentProject = ref<Project | null>(null)
  const recentProjects = ref<Project[]>([])
  const isDarkMode = ref(false)
  const sidebarWidth = ref(260)
  const isSidebarCollapsed = ref(false)
  const viewMode = ref<ViewMode>('chat')

  // Auto-checkpoint configuration
  const autoCheckpointConfig = ref<AutoCheckpointConfig>({
    enabled: true,
    messageInterval: 10,
    namePrefix: '自动检查点',
  })

  // Getters
  const projectName = computed(() => {
    if (!currentProject.value) return 'No Project'
    return currentProject.value.name
  })

  const projectPath = computed(() => currentProject.value?.path ?? null)

  // Actions
  function setCurrentProject(project: Project | null) {
    currentProject.value = project
    if (project) {
      // Update recent projects
      const index = recentProjects.value.findIndex(p => p.path === project.path)
      if (index > -1) {
        recentProjects.value.splice(index, 1)
      }
      recentProjects.value.unshift({
        ...project,
        lastOpened: new Date(),
      })
      // Keep only last 10
      if (recentProjects.value.length > 10) {
        recentProjects.value = recentProjects.value.slice(0, 10)
      }
      // Persist
      localStorage.setItem(
        'recentProjects',
        JSON.stringify(recentProjects.value)
      )
    }
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    document.documentElement.classList.toggle('dark', isDarkMode.value)
    localStorage.setItem('darkMode', String(isDarkMode.value))
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  function setAutoCheckpointConfig(config: Partial<AutoCheckpointConfig>) {
    autoCheckpointConfig.value = {
      ...autoCheckpointConfig.value,
      ...config,
    }
    localStorage.setItem(
      'autoCheckpointConfig',
      JSON.stringify(autoCheckpointConfig.value)
    )
  }

  function loadPersistedState() {
    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      isDarkMode.value = savedDarkMode === 'true'
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    } else {
      // Check system preference
      isDarkMode.value = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      document.documentElement.classList.toggle('dark', isDarkMode.value)
    }

    // Load recent projects
    const savedProjects = localStorage.getItem('recentProjects')
    if (savedProjects) {
      try {
        recentProjects.value = JSON.parse(savedProjects)
      } catch {
        recentProjects.value = []
      }
    }

    // Load auto-checkpoint config
    const savedAutoCheckpointConfig = localStorage.getItem(
      'autoCheckpointConfig'
    )
    if (savedAutoCheckpointConfig) {
      try {
        autoCheckpointConfig.value = JSON.parse(savedAutoCheckpointConfig)
      } catch {
        // Use default values
      }
    }
  }

  return {
    // State
    currentProject,
    recentProjects,
    isDarkMode,
    sidebarWidth,
    isSidebarCollapsed,
    viewMode,
    autoCheckpointConfig,

    // Getters
    projectName,
    projectPath,

    // Actions
    setCurrentProject,
    toggleDarkMode,
    toggleSidebar,
    setViewMode,
    setAutoCheckpointConfig,
    loadPersistedState,
  }
})
