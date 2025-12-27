import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '@/stores/session'
import type { Session } from '@/types'

describe('Session Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createMockSession = (overrides: Partial<Session> = {}): Session => ({
    id: 'session-1',
    projectPath: '/test/project',
    title: 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 5,
    ...overrides,
  })

  describe('initial state', () => {
    it('should have empty sessions', () => {
      const store = useSessionStore()
      expect(store.sessions).toHaveLength(0)
    })

    it('should not be loading', () => {
      const store = useSessionStore()
      expect(store.isLoading).toBe(false)
    })

    it('should have no error', () => {
      const store = useSessionStore()
      expect(store.error).toBeNull()
    })
  })

  describe('setSessions', () => {
    it('should set sessions', () => {
      const store = useSessionStore()
      const sessions = [createMockSession()]

      store.setSessions(sessions)

      expect(store.sessions).toHaveLength(1)
    })
  })

  describe('addSession', () => {
    it('should add session to the beginning', () => {
      const store = useSessionStore()
      const session1 = createMockSession({ id: 'session-1' })
      const session2 = createMockSession({ id: 'session-2' })

      store.addSession(session1)
      store.addSession(session2)

      expect(store.sessions[0].id).toBe('session-2')
    })
  })

  describe('removeSession', () => {
    it('should remove session by id', () => {
      const store = useSessionStore()
      store.setSessions([
        createMockSession({ id: 'session-1' }),
        createMockSession({ id: 'session-2' }),
      ])

      store.removeSession('session-1')

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe('session-2')
    })

    it('should do nothing if session not found', () => {
      const store = useSessionStore()
      store.setSessions([createMockSession({ id: 'session-1' })])

      store.removeSession('non-existent')

      expect(store.sessions).toHaveLength(1)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useSessionStore()

      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const store = useSessionStore()

      store.setError('Something went wrong')
      expect(store.error).toBe('Something went wrong')

      store.setError(null)
      expect(store.error).toBeNull()
    })
  })

  describe('getters', () => {
    it('should return session count', () => {
      const store = useSessionStore()
      store.setSessions([
        createMockSession({ id: '1' }),
        createMockSession({ id: '2' }),
      ])

      expect(store.sessionCount).toBe(2)
    })

    describe('groupedSessions', () => {
      it('should group sessions by date', () => {
        const store = useSessionStore()
        const now = new Date()
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const lastWeek = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        const older = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        store.setSessions([
          createMockSession({ id: '1', updatedAt: now }),
          createMockSession({ id: '2', updatedAt: yesterday }),
          createMockSession({ id: '3', updatedAt: lastWeek }),
          createMockSession({ id: '4', updatedAt: older }),
        ])

        const groups = store.groupedSessions

        expect(groups['Today']).toHaveLength(1)
        expect(groups['Yesterday']).toHaveLength(1)
        expect(groups['Last 7 Days']).toHaveLength(1)
        expect(groups['Older']).toHaveLength(1)
      })

      it('should not include empty groups', () => {
        const store = useSessionStore()
        const now = new Date()

        store.setSessions([createMockSession({ id: '1', updatedAt: now })])

        const groups = store.groupedSessions

        expect(Object.keys(groups)).toEqual(['Today'])
      })
    })
  })
})
