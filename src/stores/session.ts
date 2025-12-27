import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session } from '@/types'

export const useSessionStore = defineStore('session', () => {
  // State
  const sessions = ref<Session[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sessionCount = computed(() => sessions.value.length)

  const groupedSessions = computed(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups: Record<string, Session[]> = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    }

    for (const session of sessions.value) {
      const date = new Date(session.updatedAt)
      if (date >= today) {
        groups['Today']!.push(session)
      } else if (date >= yesterday) {
        groups['Yesterday']!.push(session)
      } else if (date >= lastWeek) {
        groups['Last 7 Days']!.push(session)
      } else {
        groups['Older']!.push(session)
      }
    }

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([, v]) => v.length > 0)
    )
  })

  // Actions
  function setSessions(newSessions: Session[]) {
    sessions.value = newSessions
  }

  function addSession(session: Session) {
    sessions.value.unshift(session)
  }

  function removeSession(sessionId: string) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.value.splice(index, 1)
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(message: string | null) {
    error.value = message
  }

  return {
    // State
    sessions,
    isLoading,
    error,

    // Getters
    sessionCount,
    groupedSessions,

    // Actions
    setSessions,
    addSession,
    removeSession,
    setLoading,
    setError,
  }
})
