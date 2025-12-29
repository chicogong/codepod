<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { NModal, NIcon, NText, NScrollbar } from 'naive-ui'
import {
  AddOutline,
  SearchOutline,
  MoonOutline,
  SunnyOutline,
  MenuOutline,
  SettingsOutline,
  TrashOutline,
  SwapHorizontalOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'
import { useAppStore, useChatStore } from '@/stores'

interface Command {
  id: string
  label: string
  shortcut?: string
  icon: typeof AddOutline
  action: () => void
  category: 'chat' | 'view' | 'settings'
}

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'openSettings'): void
  (e: 'openSearch'): void
  (e: 'openSessionSearch'): void
  (e: 'switchModel'): void
}>()

const appStore = useAppStore()
const chatStore = useChatStore()

const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

// Define all available commands
const commands = computed<Command[]>(() => [
  {
    id: 'new-chat',
    label: 'New Chat',
    shortcut: '⌘N',
    icon: AddOutline,
    action: () => {
      chatStore.clearMessages()
      close()
    },
    category: 'chat',
  },
  {
    id: 'clear-chat',
    label: 'Clear Current Chat',
    shortcut: '⌘L',
    icon: TrashOutline,
    action: () => {
      chatStore.clearMessages()
      close()
    },
    category: 'chat',
  },
  {
    id: 'search-messages',
    label: 'Search in Current Session',
    shortcut: '⌘F',
    icon: SearchOutline,
    action: () => {
      emit('openSearch')
      close()
    },
    category: 'chat',
  },
  {
    id: 'search-all-sessions',
    label: 'Search All Sessions',
    shortcut: '⇧⌘F',
    icon: DocumentTextOutline,
    action: () => {
      emit('openSessionSearch')
      close()
    },
    category: 'chat',
  },
  {
    id: 'switch-model',
    label: 'Switch Model',
    shortcut: '⌘/',
    icon: SwapHorizontalOutline,
    action: () => {
      emit('switchModel')
      close()
    },
    category: 'chat',
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    shortcut: '⌘B',
    icon: MenuOutline,
    action: () => {
      appStore.toggleSidebar()
      close()
    },
    category: 'view',
  },
  {
    id: 'toggle-dark-mode',
    label: appStore.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
    shortcut: '⌘D',
    icon: appStore.isDarkMode ? SunnyOutline : MoonOutline,
    action: () => {
      appStore.toggleDarkMode()
      close()
    },
    category: 'view',
  },
  {
    id: 'open-settings',
    label: 'Open Settings',
    shortcut: '⌘,',
    icon: SettingsOutline,
    action: () => {
      emit('openSettings')
      close()
    },
    category: 'settings',
  },
])

// Filter commands based on search query
const filteredCommands = computed(() => {
  if (!searchQuery.value) return commands.value
  const query = searchQuery.value.toLowerCase()
  return commands.value.filter(
    cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
  )
})

// Group commands by category
const groupedCommands = computed(() => {
  const groups: Record<string, Command[]> = {
    chat: [],
    view: [],
    settings: [],
  }
  filteredCommands.value.forEach(cmd => {
    const categoryArray = groups[cmd.category]
    if (categoryArray) {
      categoryArray.push(cmd)
    }
  })
  return groups
})

// Watch for show changes to reset state
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      searchQuery.value = ''
      selectedIndex.value = 0
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

// Watch for search changes to reset selection
watch(searchQuery, () => {
  selectedIndex.value = 0
})

function close() {
  emit('update:show', false)
}

function executeCommand(command: Command) {
  command.action()
}

function handleKeyDown(event: KeyboardEvent) {
  const totalCommands = filteredCommands.value.length
  if (totalCommands === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalCommands
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value =
        (selectedIndex.value - 1 + totalCommands) % totalCommands
      break
    case 'Enter': {
      event.preventDefault()
      const selectedCmd = filteredCommands.value[selectedIndex.value]
      if (selectedCmd) {
        executeCommand(selectedCmd)
      }
      break
    }
    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    chat: 'Chat',
    view: 'View',
    settings: 'Settings',
  }
  return labels[category] || category
}

function getGlobalIndex(category: string, localIndex: number): number {
  let globalIndex = 0
  const categories = ['chat', 'view', 'settings']
  for (const cat of categories) {
    if (cat === category) {
      return globalIndex + localIndex
    }
    const catCommands = groupedCommands.value[cat]
    globalIndex += catCommands ? catCommands.length : 0
  }
  return globalIndex
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
    <div class="command-palette" @keydown="handleKeyDown">
      <div class="search-container">
        <NIcon :component="SearchOutline" class="search-icon" />
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Type a command or search..."
          @keydown="handleKeyDown"
        />
      </div>

      <NScrollbar class="commands-container" style="max-height: 400px">
        <template
          v-for="category in ['chat', 'view', 'settings']"
          :key="category"
        >
          <div
            v-if="(groupedCommands[category] ?? []).length > 0"
            class="command-group"
          >
            <div class="group-label">{{ getCategoryLabel(category) }}</div>
            <div
              v-for="(command, index) in groupedCommands[category] ?? []"
              :key="command.id"
              :class="[
                'command-item',
                {
                  selected: getGlobalIndex(category, index) === selectedIndex,
                },
              ]"
              @click="executeCommand(command)"
              @mouseenter="selectedIndex = getGlobalIndex(category, index)"
            >
              <div class="command-left">
                <NIcon :component="command.icon" class="command-icon" />
                <span class="command-label">{{ command.label }}</span>
              </div>
              <NText v-if="command.shortcut" class="command-shortcut" depth="3">
                {{ command.shortcut }}
              </NText>
            </div>
          </div>
        </template>

        <div v-if="filteredCommands.length === 0" class="no-results">
          No commands found
        </div>
      </NScrollbar>
    </div>
  </NModal>
</template>

<style scoped>
.command-palette {
  width: 560px;
  max-width: 90vw;
  background: var(--n-color);
  border-radius: 12px;
  box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid var(--n-border-color);
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
  font-size: 15px;
  color: var(--n-text-color);
}

.search-input::placeholder {
  color: var(--n-text-color-3);
}

.commands-container {
  padding: 8px;
}

.command-group {
  margin-bottom: 8px;
}

.command-group:last-child {
  margin-bottom: 0;
}

.group-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--n-text-color-3);
  padding: 8px 12px 4px;
  letter-spacing: 0.5px;
}

.command-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.command-item:hover,
.command-item.selected {
  background: var(--n-color-target);
}

.command-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.command-icon {
  font-size: 18px;
  color: var(--n-text-color-2);
}

.command-label {
  font-size: 14px;
  color: var(--n-text-color);
}

.command-shortcut {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  padding: 2px 6px;
  background: var(--n-color-target);
  border-radius: 4px;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: var(--n-text-color-3);
  font-size: 14px;
}
</style>
