<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NSpin, NEmpty, NButton, NIcon } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { invoke } from '@tauri-apps/api/core'
import type { GitFileStatus } from '@/types'

interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

const props = defineProps<{
  show: boolean
  file: GitFileStatus | null
  path: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const diffContent = ref<string>('')

const diffLines = computed(() => {
  if (!diffContent.value) return []
  return diffContent.value.split('\n').map(line => {
    let type = 'context'
    if (line.startsWith('+') && !line.startsWith('+++')) type = 'add'
    else if (line.startsWith('-') && !line.startsWith('---')) type = 'remove'
    else if (line.startsWith('@@')) type = 'header'
    else if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('+++') ||
      line.startsWith('---')
    )
      type = 'meta'

    return { text: line, type }
  })
})

async function loadDiff() {
  if (!props.file || !props.path) return

  isLoading.value = true
  error.value = null
  diffContent.value = ''

  try {
    const result = await invoke<CommandResult<string>>('get_git_diff', {
      path: props.path,
      filePath: props.file.path,
      staged: props.file.staged,
    })

    if (result.success && result.data !== undefined) {
      diffContent.value = result.data
    } else {
      error.value = result.error || 'Failed to load git diff'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.show, props.file],
  ([newShow, newFile]) => {
    if (newShow && newFile) {
      loadDiff()
    }
  },
  { immediate: true }
)

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :style="{ width: '80vw', maxWidth: '1000px', height: '80vh' }"
    :title="file ? `Diff: ${file.path}` : 'Diff'"
    :bordered="false"
    size="huge"
    class="diff-modal"
    @update:show="$emit('update:show', $event)"
  >
    <template #header-extra>
      <NButton quaternary circle @click="handleClose">
        <template #icon>
          <NIcon :component="CloseOutline" />
        </template>
      </NButton>
    </template>

    <div
      class="diff-container bg-gray-50 dark:bg-gray-900 h-full overflow-hidden flex flex-col rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <NSpin :show="isLoading" class="flex-1 h-full">
        <div v-if="error" class="p-8">
          <NEmpty :description="error" />
        </div>
        <div v-else-if="!diffContent && !isLoading" class="p-8">
          <NEmpty description="No diff available (untracked or binary file)" />
        </div>
        <div
          v-else
          class="diff-content h-full overflow-auto font-mono text-xs p-4"
        >
          <div
            v-for="(line, index) in diffLines"
            :key="index"
            class="diff-line whitespace-pre"
            :class="{
              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300':
                line.type === 'add',
              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300':
                line.type === 'remove',
              'text-blue-600 dark:text-blue-400 font-bold':
                line.type === 'header',
              'text-gray-500 dark:text-gray-400 italic': line.type === 'meta',
              'text-gray-800 dark:text-gray-200': line.type === 'context',
            }"
          >
            {{ line.text || ' ' }}
          </div>
        </div>
      </NSpin>
    </div>
  </NModal>
</template>

<style scoped>
.diff-modal {
  display: flex;
  flex-direction: column;
}
:deep(.n-card__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}
.diff-line {
  line-height: 1.5;
  padding: 0 4px;
}
</style>
