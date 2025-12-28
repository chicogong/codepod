import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Session, Message } from '@/types'

const SESSIONS_STORAGE_KEY = 'codepod_sessions'
const MESSAGES_STORAGE_KEY = 'codepod_messages'

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

  // Persistence helpers
  function saveSessions() {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions.value))
    } catch (e) {
      console.error('[Session] Failed to save sessions:', e)
    }
  }

  function loadSessions() {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Session[]
        // Convert date strings back to Date objects
        sessions.value = parsed.map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }))
      }
    } catch (e) {
      console.error('[Session] Failed to load sessions:', e)
    }
  }

  function saveMessages(sessionId: string, messages: Message[]) {
    try {
      const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`
      localStorage.setItem(key, JSON.stringify(messages))
    } catch (e) {
      console.error('[Session] Failed to save messages:', e)
    }
  }

  function loadMessages(sessionId: string): Message[] {
    try {
      const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as Message[]
        // Convert date strings back to Date objects
        return parsed.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      }
    } catch (e) {
      console.error('[Session] Failed to load messages:', e)
    }
    return []
  }

  function deleteMessages(sessionId: string) {
    try {
      const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`
      localStorage.removeItem(key)
    } catch (e) {
      console.error('[Session] Failed to delete messages:', e)
    }
  }

  // Actions
  function setSessions(newSessions: Session[]) {
    sessions.value = newSessions
    saveSessions()
  }

  function createSession(): Session {
    const newSession: Session = {
      id: crypto.randomUUID(),
      projectPath: '',
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    }
    addSession(newSession)
    return newSession
  }

  function addSession(session: Session) {
    sessions.value.unshift(session)
    saveSessions()
  }

  function removeSession(sessionId: string) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.value.splice(index, 1)
      deleteMessages(sessionId)
      saveSessions()
    }
  }

  function updateSession(sessionId: string, updates: Partial<Session>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      Object.assign(session, updates)
      saveSessions()
    }
  }

  function renameSession(sessionId: string, newTitle: string) {
    updateSession(sessionId, { title: newTitle, updatedAt: new Date() })
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(message: string | null) {
    error.value = message
  }

  // Initialize - load sessions from storage
  function init() {
    loadSessions()
  }

  // Watch for changes and auto-save
  watch(
    sessions,
    () => {
      saveSessions()
    },
    { deep: true }
  )

  return {
    // State
    sessions,
    isLoading,
    error,

    // Getters
    sessionCount,
    groupedSessions,

    // Actions
    createSession,
    setSessions,
    addSession,
    removeSession,
    updateSession,
    renameSession,
    setLoading,
    setError,
    init,

    // Message persistence
    saveMessages,
    loadMessages,
    deleteMessages,
  }
})
