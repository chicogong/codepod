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
  NInput,
  NModal,
  useMessage,
} from 'naive-ui'
import {
  GitBranchOutline,
  RefreshOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  AddOutline,
  RemoveOutline,
  CloudUploadOutline,
  CloudDownloadOutline,
  CheckmarkOutline,
} from '@vicons/ionicons5'
import { invoke } from '@tauri-apps/api/core'
import type { GitStatus, GitFileStatus } from '@/types'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

const message = useMessage()

const props = defineProps<{
  path?: string
}>()

const isLoading = ref(false)
const isExecuting = ref(false)
const error = ref<string | null>(null)
const gitStatus = ref<GitStatus | null>(null)

// Commit modal state
const showCommitModal = ref(false)
const commitMessage = ref('')

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

// Git operations
async function stageAll() {
  if (!props.path) return

  isExecuting.value = true
  try {
    const result = await invoke<CommandResult<void>>('git_stage_all', {
      path: props.path,
    })

    if (result.success) {
      message.success('All files staged')
      await loadStatus()
    } else {
      message.error(result.error || 'Failed to stage files')
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : 'Failed to stage files')
  } finally {
    isExecuting.value = false
  }
}

async function unstageAll() {
  if (!props.path) return

  isExecuting.value = true
  try {
    const result = await invoke<CommandResult<void>>('git_unstage_all', {
      path: props.path,
    })

    if (result.success) {
      message.success('All files unstaged')
      await loadStatus()
    } else {
      message.error(result.error || 'Failed to unstage files')
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : 'Failed to unstage files')
  } finally {
    isExecuting.value = false
  }
}

function openCommitModal() {
  commitMessage.value = ''
  showCommitModal.value = true
}

async function doCommit() {
  if (!props.path || !commitMessage.value.trim()) return

  isExecuting.value = true
  try {
    const result = await invoke<CommandResult<void>>('git_commit', {
      path: props.path,
      message: commitMessage.value.trim(),
    })

    if (result.success) {
      message.success('Committed successfully')
      showCommitModal.value = false
      commitMessage.value = ''
      await loadStatus()
    } else {
      message.error(result.error || 'Failed to commit')
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : 'Failed to commit')
  } finally {
    isExecuting.value = false
  }
}

async function gitPush() {
  if (!props.path) return

  isExecuting.value = true
  try {
    const result = await invoke<CommandResult<void>>('git_push', {
      path: props.path,
    })

    if (result.success) {
      message.success('Pushed successfully')
      await loadStatus()
    } else {
      message.error(result.error || 'Failed to push')
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : 'Failed to push')
  } finally {
    isExecuting.value = false
  }
}

async function gitPull() {
  if (!props.path) return

  isExecuting.value = true
  try {
    const result = await invoke<CommandResult<void>>('git_pull', {
      path: props.path,
    })

    if (result.success) {
      message.success('Pulled successfully')
      await loadStatus()
    } else {
      message.error(result.error || 'Failed to pull')
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : 'Failed to pull')
  } finally {
    isExecuting.value = false
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

        <!-- Git actions -->
        <div class="git-actions">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                size="tiny"
                :disabled="isExecuting || !hasChanges"
                @click="stageAll"
              >
                <template #icon>
                  <NIcon :component="AddOutline" />
                </template>
                Stage
              </NButton>
            </template>
            Stage all changes
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                size="tiny"
                :disabled="isExecuting || !gitStatus.staged_count"
                @click="unstageAll"
              >
                <template #icon>
                  <NIcon :component="RemoveOutline" />
                </template>
                Unstage
              </NButton>
            </template>
            Unstage all changes
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                size="tiny"
                :disabled="isExecuting || !gitStatus.staged_count"
                @click="openCommitModal"
              >
                <template #icon>
                  <NIcon :component="CheckmarkOutline" />
                </template>
                Commit
              </NButton>
            </template>
            Commit staged changes
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton size="tiny" :disabled="isExecuting" @click="gitPull">
                <template #icon>
                  <NIcon :component="CloudDownloadOutline" />
                </template>
              </NButton>
            </template>
            Pull from remote
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                size="tiny"
                :disabled="isExecuting || gitStatus.ahead === 0"
                @click="gitPush"
              >
                <template #icon>
                  <NIcon :component="CloudUploadOutline" />
                </template>
              </NButton>
            </template>
            Push to remote
          </NTooltip>
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

    <!-- Commit Modal -->
    <NModal
      v-model:show="showCommitModal"
      preset="card"
      title="Commit Changes"
      :style="{ width: '400px' }"
      :bordered="false"
    >
      <NInput
        v-model:value="commitMessage"
        type="textarea"
        placeholder="Enter commit message..."
        :rows="4"
        :disabled="isExecuting"
        @keydown.ctrl.enter="doCommit"
        @keydown.meta.enter="doCommit"
      />
      <template #footer>
        <div class="modal-footer">
          <NButton @click="showCommitModal = false">Cancel</NButton>
          <NButton
            type="primary"
            :loading="isExecuting"
            :disabled="!commitMessage.trim()"
            @click="doCommit"
          >
            Commit
          </NButton>
        </div>
      </template>
    </NModal>
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

.git-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
