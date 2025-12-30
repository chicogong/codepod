<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NList,
  NListItem,
  NButton,
  NIcon,
  NEmpty,
  NModal,
  NInput,
  NPopconfirm,
  NTooltip,
  NSwitch,
  NInputNumber,
  NDivider,
  useMessage,
} from 'naive-ui'
import {
  BookmarkOutline,
  AddOutline,
  TrashOutline,
  CreateOutline,
  PlayBackOutline,
  SettingsOutline,
} from '@vicons/ionicons5'
import { useSessionStore, useChatStore, useAppStore } from '@/stores'
import type { Checkpoint } from '@/types'

const props = defineProps<{
  sessionId: string
}>()

const emit = defineEmits<{
  restore: [checkpoint: Checkpoint]
}>()

const message = useMessage()
const sessionStore = useSessionStore()
const chatStore = useChatStore()
const appStore = useAppStore()

// State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingCheckpoint = ref<Checkpoint | null>(null)
const checkpointName = ref('')
const checkpointDescription = ref('')
const showSettings = ref(false)

// Computed
const checkpoints = computed(() =>
  sessionStore.getSessionCheckpoints(props.sessionId)
)

const hasCheckpoints = computed(() => checkpoints.value.length > 0)

// Auto-checkpoint config
const autoCheckpointEnabled = computed({
  get: () => appStore.autoCheckpointConfig.enabled,
  set: (value: boolean) => {
    appStore.setAutoCheckpointConfig({ enabled: value })
  },
})

const autoCheckpointInterval = computed({
  get: () => appStore.autoCheckpointConfig.messageInterval,
  set: (value: number | null) => {
    if (value !== null && value > 0) {
      appStore.setAutoCheckpointConfig({ messageInterval: value })
    }
  },
})

const autoCheckpointPrefix = computed({
  get: () => appStore.autoCheckpointConfig.namePrefix,
  set: (value: string) => {
    appStore.setAutoCheckpointConfig({ namePrefix: value })
  },
})

// Create checkpoint
function openCreateModal() {
  checkpointName.value = `Checkpoint ${checkpoints.value.length + 1}`
  checkpointDescription.value = ''
  showCreateModal.value = true
}

function handleCreate() {
  if (!checkpointName.value.trim()) {
    message.warning('请输入检查点名称')
    return
  }

  try {
    sessionStore.createCheckpoint(
      props.sessionId,
      checkpointName.value.trim(),
      chatStore.messages,
      checkpointDescription.value.trim() || undefined
    )
    message.success('检查点已创建')
    showCreateModal.value = false
  } catch {
    message.error('创建检查点失败')
  }
}

// Edit checkpoint
function openEditModal(checkpoint: Checkpoint) {
  editingCheckpoint.value = checkpoint
  checkpointName.value = checkpoint.name
  checkpointDescription.value = checkpoint.description || ''
  showEditModal.value = true
}

function handleEdit() {
  if (!editingCheckpoint.value || !checkpointName.value.trim()) {
    message.warning('请输入检查点名称')
    return
  }

  try {
    sessionStore.updateCheckpoint(props.sessionId, editingCheckpoint.value.id, {
      name: checkpointName.value.trim(),
      description: checkpointDescription.value.trim() || undefined,
    })
    message.success('检查点已更新')
    showEditModal.value = false
    editingCheckpoint.value = null
  } catch {
    message.error('更新检查点失败')
  }
}

// Delete checkpoint
function handleDelete(checkpointId: string) {
  try {
    sessionStore.deleteCheckpoint(props.sessionId, checkpointId)
    message.success('检查点已删除')
  } catch {
    message.error('删除检查点失败')
  }
}

// Restore checkpoint
function handleRestore(checkpoint: Checkpoint) {
  emit('restore', checkpoint)
}

