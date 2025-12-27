import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearch } from '@/composables/useSearch'
import { useChatStore } from '@/stores'

describe('useSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with empty search query', () => {
      const { searchQuery, isSearchOpen } = useSearch()
      expect(searchQuery.value).toBe('')
      expect(isSearchOpen.value).toBe(false)
    })
  })

  describe('toggleSearch', () => {
    it('opens and closes search', () => {
      const { isSearchOpen, toggleSearch } = useSearch()

      toggleSearch()
      expect(isSearchOpen.value).toBe(true)

      toggleSearch()
      expect(isSearchOpen.value).toBe(false)
    })
  })

  describe('openSearch / closeSearch', () => {
    it('opens search', () => {
      const { isSearchOpen, openSearch } = useSearch()

      openSearch()
      expect(isSearchOpen.value).toBe(true)
    })

    it('closes search and clears query', () => {
      const { isSearchOpen, searchQuery, openSearch, closeSearch, setQuery } =
        useSearch()

      openSearch()
      setQuery('test')
      expect(searchQuery.value).toBe('test')

      closeSearch()
      expect(isSearchOpen.value).toBe(false)
      expect(searchQuery.value).toBe('')
    })
  })

  describe('searchResults', () => {
    it('returns empty array when query is empty', () => {
      const { searchResults } = useSearch()
      expect(searchResults.value).toEqual([])
    })

    it('finds messages matching query', () => {
      const chatStore = useChatStore()
      chatStore.addUserMessage('Hello world')
      chatStore.addAssistantMessage([{ type: 'text', text: 'Hi there!' }])

      const { searchResults, setQuery } = useSearch()
      setQuery('hello')

      expect(searchResults.value.length).toBe(1)
      expect(searchResults.value[0].message.role).toBe('user')
    })

    it('returns result count', () => {
      const chatStore = useChatStore()
      chatStore.addUserMessage('Hello world')
      chatStore.addUserMessage('Hello again')

      const { resultCount, setQuery } = useSearch()
      setQuery('hello')

      expect(resultCount.value).toBe(2)
    })

    it('searches case-insensitively', () => {
      const chatStore = useChatStore()
      chatStore.addUserMessage('HELLO world')

      const { searchResults, setQuery } = useSearch()
      setQuery('hello')

      expect(searchResults.value.length).toBe(1)
    })
  })
})
