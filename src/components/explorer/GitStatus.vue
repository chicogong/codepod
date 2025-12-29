<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NList,
  NListItem,
  NTag,
  NIcon,
  NSpin,
  NEmpty,
  NButton,
  NTooltip,
  NBadge,
  NCollapse,
  NCollapseItem,
} from 'naive-ui'
import {
  GitBranchOutline,
  RefreshOutline,
  ArrowUpOutline,
  ArrowDownOutline,
} from '@vicons/ionicons5'
import { invoke } from '@tauri-apps/api/core'
import type { GitStatus, GitFileStatus } from '@/types'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

const props = defineProps<{
  path?: string
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const gitStatus = ref<GitStatus | null>(null)

// Status color mapping
const statusColors: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  M: 'warning',
  A: 'success',
  D: 'error',
  '?': 'info',
}

// Group files by status
const groupedFiles = computed(() => {
  if (!gitStatus.value?.files) return {}

  const groups: Record<string, GitFileStatus[]> = {
    staged: [],
    unstaged: [],
    untracked: [],
  }

  for (const file of gitStatus.value.files) {
    if (file.status === '?') {
      groups.untracked!.push(file)
    } else if (file.staged) {
      groups.staged!.push(file)
    } else {
      groups.unstaged!.push(file)
    }
  }

  return groups
})

// Has any changes
const hasChanges = computed(() => {
  if (!gitStatus.value) return false
  return (
    gitStatus.value.staged_count > 0 ||
    gitStatus.value.unstaged_count > 0 ||
    gitStatus.value.untracked_count > 0
  )
})

// Load git status
async function loadStatus() {
  if (!props.path) return

  isLoading.value = true
  error.value = null

  try {
    const result = await invoke<CommandResult<GitStatus>>('get_git_status', {
      path: props.path,
    })

    if (result.success && result.data) {
      gitStatus.value = result.data
    } else {
      error.value = result.error || 'Failed to load git status'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

// Watch for path changes
watch(
  () => props.path,
  () => {
    loadStatus()
  },
  { immediate: true }
)

// Expose refresh method
defineExpose({
  refresh: loadStatus,
})
</script>

<template>
  <div class="git-status">
    <NSpin :show="isLoading">
      <!-- Not a git repo -->
      <NEmpty
        v-if="gitStatus && !gitStatus.is_repo"
        description="Not a git repository"
        size="small"
      />

      <!-- Error state -->
      <NEmpty v-else-if="error" :description="error" size="small" />

      <!-- Git status -->
      <div v-else-if="gitStatus?.is_repo" class="git-content">
        <!-- Branch info -->
        <div class="branch-info">
          <NIcon :component="GitBranchOutline" size="16" />
          <span class="branch-name">{{ gitStatus.branch || 'HEAD' }}</span>

          <div
            v-if="gitStatus.ahead > 0 || gitStatus.behind > 0"
            class="sync-status"
          >
            <NTooltip v-if="gitStatus.ahead > 0" trigger="hover">
              <template #trigger>
                <NBadge :value="gitStatus.ahead" :max="99" type="info">
                  <NIcon :component="ArrowUpOutline" size="14" />
                </NBadge>
              </template>
              {{ gitStatus.ahead }} commit(s) ahead
            </NTooltip>

            <NTooltip v-if="gitStatus.behind > 0" trigger="hover">
              <template #trigger>
                <NBadge :value="gitStatus.behind" :max="99" type="warning">
                  <NIcon :component="ArrowDownOutline" size="14" />
                </NBadge>
              </template>
              {{ gitStatus.behind }} commit(s) behind
            </NTooltip>
          </div>

          <NButton quaternary size="tiny" @click="loadStatus">
            <template #icon>
              <NIcon :component="RefreshOutline" />
            </template>
          </NButton>
        </div>

        <!-- Conflict warning -->
        <NTag
          v-if="gitStatus.has_conflicts"
          type="error"
          size="small"
          class="conflict-tag"
        >
          Has merge conflicts
        </NTag>

        <!-- No changes -->
        <div v-if="!hasChanges" class="no-changes">Working tree clean</div>

        <!-- File changes -->
        <NCollapse
          v-else
          arrow-placement="left"
          :default-expanded-names="['staged', 'unstaged']"
        >
          <!-- Staged changes -->
          <NCollapseItem
            v-if="groupedFiles.staged?.length"
            name="staged"
            :title="`Staged Changes (${groupedFiles.staged.length})`"
          >
            <NList :show-divider="false" size="small">
              <NListItem v-for="file in groupedFiles.staged" :key="file.path">
                <div class="file-item">
                  <NTag
                    :type="statusColors[file.status] || 'default'"
                    size="tiny"
                  >
                    {{ file.status }}
                  </NTag>
                  <span class="file-path" :title="file.path">
                    {{ file.path }}
                  </span>
                </div>
              </NListItem>
            </NList>
          </NCollapseItem>

          <!-- Unstaged changes -->
          <NCollapseItem
            v-if="groupedFiles.unstaged?.length"
            name="unstaged"
            :title="`Changes (${groupedFiles.unstaged.length})`"
          >
            <NList :show-divider="false" size="small">
              <NListItem v-for="file in groupedFiles.unstaged" :key="file.path">
                <div class="file-item">
                  <NTag
                    :type="statusColors[file.status] || 'default'"
                    size="tiny"
                  >
                    {{ file.status }}
                  </NTag>
                  <span class="file-path" :title="file.path">
                    {{ file.path }}
                  </span>
                </div>
              </NListItem>
            </NList>
          </NCollapseItem>

          <!-- Untracked files -->
          <NCollapseItem
            v-if="groupedFiles.untracked?.length"
            name="untracked"
            :title="`Untracked (${groupedFiles.untracked.length})`"
          >
            <NList :show-divider="false" size="small">
              <NListItem
                v-for="file in groupedFiles.untracked"
                :key="file.path"
              >
                <div class="file-item">
                  <NTag type="info" size="tiny">?</NTag>
                  <span class="file-path" :title="file.path">
                    {{ file.path }}
                  </span>
                </div>
              </NListItem>
            </NList>
          </NCollapseItem>
        </NCollapse>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.git-status {
  padding: 8px;
}

.git-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.branch-name {
  font-weight: 500;
  font-size: 13px;
  flex: 1;
}

.sync-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.conflict-tag {
  align-self: flex-start;
}

.no-changes {
  color: var(--n-text-color-3);
  font-size: 12px;
  text-align: center;
  padding: 16px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.file-path {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.n-collapse-item__header-main) {
  font-size: 12px;
  font-weight: 500;
}

:deep(.n-list-item) {
  padding: 4px 0 !important;
}
</style>