// Format timestamp
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} 小时前`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="checkpoint-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <NIcon :component="BookmarkOutline" size="18" />
        <span>检查点</span>
      </div>
      <div class="header-actions">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              size="small"
              quaternary
              @click="showSettings = !showSettings"
            >
              <template #icon>
                <NIcon :component="SettingsOutline" />
              </template>
            </NButton>
          </template>
          自动检查点设置
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton size="small" @click="openCreateModal">
              <template #icon>
                <NIcon :component="AddOutline" />
              </template>
              创建
            </NButton>
          </template>
          创建当前对话状态的检查点
        </NTooltip>
      </div>
    </div>

    <!-- Checkpoint List -->
    <div class="panel-content">
      <NEmpty
        v-if="!hasCheckpoints"
        description="暂无检查点"
        size="small"
        class="empty-state"
      >
        <template #icon>
          <NIcon :component="BookmarkOutline" size="48" />
        </template>
      </NEmpty>

      <NList v-else :show-divider="false" size="small">
        <NListItem
          v-for="checkpoint in checkpoints"
          :key="checkpoint.id"
          class="checkpoint-item"
        >
          <div class="checkpoint-content">
            <div class="checkpoint-info">
              <div class="checkpoint-name">{{ checkpoint.name }}</div>
              <div class="checkpoint-meta">
                <span class="message-count"
                  >{{ checkpoint.messageCount }} 消息</span
                >
                <span class="timestamp">
                  {{ formatTimestamp(checkpoint.timestamp) }}
                </span>
              </div>
              <div v-if="checkpoint.description" class="checkpoint-description">
                {{ checkpoint.description }}
              </div>
            </div>

            <div class="checkpoint-actions">
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    @click="handleRestore(checkpoint)"
                  >
                    <template #icon>
                      <NIcon :component="PlayBackOutline" />
                    </template>
                  </NButton>
                </template>
                恢复到此检查点
              </NTooltip>

              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    @click="openEditModal(checkpoint)"
                  >
                    <template #icon>
                      <NIcon :component="CreateOutline" />
                    </template>
                  </NButton>
                </template>
                编辑检查点
              </NTooltip>

              <NPopconfirm @positive-click="handleDelete(checkpoint.id)">
                <template #trigger>
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <NButton size="tiny" quaternary>
                        <template #icon>
                          <NIcon :component="TrashOutline" />
                        </template>
                      </NButton>
                    </template>
                    删除检查点
                  </NTooltip>
                </template>
                确定要删除此检查点吗？
              </NPopconfirm>
            </div>
          </div>
        </NListItem>
      </NList>

      <!-- Auto-checkpoint Settings -->
      <div v-if="showSettings" class="settings-section">
        <NDivider style="margin: 12px 0" />
        <div class="settings-header">
          <NIcon :component="SettingsOutline" size="16" />
          <span>自动检查点设置</span>
        </div>
        <div class="settings-content">
          <div class="setting-item">
            <div class="setting-label">
              <span>启用自动检查点</span>
            </div>
            <NSwitch v-model:value="autoCheckpointEnabled" />
          </div>
          <div v-if="autoCheckpointEnabled" class="setting-item">
            <div class="setting-label">
              <span>消息间隔</span>
              <span class="setting-hint">每 N 条消息自动创建检查点</span>
            </div>
            <NInputNumber
              v-model:value="autoCheckpointInterval"
              :min="1"
              :max="100"
              size="small"
              style="width: 100px"
            />
          </div>
          <div v-if="autoCheckpointEnabled" class="setting-item">
            <div class="setting-label">
              <span>检查点前缀</span>
              <span class="setting-hint">自动检查点的名称前缀</span>
            </div>
            <NInput
              v-model:value="autoCheckpointPrefix"
              size="small"
              placeholder="自动检查点"
              style="width: 150px"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create Checkpoint Modal -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="创建检查点"
      :style="{ width: '400px' }"
      :bordered="false"
    >
      <div class="modal-content">
        <div class="form-item">
          <label>名称</label>
          <NInput
            v-model:value="checkpointName"
            placeholder="输入检查点名称"
            @keydown.enter="handleCreate"
          />
        </div>
        <div class="form-item">
          <label>描述（可选）</label>
          <NInput
            v-model:value="checkpointDescription"
            type="textarea"
            placeholder="添加检查点描述"
            :rows="3"
          />
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton
            type="primary"
            :disabled="!checkpointName.trim()"
            @click="handleCreate"
          >
            创建
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Edit Checkpoint Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="编辑检查点"
      :style="{ width: '400px' }"
      :bordered="false"
    >
      <div class="modal-content">
        <div class="form-item">
          <label>名称</label>
          <NInput
            v-model:value="checkpointName"
            placeholder="输入检查点名称"
            @keydown.enter="handleEdit"
          />
        </div>
        <div class="form-item">
          <label>描述（可选）</label>
          <NInput
            v-model:value="checkpointDescription"
            type="textarea"
            placeholder="添加检查点描述"
            :rows="3"
          />
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton
            type="primary"
            :disabled="!checkpointName.trim()"
            @click="handleEdit"
          >
            保存
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.checkpoint-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  margin-top: 40px;
}

.checkpoint-item {
  padding: 12px !important;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.checkpoint-item:hover {
  background-color: var(--n-color-hover);
}

.checkpoint-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.checkpoint-info {
  flex: 1;
  min-width: 0;
}

.checkpoint-name {
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 4px;
}

.checkpoint-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-bottom: 4px;
}

.message-count::after {
  content: '·';
  margin-left: 8px;
}

.checkpoint-description {
  font-size: 12px;
  color: var(--n-text-color-2);
  margin-top: 4px;
  line-height: 1.4;
}

.checkpoint-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.n-list-item) {
  padding: 0 !important;
}

.settings-section {
  padding: 8px 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 12px;
  color: var(--n-text-color-2);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-label > span:first-child {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-1);
}

.setting-hint {
  font-size: 11px;
  color: var(--n-text-color-3);
}
</style>
