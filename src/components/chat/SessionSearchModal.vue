<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NModal, NIcon, NText, NScrollbar, NSpin, NTag, NEmpty } from 'naive-ui'
import {
  SearchOutline,
  TimeOutline,
  PersonOutline,
  ChatboxOutline,
} from '@vicons/ionicons5'
import {
  useSessionSearch,
  type SearchResult,
} from '@/composables/useSessionSearch'
import { useChatStore, useSessionStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const chatStore = useChatStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()

const {
  searchQuery,
  results,
  isSearching,
  totalMatches,
  searchAllSessions,
  clearSearch,
  highlightMatch,
} = useSessionSearch()

const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch for show changes
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      clearSearch()
      selectedIndex.value = 0
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

// Debounced search
watch(searchQuery, newQuery => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    searchAllSessions(newQuery)
    selectedIndex.value = 0
  }, 300)
})

function close() {
  emit('update:show', false)
}

function navigateToResult(result: SearchResult) {
  // Find the session
  const session = sessionStore.sessions.find(s => s.id === result.sessionId)
  if (!session) return

  // Open the session in a tab
  tabsStore.addTab(session)
  chatStore.loadSessionFromStorage(result.sessionId)

  // TODO: Scroll to the specific message
  close()
}

function handleKeyDown(event: KeyboardEvent) {
  const totalResults = results.value.length
  if (totalResults === 0 && event.key !== 'Escape') return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalResults
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value =
        (selectedIndex.value - 1 + totalResults) % totalResults
      break
    case 'Enter': {
      event.preventDefault()
      const selectedResult = results.value[selectedIndex.value]
      if (selectedResult) {
        navigateToResult(selectedResult)
      }
      break
    }
    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="true"
    :close-on-esc="false"
    transform-origin="center"
    @update:show="emit('update:show', $event)"
  >
    <div class="session-search" @keydown="handleKeyDown">
      <div class="header">
        <h3 class="title">Search All Sessions</h3>
        <NText v-if="totalMatches > 0" class="result-count" depth="3">
          {{ totalMatches }} result{{ totalMatches !== 1 ? 's' : '' }}
        </NText>
      </div>

      <div class="search-container">
        <NIcon :component="SearchOutline" class="search-icon" />
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search messages across all sessions..."
          @keydown="handleKeyDown"
        />
        <NSpin v-if="isSearching" :size="16" />
      </div>

      <NScrollbar class="results-container" style="max-height: 450px">
        <template v-if="results.length > 0">
          <div
            v-for="(result, index) in results"
            :key="`${result.sessionId}-${result.messageUuid}`"
            :class="['result-item', { selected: index === selectedIndex }]"
            @click="navigateToResult(result)"
            @mouseenter="selectedIndex = index"
          >
            <div class="result-header">
              <div class="session-info">
                <NIcon :component="ChatboxOutline" class="session-icon" />
                <span class="session-title">{{ result.sessionTitle }}</span>
              </div>
              <div class="result-meta">
                <NTag
                  :type="result.role === 'user' ? 'info' : 'success'"
                  size="small"
                  :bordered="false"
                >
                  <template #icon>
                    <NIcon :component="PersonOutline" />
                  </template>
                  {{ result.role === 'user' ? 'You' : 'Assistant' }}
                </NTag>
                <span class="timestamp">
                  <NIcon :component="TimeOutline" :size="12" />
                  {{ formatDate(result.timestamp) }}
                </span>
              </div>
            </div>
            <div
              class="result-content"
              v-html="highlightMatch(result.matchedText, searchQuery)"
            />
          </div>
        </template>

        <NEmpty
          v-else-if="searchQuery && !isSearching"
          description="No results found"
          class="empty-state"
        />

        <div v-else-if="!searchQuery" class="hint-state">
          <NIcon :component="SearchOutline" :size="32" class="hint-icon" />
          <NText depth="3"
            >Enter a search term to search across all sessions</NText
          >
        </div>
      </NScrollbar>

      <div class="footer">
        <NText depth="3" class="hint">
          ↑↓ Navigate · Enter Open · Esc Close
        </NText>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.session-search {
  width: 640px;
  max-width: 90vw;
  background: var(--n-color);
  border-radius: 12px;
  box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--n-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0;
}

.result-count {
  font-size: 13px;
}

.search-container {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  gap: 12px;
}

.search-icon {
  font-size: 18px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--n-text-color);
}

.search-input::placeholder {
  color: var(--n-text-color-3);
}

.results-container {
  padding: 8px;
}

.result-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-bottom: 4px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-item:hover,
.result-item.selected {
  background: var(--n-color-target);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-icon {
  font-size: 14px;
  color: var(--n-text-color-3);
}

.session-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color);
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--n-text-color-3);
}

.result-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--n-text-color-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.result-content :deep(mark) {
  background: rgba(255, 213, 0, 0.4);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}

.empty-state {
  padding: 40px 20px;
}

.hint-state {
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hint-icon {
  color: var(--n-text-color-3);
}

.footer {
  padding: 12px 16px;
  border-top: 1px solid var(--n-border-color);
  text-align: center;
}

.hint {
  font-size: 11px;
}
</style>
