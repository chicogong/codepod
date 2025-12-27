<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '@/stores'
import type { McpServerStdio, McpServerHttp } from '@/types/config'

const configStore = useConfigStore()

const showAddModal = ref(false)
const newServerName = ref('')
const newServerType = ref<'stdio' | 'http'>('stdio')
const newServerCommand = ref('')
const newServerArgs = ref('')
const newServerUrl = ref('')

function openAddModal() {
  newServerName.value = ''
  newServerType.value = 'stdio'
  newServerCommand.value = ''
  newServerArgs.value = ''
  newServerUrl.value = ''
  showAddModal.value = true
}

async function addServer() {
  if (!newServerName.value.trim()) return

  let config: McpServerStdio | McpServerHttp

  if (newServerType.value === 'stdio') {
    config = {
      type: 'stdio',
      command: newServerCommand.value,
      args: newServerArgs.value
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    }
  } else {
    config = {
      type: 'http',
      url: newServerUrl.value,
    }
  }

  configStore.addMcpServer(newServerName.value.trim(), config)
  await configStore.saveMcpConfig()
  showAddModal.value = false
}

async function removeServer(name: string) {
  if (confirm(`Remove server "${name}"?`)) {
    configStore.removeMcpServer(name)
    await configStore.saveMcpConfig()
  }
}

async function toggleServer(name: string) {
  configStore.toggleMcpServer(name)
  await configStore.saveMcpConfig()
}
</script>

<template>
  <div class="p-4">
    <!-- Add Button -->
    <button
      class="w-full mb-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
      @click="openAddModal"
    >
      + Add MCP Server
    </button>

    <!-- Server List -->
    <div class="space-y-3">
      <div
        v-for="server in configStore.mcpServers"
        :key="server.name"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              class="w-5 h-5 rounded border transition-colors"
              :class="
                server.enabled
                  ? 'bg-primary-600 border-primary-600'
                  : 'border-gray-300 dark:border-gray-600'
              "
              @click="toggleServer(server.name)"
            >
              <svg
                v-if="server.enabled"
                class="w-full h-full text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ server.name }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <span
                  v-if="server.type === 'stdio' || !server.type"
                  class="font-mono"
                >
                  {{ (server as McpServerStdio).command }}
                </span>
                <span v-else class="font-mono">
                  {{ (server as McpServerHttp).url }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            @click="removeServer(server.name)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="configStore.mcpServers.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        No MCP servers configured
      </div>
    </div>

    <!-- Add Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Add MCP Server
        </h3>

        <div class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Server Name
            </label>
            <input
              v-model="newServerName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="my-server"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Type
            </label>
            <select
              v-model="newServerType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="stdio">Stdio (Command)</option>
              <option value="http">HTTP (URL)</option>
            </select>
          </div>

          <template v-if="newServerType === 'stdio'">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Command
              </label>
              <input
                v-model="newServerCommand"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="npx"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Arguments (one per line)
              </label>
              <textarea
                v-model="newServerArgs"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="-y
@modelcontextprotocol/server-filesystem
/path/to/directory"
              />
            </div>
          </template>

          <template v-else>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                URL
              </label>
              <input
                v-model="newServerUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="http://localhost:3000"
              />
            </div>
          </template>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            @click="addServer"
          >
            Add Server
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
