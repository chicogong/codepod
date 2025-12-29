<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NTree, NIcon, NSpin, NEmpty, NButton, NTooltip } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import {
  FolderOutline,
  FolderOpenOutline,
  DocumentOutline,
  RefreshOutline,
  ChevronUpOutline,
} from '@vicons/ionicons5'
import { invoke } from '@tauri-apps/api/core'
import type { FileEntry, DirectoryListing, FileTreeNode } from '@/types'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

const props = defineProps<{
  rootPath?: string
  showHidden?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', file: FileEntry): void
  (e: 'open', file: FileEntry): void
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const currentPath = ref('')
const entries = ref<FileEntry[]>([])
const parentPath = ref<string | null>(null)
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])

// File type icons mapping
const getFileIcon = (entry: FileEntry) => {
  if (entry.is_dir) {
    return expandedKeys.value.includes(entry.path)
      ? FolderOpenOutline
      : FolderOutline
  }
  return DocumentOutline
}

// Convert entries to tree nodes (as TreeOption for NTree compatibility)
const treeData = computed<TreeOption[]>(() => {
  const filtered = props.showHidden
    ? entries.value
    : entries.value.filter(e => !e.is_hidden)

  return filtered.map(entry => ({
    key: entry.path,
    label: entry.name,
    isLeaf: !entry.is_dir,
    prefix: () =>
      h(NIcon, { size: 16 }, { default: () => h(getFileIcon(entry)) }),
    path: entry.path,
    isDir: entry.is_dir,
    isFile: entry.is_file,
    isHidden: entry.is_hidden,
    extension: entry.extension,
    size: entry.size,
  }))
})

// Load directory contents
async function loadDirectory(path: string) {
  if (!path) return

  isLoading.value = true
  error.value = null

  try {
    const result = await invoke<CommandResult<DirectoryListing>>(
      'list_directory',
      { path }
    )

    if (result.success && result.data) {
      currentPath.value = result.data.path
      entries.value = result.data.entries
      parentPath.value = result.data.parent || null
    } else {
      error.value = result.error || 'Failed to load directory'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

// Handle node selection
function handleSelect(keys: string[], option: (TreeOption | null)[]) {
  selectedKeys.value = keys
  if (option.length > 0) {
    const node = option[0] as FileTreeNode | null
    if (node) {
      emit('select', {
        name: node.label as string,
        path: node.path,
        is_dir: node.isDir,
        is_file: node.isFile,
        is_hidden: node.isHidden,
        extension: node.extension,
        size: node.size,
      })
    }
  }
}

// Handle node expand (for directories)
async function handleExpand(keys: string[], _option: (TreeOption | null)[]) {
  expandedKeys.value = keys
  // Could load subdirectory contents here for lazy loading
}

// Handle double click to open file
const handleNodeProps = (info: { option: TreeOption }) => {
  const node = info.option as unknown as FileTreeNode
  return {
    ondblclick: () => {
      if (node.isFile) {
        emit('open', {
          name: node.label as string,
          path: node.path,
          is_dir: node.isDir,
          is_file: node.isFile,
          is_hidden: node.isHidden,
          extension: node.extension,
          size: node.size,
        })
      } else if (node.isDir) {
        // Navigate into directory
        loadDirectory(node.path)
      }
    },
  }
}

// Navigate to parent directory
function goToParent() {
  if (parentPath.value) {
    loadDirectory(parentPath.value)
  }
}

// Refresh current directory
function refresh() {
  if (currentPath.value) {
    loadDirectory(currentPath.value)
  }
}

// Watch for root path changes
watch(
  () => props.rootPath,
  newPath => {
    if (newPath) {
      loadDirectory(newPath)
    }
  },
  { immediate: true }
)

// Expose methods for parent component
defineExpose({
  loadDirectory,
  refresh,
  currentPath,
})
</script>

<template>
  <div class="file-explorer">
    <!-- Toolbar -->
    <div class="explorer-toolbar">
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton
            quaternary
            size="small"
            :disabled="!parentPath"
            @click="goToParent"
          >
            <template #icon>
              <NIcon :component="ChevronUpOutline" />
            </template>
          </NButton>
        </template>
        Go to parent directory
      </NTooltip>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButton
            quaternary
            size="small"
            :loading="isLoading"
            @click="refresh"
          >
            <template #icon>
              <NIcon :component="RefreshOutline" />
            </template>
          </NButton>
        </template>
        Refresh
      </NTooltip>

      <div class="current-path" :title="currentPath">
        {{ currentPath || 'No directory selected' }}
      </div>
    </div>

    <!-- Tree View -->
    <div class="explorer-content">
      <NSpin :show="isLoading">
        <NEmpty v-if="error" :description="error" />
        <NEmpty
          v-else-if="entries.length === 0 && !isLoading"
          description="Empty directory"
        />
        <NTree
          v-else
          block-line
          :data="treeData"
          :expanded-keys="expandedKeys"
          :selected-keys="selectedKeys"
          :node-props="handleNodeProps"
          @update:expanded-keys="handleExpand"
          @update:selected-keys="handleSelect"
        />
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.current-path {
  flex: 1;
  font-size: 12px;
  color: var(--n-text-color-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 8px;
}

.explorer-content {
  flex: 1;
  overflow: auto;
  padding: 4px;
}

.explorer-content :deep(.n-tree) {
  font-size: 13px;
}

.explorer-content :deep(.n-tree-node) {
  padding: 2px 0;
}

.explorer-content :deep(.n-tree-node-content) {
  padding: 4px 8px;
  border-radius: 4px;
}

.explorer-content :deep(.n-tree-node-content:hover) {
  background: var(--n-node-color-hover);
}

.explorer-content :deep(.n-tree-node--selected .n-tree-node-content) {
  background: var(--n-node-color-active);
}
</style>
