<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NIcon, NTooltip, NText, NScrollbar } from 'naive-ui'
import {
  CheckmarkOutline,
  CloseOutline,
  CopyOutline,
  CheckmarkDoneOutline,
} from '@vicons/ionicons5'
import { useDiff, type DiffResult, type DiffLine } from '@/composables/useDiff'
import { useHighlighter } from '@/composables/useHighlighter'

const props = defineProps<{
  oldCode: string
  newCode: string
  language?: string
  filename?: string
}>()

const emit = defineEmits<{
  (e: 'accept', code: string): void
  (e: 'reject', code: string): void
}>()

const { calculateDiff, applyChanges, rejectChanges } = useDiff()
const { highlight } = useHighlighter()

const copied = ref(false)
const selectedLines = ref<Set<number>>(new Set())

// Calculate diff result
const diffResult = computed<DiffResult>(() => {
  return calculateDiff(props.oldCode, props.newCode)
})

// Highlighted lines with syntax highlighting
const highlightedLines = computed(() => {
  return diffResult.value.lines.map(line => ({
    ...line,
    highlightedValue: highlight(line.value, props.language || 'text'),
  }))
})

// Stats
const stats = computed(() => ({
  added: diffResult.value.addedCount,
  removed: diffResult.value.removedCount,
  total: diffResult.value.lines.length,
}))

// Handle accept all changes
function handleAcceptAll() {
  const result = applyChanges(props.oldCode, props.newCode)
  emit('accept', result)
}

// Handle reject all changes
function handleRejectAll() {
  const result = rejectChanges(props.oldCode)
  emit('reject', result)
}

// Toggle line selection
function toggleLineSelection(index: number) {
  const line = diffResult.value.lines[index]
  if (!line || line.type === 'unchanged') return

  if (selectedLines.value.has(index)) {
    selectedLines.value.delete(index)
  } else {
    selectedLines.value.add(index)
  }
  // Trigger reactivity
  selectedLines.value = new Set(selectedLines.value)
}

// Copy new code to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.newCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Get line class based on type
function getLineClass(line: DiffLine, index: number): string[] {
  const classes = ['diff-line', `diff-${line.type}`]
  if (selectedLines.value.has(index)) {
    classes.push('selected')
  }
  if (line.type !== 'unchanged') {
    classes.push('selectable')
  }
  return classes
}

// Get line number display
function getLineNumbers(line: DiffLine): { old: string; new: string } {
  return {
    old: line.lineNumber.old?.toString() ?? '',
    new: line.lineNumber.new?.toString() ?? '',
  }
}
</script>

<template>
  <div class="diff-block">
    <!-- Header -->
    <div class="diff-header">
      <div class="header-left">
        <span v-if="filename" class="filename">{{ filename }}</span>
        <div class="stats">
          <span class="stat added">+{{ stats.added }}</span>
          <span class="stat removed">-{{ stats.removed }}</span>
        </div>
      </div>

      <div class="header-actions">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="copyToClipboard">
              <template #icon>
                <NIcon
                  :component="copied ? CheckmarkDoneOutline : CopyOutline"
                />
              </template>
            </NButton>
          </template>
          {{ copied ? 'Copied!' : 'Copy new code' }}
        </NTooltip>

        <NButton type="error" size="small" secondary @click="handleRejectAll">
          <template #icon>
            <NIcon :component="CloseOutline" />
          </template>
          Reject
        </NButton>

        <NButton type="success" size="small" @click="handleAcceptAll">
          <template #icon>
            <NIcon :component="CheckmarkOutline" />
          </template>
          Accept
        </NButton>
      </div>
    </div>

    <!-- Diff Content -->
    <NScrollbar class="diff-content" x-scrollable>
      <table class="diff-table">
        <tbody>
          <tr
            v-for="(line, index) in highlightedLines"
            :key="index"
            :class="getLineClass(line, index)"
            @click="toggleLineSelection(index)"
          >
            <td class="line-number old">{{ getLineNumbers(line).old }}</td>
            <td class="line-number new">{{ getLineNumbers(line).new }}</td>
            <td class="line-indicator">
              <span v-if="line.type === 'added'">+</span>
              <span v-else-if="line.type === 'removed'">-</span>
              <span v-else>&nbsp;</span>
            </td>
            <td class="line-content">
              <code v-html="line.highlightedValue || line.value || '&nbsp;'" />
            </td>
            <td v-if="line.type !== 'unchanged'" class="line-action">
              <NIcon
                v-if="selectedLines.has(index)"
                :component="CheckmarkOutline"
                class="check-icon"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </NScrollbar>

    <!-- Footer hint -->
    <div v-if="diffResult.hasChanges" class="diff-footer">
      <NText depth="3" class="hint">
        Click on changed lines to select them individually
      </NText>
    </div>
  </div>
</template>

<style scoped>
.diff-block {
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--n-color);
  margin: 12px 0;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--n-color-target);
  border-bottom: 1px solid var(--n-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: var(--n-text-color);
}

.stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.stat.added {
  color: #22c55e;
}

.stat.removed {
  color: #ef4444;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-content {
  max-height: 400px;
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.diff-line {
  transition: background-color 0.15s;
}

.diff-line.selectable {
  cursor: pointer;
}

.diff-line.selectable:hover {
  filter: brightness(0.95);
}

.diff-line.selected {
  outline: 2px solid var(--n-primary-color);
  outline-offset: -2px;
}

.diff-added {
  background: rgba(34, 197, 94, 0.15);
}

.diff-removed {
  background: rgba(239, 68, 68, 0.15);
}

.diff-unchanged {
  background: transparent;
}

.line-number {
  width: 40px;
  min-width: 40px;
  padding: 0 8px;
  text-align: right;
  color: var(--n-text-color-3);
  user-select: none;
  border-right: 1px solid var(--n-border-color);
}

.line-number.old {
  background: rgba(0, 0, 0, 0.02);
}

.line-indicator {
  width: 20px;
  min-width: 20px;
  text-align: center;
  color: var(--n-text-color-2);
  user-select: none;
}

.diff-added .line-indicator {
  color: #22c55e;
  font-weight: bold;
}

.diff-removed .line-indicator {
  color: #ef4444;
  font-weight: bold;
}

.line-content {
  padding: 0 12px;
  white-space: pre;
}

.line-content code {
  font-family: inherit;
}

.line-action {
  width: 30px;
  min-width: 30px;
  text-align: center;
}

.check-icon {
  color: var(--n-primary-color);
}

.diff-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--n-border-color);
  text-align: center;
}

.hint {
  font-size: 11px;
}

/* Dark mode adjustments */
:root.dark .diff-added {
  background: rgba(34, 197, 94, 0.2);
}

:root.dark .diff-removed {
  background: rgba(239, 68, 68, 0.2);
}

:root.dark .line-number.old {
  background: rgba(255, 255, 255, 0.02);
}
</style>
