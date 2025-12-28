import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session } from '@/types'

export interface Tab {
  id: string
  sessionId: string
  title: string
  isActive: boolean
}

const MAX_TABS = 10

export const useTabsStore = defineStore('tabs', () => {
  // State
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)

  // Getters
  const activeTab = computed(() =>
    tabs.value.find(t => t.id === activeTabId.value)
  )

  const tabCount = computed(() => tabs.value.length)

  const canAddTab = computed(() => tabs.value.length < MAX_TABS)

  // Actions
  function addTab(session: Session): Tab {
    // Check if session is already open in a tab
    const existingTab = tabs.value.find(t => t.sessionId === session.id)
    if (existingTab) {
      setActiveTab(existingTab.id)
      return existingTab
    }

    // Check max tabs
    if (!canAddTab.value) {
      // Close oldest inactive tab
      const inactiveTab = tabs.value.find(t => t.id !== activeTabId.value)
      if (inactiveTab) {
        closeTab(inactiveTab.id)
      }
    }

    const tab: Tab = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      title: session.title,
      isActive: true,
    }

    // Deactivate other tabs
    tabs.value.forEach(t => (t.isActive = false))

    tabs.value.push(tab)
    activeTabId.value = tab.id

    saveTabs()
    return tab
  }

  function closeTab(tabId: string) {
    const index = tabs.value.findIndex(t => t.id === tabId)
    if (index === -1) return

    const wasActive = tabs.value[index]?.isActive

    tabs.value.splice(index, 1)

    // If we closed the active tab, activate another
    if (wasActive && tabs.value.length > 0) {
      const newActiveIndex = Math.min(index, tabs.value.length - 1)
      const newActiveTab = tabs.value[newActiveIndex]
      if (newActiveTab) {
        newActiveTab.isActive = true
        activeTabId.value = newActiveTab.id
      }
    } else if (tabs.value.length === 0) {
      activeTabId.value = null
    }

    saveTabs()
  }

  function setActiveTab(tabId: string) {
    tabs.value.forEach(t => {
      t.isActive = t.id === tabId
    })
    activeTabId.value = tabId
    saveTabs()
  }

  function updateTabTitle(tabId: string, title: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.title = title
      saveTabs()
    }
  }

  function updateTabBySessionId(sessionId: string, updates: Partial<Tab>) {
    const tab = tabs.value.find(t => t.sessionId === sessionId)
    if (tab) {
      Object.assign(tab, updates)
      saveTabs()
    }
  }

  // Persistence
  function saveTabs() {
    try {
      localStorage.setItem(
        'codepod_tabs',
        JSON.stringify({ tabs: tabs.value, activeTabId: activeTabId.value })
      )
    } catch (e) {
      console.error('[Tabs] Failed to save tabs:', e)
    }
  }

  function loadTabs() {
    try {
      const stored = localStorage.getItem('codepod_tabs')
      if (stored) {
        const data = JSON.parse(stored) as {
          tabs: Tab[]
          activeTabId: string | null
        }
        tabs.value = data.tabs || []
        activeTabId.value = data.activeTabId
      }
    } catch (e) {
      console.error('[Tabs] Failed to load tabs:', e)
    }
  }

  function clearTabs() {
    tabs.value = []
    activeTabId.value = null
    saveTabs()
  }

  return {
    // State
    tabs,
    activeTabId,

    // Getters
    activeTab,
    tabCount,
    canAddTab,

    // Actions
    addTab,
    closeTab,
    setActiveTab,
    updateTabTitle,
    updateTabBySessionId,
    loadTabs,
    clearTabs,
  }
})
