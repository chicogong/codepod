import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores'
import type { ContentBlock, Session } from '@/types'

export interface SearchResult {
  sessionId: string
  sessionTitle: string
  messageUuid: string
  role: 'user' | 'assistant'
  content: string
  matchedText: string
  timestamp: Date
  projectPath?: string
}

export function useSessionSearch() {
  const sessionStore = useSessionStore()

  const searchQuery = ref('')
  const results = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const totalMatches = ref(0)

  // Extract text from content blocks
  function extractText(blocks: ContentBlock[]): string {
    return blocks
      .map(block => {
        if (block.type === 'text') return block.text
        if (block.type === 'thinking') return block.thinking
        if (block.type === 'tool_use') return `Tool: ${block.name}`
        if (block.type === 'tool_result') return block.content
        return ''
      })
      .join('\n')
  }

  // Search across all sessions
  async function searchAllSessions(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      results.value = []
      totalMatches.value = 0
      return []
    }

    isSearching.value = true
    searchQuery.value = query

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    try {
      // Iterate through all sessions
      for (const session of sessionStore.sessions) {
        const messages = sessionStore.loadMessages(session.id)

        for (const message of messages) {
          const text = extractText(message.content)
          const lowerText = text.toLowerCase()

          if (lowerText.includes(lowerQuery)) {
            // Find the matched text with context
            const matchIndex = lowerText.indexOf(lowerQuery)
            const contextStart = Math.max(0, matchIndex - 50)
            const contextEnd = Math.min(
              text.length,
              matchIndex + query.length + 50
            )
            let matchedText = text.slice(contextStart, contextEnd)

            // Add ellipsis if truncated
            if (contextStart > 0) matchedText = '...' + matchedText
            if (contextEnd < text.length) matchedText = matchedText + '...'

            searchResults.push({
              sessionId: session.id,
              sessionTitle: session.title,
              messageUuid: message.uuid,
              role: message.role,
              content: text,
              matchedText,
              timestamp: new Date(message.timestamp),
              projectPath: session.projectPath,
            })
          }
        }
      }

      // Sort by timestamp (newest first)
      searchResults.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )

      results.value = searchResults
      totalMatches.value = searchResults.length
    } finally {
      isSearching.value = false
    }

    return searchResults
  }

  // Get sessions that have search results
  const sessionsWithResults = computed(() => {
    const sessionMap = new Map<string, { session: Session; count: number }>()

    for (const result of results.value) {
      const existing = sessionMap.get(result.sessionId)
      if (existing) {
        existing.count++
      } else {
        const session = sessionStore.sessions.find(
          s => s.id === result.sessionId
        )
        if (session) {
          sessionMap.set(result.sessionId, { session, count: 1 })
        }
      }
    }

    return Array.from(sessionMap.values())
  })

  // Filter results by session
  function filterBySession(sessionId: string): SearchResult[] {
    return results.value.filter(r => r.sessionId === sessionId)
  }

  // Clear search
  function clearSearch() {
    searchQuery.value = ''
    results.value = []
    totalMatches.value = 0
  }

  // Highlight matched text in content
  function highlightMatch(text: string, query: string): string {
    if (!query) return text
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  return {
    searchQuery,
    results,
    isSearching,
    totalMatches,
    sessionsWithResults,
    searchAllSessions,
    filterBySession,
    clearSearch,
    highlightMatch,
  }
}
