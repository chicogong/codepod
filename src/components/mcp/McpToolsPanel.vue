<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NTabs,
  NTabPane,
  NCollapse,
  NCollapseItem,
  NTag,
  NText,
  NEmpty,
  NScrollbar,
  NIcon,
  NTooltip,
  NButton,
} from 'naive-ui'
import {
  BuildOutline,
  TimeOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  HourglassOutline,
  TrashOutline,
  ServerOutline,
} from '@vicons/ionicons5'
import { useConfigStore } from '@/stores'
import type { McpToolCall } from '@/types/config'

const configStore = useConfigStore()
const activeTab = ref('tools')

// Group tools by server
const toolsByServer = computed(() => {
  const grouped: Record<string, typeof configStore.mcpTools> = {}
  for (const tool of configStore.mcpTools) {
    if (!grouped[tool.serverName]) {
      grouped[tool.serverName] = []
    }
    grouped[tool.serverName]!.push(tool)
  }
  return grouped
})

// Get status icon for tool call
function getStatusIcon(status: McpToolCall['status']) {
  switch (status) {
    case 'success':
      return CheckmarkCircleOutline
    case 'error':
      return CloseCircleOutline
    case 'pending':
      return HourglassOutline
    default:
      return HourglassOutline
  }
}

// Get status color
function getStatusType(
  status: McpToolCall['status']
): 'success' | 'error' | 'warning' {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'warning'
  }
}

// Format timestamp
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString()
}

// Format duration
function formatDuration(ms?: number): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Clear history
function clearHistory() {
  configStore.clearMcpToolCalls()
}
</script>

<template>
  <div class="mcp-tools-panel">
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- Available Tools Tab -->
      <NTabPane name="tools" tab="Tools">
        <NScrollbar style="max-height: 400px">
          <template v-if="Object.keys(toolsByServer).length > 0">
            <NCollapse arrow-placement="left" default-expanded-names="all">
              <NCollapseItem
                v-for="(tools, serverName) in toolsByServer"
                :key="serverName"
                :title="serverName"
                :name="serverName"
              >
                <template #header>
                  <div class="server-header">
                    <NIcon :component="ServerOutline" class="server-icon" />
                    <span class="server-name">{{ serverName }}</span>
                    <NTag size="small" :bordered="false">
                      {{ tools.length }} tools
                    </NTag>
                  </div>
                </template>

                <div class="tools-list">
                  <div v-for="tool in tools" :key="tool.name" class="tool-item">
                    <div class="tool-header">
                      <NIcon :component="BuildOutline" class="tool-icon" />
                      <span class="tool-name">{{ tool.name }}</span>
                    </div>
                    <NText
                      v-if="tool.description"
                      depth="3"
                      class="tool-description"
                    >
                      {{ tool.description }}
                    </NText>
                  </div>
                </div>
              </NCollapseItem>
            </NCollapse>
          </template>

          <NEmpty
            v-else
            description="No MCP tools available"
            class="empty-state"
          >
            <template #extra>
              <NText depth="3">
                Enable MCP servers to see available tools
              </NText>
            </template>
          </NEmpty>
        </NScrollbar>
      </NTabPane>

      <!-- Call History Tab -->
      <NTabPane name="history" tab="History">
        <div class="history-header">
          <NText depth="3"> {{ configStore.mcpToolCalls.length }} calls </NText>
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                quaternary
                size="tiny"
                :disabled="configStore.mcpToolCalls.length === 0"
                @click="clearHistory"
              >
                <template #icon>
                  <NIcon :component="TrashOutline" />
                </template>
              </NButton>
            </template>
            Clear history
          </NTooltip>
        </div>

        <NScrollbar style="max-height: 400px">
          <template v-if="configStore.recentToolCalls.length > 0">
            <div
              v-for="call in configStore.recentToolCalls"
              :key="call.id"
              class="call-item"
            >
              <div class="call-header">
                <div class="call-info">
                  <NIcon
                    :component="getStatusIcon(call.status)"
                    :class="['status-icon', call.status]"
                  />
                  <span class="call-name">{{ call.toolName }}</span>
                  <NTag size="small" :bordered="false">
                    {{ call.serverName }}
                  </NTag>
                </div>
                <div class="call-meta">
                  <span class="call-time">
                    <NIcon :component="TimeOutline" :size="12" />
                    {{ formatTime(call.timestamp) }}
                  </span>
                  <NTag
                    :type="getStatusType(call.status)"
                    size="small"
                    :bordered="false"
                  >
                    {{ formatDuration(call.duration) }}
                  </NTag>
                </div>
              </div>

              <!-- Input Preview -->
              <div v-if="Object.keys(call.input).length > 0" class="call-input">
                <NText depth="3" class="section-label">Input:</NText>
                <code class="input-preview">
                  {{ JSON.stringify(call.input, null, 2).slice(0, 200) }}
                  <span v-if="JSON.stringify(call.input).length > 200"
                    >...</span
                  >
                </code>
              </div>

              <!-- Output/Error Preview -->
              <div v-if="call.output || call.error" class="call-output">
                <NText depth="3" class="section-label">
                  {{ call.error ? 'Error:' : 'Output:' }}
                </NText>
                <code :class="['output-preview', { error: !!call.error }]">
                  {{ (call.error || call.output || '').slice(0, 200) }}
                  <span v-if="(call.error || call.output || '').length > 200"
                    >...</span
                  >
                </code>
              </div>
            </div>
          </template>

          <NEmpty v-else description="No tool calls yet" class="empty-state" />
        </NScrollbar>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.mcp-tools-panel {
  padding: 12px;
}

.server-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-icon {
  font-size: 16px;
  color: var(--n-text-color-2);
}

.server-name {
  font-weight: 500;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-item {
  padding: 8px 12px;
  background: var(--n-color-target);
  border-radius: 6px;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-icon {
  font-size: 14px;
  color: var(--n-primary-color);
}

.tool-name {
  font-size: 13px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.tool-description {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  padding-left: 22px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  margin-bottom: 8px;
}

.call-item {
  padding: 12px;
  background: var(--n-color-target);
  border-radius: 8px;
  margin-bottom: 8px;
}

.call-item:last-child {
  margin-bottom: 0;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.call-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #22c55e;
}

.status-icon.error {
  color: #ef4444;
}

.status-icon.pending {
  color: #f59e0b;
}

.call-name {
  font-size: 13px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.call-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.call-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--n-text-color-3);
}

.call-input,
.call-output {
  margin-top: 8px;
}

.section-label {
  font-size: 11px;
  display: block;
  margin-bottom: 4px;
}

.input-preview,
.output-preview {
  display: block;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--n-color);
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px;
  overflow: hidden;
}

.output-preview.error {
  color: #ef4444;
}

.empty-state {
  padding: 40px 20px;
}
</style>
