import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockClear()
  })

  describe('initial state', () => {
    it('should have no current project', () => {
      const store = useAppStore()
      expect(store.currentProject).toBeNull()
    })

    it('should have empty recent projects', () => {
      const store = useAppStore()
      expect(store.recentProjects).toHaveLength(0)
    })

    it('should not be in dark mode by default', () => {
      const store = useAppStore()
      expect(store.isDarkMode).toBe(false)
    })

    it('should have default sidebar width', () => {
      const store = useAppStore()
      expect(store.sidebarWidth).toBe(260)
    })
  })

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      const store = useAppStore()
      const project = {
        path: '/path/to/project',
        name: 'My Project',
      }

      store.setCurrentProject(project)

      expect(store.currentProject).toEqual(project)
    })

    it('should add to recent projects', () => {
      const store = useAppStore()
      const project = {
        path: '/path/to/project',
        name: 'My Project',
      }

      store.setCurrentProject(project)

      expect(store.recentProjects).toHaveLength(1)
      expect(store.recentProjects[0].path).toBe('/path/to/project')
    })

    it('should move existing project to top', () => {
      const store = useAppStore()
      const project1 = { path: '/project1', name: 'Project 1' }
      const project2 = { path: '/project2', name: 'Project 2' }

      store.setCurrentProject(project1)
      store.setCurrentProject(project2)
      store.setCurrentProject(project1)

      expect(store.recentProjects[0].path).toBe('/project1')
      expect(store.recentProjects).toHaveLength(2)
    })

    it('should limit recent projects to 10', () => {
      const store = useAppStore()

      for (let i = 0; i < 15; i++) {
        store.setCurrentProject({
          path: `/project${i}`,
          name: `Project ${i}`,
        })
      }

      expect(store.recentProjects).toHaveLength(10)
    })

    it('should persist to localStorage', () => {
      const store = useAppStore()
      store.setCurrentProject({
        path: '/project',
        name: 'Project',
      })

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'recentProjects',
        expect.any(String)
      )
    })
  })

  describe('toggleDarkMode', () => {
    it('should toggle dark mode', () => {
      const store = useAppStore()

      store.toggleDarkMode()
      expect(store.isDarkMode).toBe(true)

      store.toggleDarkMode()
      expect(store.isDarkMode).toBe(false)
    })

    it('should persist to localStorage', () => {
      const store = useAppStore()
      store.toggleDarkMode()

      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true')
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      const store = useAppStore()

      expect(store.isSidebarCollapsed).toBe(false)
      store.toggleSidebar()
      expect(store.isSidebarCollapsed).toBe(true)
    })
  })

  describe('getters', () => {
    it('should return project name', () => {
      const store = useAppStore()
      expect(store.projectName).toBe('No Project')

      store.setCurrentProject({ path: '/test', name: 'Test Project' })
      expect(store.projectName).toBe('Test Project')
    })

    it('should return project path', () => {
      const store = useAppStore()
      expect(store.projectPath).toBeNull()

      store.setCurrentProject({ path: '/test', name: 'Test' })
      expect(store.projectPath).toBe('/test')
    })
  })

  describe('loadPersistedState', () => {
    it('should load dark mode from localStorage', () => {
      vi.mocked(localStorage.getItem).mockImplementation(key => {
        if (key === 'darkMode') return 'true'
        return null
      })

      const store = useAppStore()
      store.loadPersistedState()

      expect(store.isDarkMode).toBe(true)
    })

    it('should load recent projects from localStorage', () => {
      const projects = [{ path: '/test', name: 'Test' }]
      vi.mocked(localStorage.getItem).mockImplementation(key => {
        if (key === 'recentProjects') return JSON.stringify(projects)
        return null
      })

      const store = useAppStore()
      store.loadPersistedState()

      expect(store.recentProjects).toHaveLength(1)
    })
  })
})
