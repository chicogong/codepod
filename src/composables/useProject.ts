import { ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { useAppStore } from '@/stores'
import type { Project } from '@/types'

export function useProject() {
  const appStore = useAppStore()
  const isSelecting = ref(false)

  async function selectProject(): Promise<Project | null> {
    if (isSelecting.value) return null

    isSelecting.value = true
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Folder',
      })

      if (selected && typeof selected === 'string') {
        const project: Project = {
          path: selected,
          name: extractProjectName(selected),
          lastOpened: new Date(),
        }
        appStore.setCurrentProject(project)
        return project
      }
      return null
    } catch (error) {
      console.error('Failed to select project:', error)
      return null
    } finally {
      isSelecting.value = false
    }
  }

  function extractProjectName(path: string): string {
    // Extract folder name from path
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || 'Unknown'
  }

  function openRecentProject(project: Project) {
    appStore.setCurrentProject(project)
  }

  function clearCurrentProject() {
    appStore.setCurrentProject(null)
  }

  return {
    isSelecting,
    selectProject,
    openRecentProject,
    clearCurrentProject,
  }
}
