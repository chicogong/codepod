import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Session, Message, Checkpoint } from '@/types'

const SESSIONS_STORAGE_KEY = 'codepod_sessions'
const MESSAGES_STORAGE_KEY = 'codepod_messages'
const CHECKPOINTS_STORAGE_KEY = 'codepod_checkpoints'

export const useSessionStore = defineStore('session', () => {
  // State
  const sessions = ref<Session[]>([])
  const checkpoints = ref<Map<string, Checkpoint[]>>(new Map())
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

  // Checkpoint persistence
  function saveCheckpoints() {
    try {
      const checkpointsArray = Array.from(checkpoints.value.entries())
      localStorage.setItem(
        CHECKPOINTS_STORAGE_KEY,
        JSON.stringify(checkpointsArray)
      )
    } catch (e) {
      console.error('[Session] Failed to save checkpoints:', e)
    }
  }

  function loadCheckpoints() {
    try {
      const stored = localStorage.getItem(CHECKPOINTS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as [string, Checkpoint[]][]
        checkpoints.value = new Map(
          parsed.map(([sessionId, cps]) => [
            sessionId,
            cps.map(cp => ({
              ...cp,
              timestamp: new Date(cp.timestamp),
              messages: cp.messages.map(m => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            })),
          ])
        )
      }
    } catch (e) {
      console.error('[Session] Failed to load checkpoints:', e)
    }
  }

  function getSessionCheckpoints(sessionId: string): Checkpoint[] {
    return checkpoints.value.get(sessionId) || []
  }

  function createCheckpoint(
    sessionId: string,
    name: string,
    messages: Message[],
    description?: string
  ): Checkpoint {
    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      sessionId,
      name,
      description,
      timestamp: new Date(),
      messages: JSON.parse(JSON.stringify(messages)), // Deep clone
      messageCount: messages.length,
    }

    const sessionCheckpoints = checkpoints.value.get(sessionId) || []
    sessionCheckpoints.push(checkpoint)
    checkpoints.value.set(sessionId, sessionCheckpoints)
    saveCheckpoints()

    return checkpoint
  }

  function deleteCheckpoint(sessionId: string, checkpointId: string) {
    const sessionCheckpoints = checkpoints.value.get(sessionId)
    if (sessionCheckpoints) {
      const index = sessionCheckpoints.findIndex(cp => cp.id === checkpointId)
      if (index > -1) {
        sessionCheckpoints.splice(index, 1)
        if (sessionCheckpoints.length === 0) {
          checkpoints.value.delete(sessionId)
        } else {
          checkpoints.value.set(sessionId, sessionCheckpoints)
        }
        saveCheckpoints()
      }
    }
  }

  function updateCheckpoint(
    sessionId: string,
    checkpointId: string,
    updates: Partial<Pick<Checkpoint, 'name' | 'description'>>
  ) {
    const sessionCheckpoints = checkpoints.value.get(sessionId)
    if (sessionCheckpoints) {
      const checkpoint = sessionCheckpoints.find(cp => cp.id === checkpointId)
      if (checkpoint) {
        Object.assign(checkpoint, updates)
        checkpoints.value.set(sessionId, sessionCheckpoints)
        saveCheckpoints()
      }
    }
  }

  function deleteSessionCheckpoints(sessionId: string) {
    checkpoints.value.delete(sessionId)
    saveCheckpoints()
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
      deleteSessionCheckpoints(sessionId)
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
    loadCheckpoints()
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
    checkpoints,
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

    // Checkpoint management
    getSessionCheckpoints,
    createCheckpoint,
    deleteCheckpoint,
    updateCheckpoint,
    deleteSessionCheckpoints,
  }
})
