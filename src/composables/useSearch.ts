import { ref, computed } from 'vue'
import { useChatStore } from '@/stores'
import type { Message } from '@/types'

export interface SearchResult {
  message: Message
  matches: {
    blockIndex: number
    text: string
    highlight: { start: number; end: number }[]
  }[]
}

export function useSearch() {
  const chatStore = useChatStore()
  const searchQuery = ref('')
  const isSearchOpen = ref(false)

  const searchResults = computed<SearchResult[]>(() => {
    if (!searchQuery.value.trim()) return []

    const query = searchQuery.value.toLowerCase()
    const results: SearchResult[] = []

    for (const message of chatStore.messages) {
      const matches: SearchResult['matches'] = []

      message.content.forEach((block, blockIndex) => {
        let text = ''
        if (block.type === 'text') {
          text = block.text
        } else if (block.type === 'thinking') {
          text = block.thinking
        } else if (block.type === 'tool_result') {
          text = block.content
        }

        if (text) {
          const lowerText = text.toLowerCase()
          const highlights: { start: number; end: number }[] = []
          let pos = 0

          while ((pos = lowerText.indexOf(query, pos)) !== -1) {
            highlights.push({ start: pos, end: pos + query.length })
            pos += query.length
          }

          if (highlights.length > 0) {
            matches.push({ blockIndex, text, highlight: highlights })
          }
        }
      })

      if (matches.length > 0) {
        results.push({ message, matches })
      }
    }

    return results
  })

  const resultCount = computed(() => searchResults.value.length)

  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
    searchQuery.value = ''
  }

  function toggleSearch() {
    if (isSearchOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  function setQuery(query: string) {
    searchQuery.value = query
  }

  return {
    searchQuery,
    isSearchOpen,
    searchResults,
    resultCount,
    openSearch,
    closeSearch,
    toggleSearch,
    setQuery,
  }
}
