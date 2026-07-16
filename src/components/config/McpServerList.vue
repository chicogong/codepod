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
  <div class="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in relative">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h2
          class="text-2xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
        >
          MCP Servers
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Manage Model Context Protocol external integrations
        </p>
      </div>
      <button
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-medium text-sm"
        @click="openAddModal"
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
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Add Server
      </button>
    </div>

    <!-- Server List -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div
        v-for="server in configStore.mcpServers"
        :key="server.name"
        class="group relative flex bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-lg hover:-translate-y-1 hover:ring-emerald-300 dark:hover:ring-emerald-700"
      >
        <!-- Color bar indicating status -->
        <div
          class="w-2 shrink-0 transition-colors duration-300"
          :class="
            server.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
          "
        ></div>

        <div class="p-5 flex-1 flex items-start justify-between">
          <div class="flex gap-4">
            <!-- Icon -->
            <div class="mt-0.5">
              <div
                v-if="server.type === 'http'"
                class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shadow-sm"
              >
                🌐
              </div>
              <div
                v-else
                class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-sm"
              >
                💻
              </div>
            </div>

            <!-- Info -->
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                  {{ server.name }}
                </h3>
                <span
                  class="px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded-full border"
                  :class="
                    server.type === 'http'
                      ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                  "
                >
                  {{ server.type || 'stdio' }}
                </span>
              </div>

              <!-- Details -->
              <div
                class="text-sm text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-800"
              >
                <div
                  v-if="server.type === 'stdio' || !server.type"
                  class="font-mono text-xs break-all"
                >
                  <span
                    class="text-emerald-600 dark:text-emerald-400 font-semibold"
                    >{{ (server as McpServerStdio).command }}</span
                  >
                  <span
                    v-if="(server as McpServerStdio).args"
                    class="ml-1 text-gray-600 dark:text-gray-300"
                  >
                    {{ (server as McpServerStdio).args?.join(' ') }}
                  </span>
                </div>
                <div
                  v-else
                  class="font-mono text-xs break-all text-purple-600 dark:text-purple-400"
                >
                  {{ (server as McpServerHttp).url }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 items-end">
            <!-- Toggle Switch -->
            <button
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="
                server.enabled
                  ? 'bg-emerald-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              "
              @click="toggleServer(server.name)"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="server.enabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>

            <!-- Delete Button -->
            <button
              class="mt-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove Server"
              @click="removeServer(server.name)"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="configStore.mcpServers.length === 0"
      class="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700"
    >
      <div class="text-4xl mb-4 opacity-50">🔌</div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No MCP Servers Configured
      </h3>
      <p class="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-6">
        Connect to external tools, databases, and APIs using the Model Context
        Protocol.
      </p>
      <button
        class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-lg shadow-sm transition-all duration-200 font-medium text-sm inline-flex items-center gap-2"
        @click="openAddModal"
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
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Add Your First Server
      </button>
    </div>

    <!-- Add Modal with Glassmorphism -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      @click.self="showAddModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700 transform transition-all"
      >
        <h3
          class="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2"
        >
          🔌 Add New Server
        </h3>

        <div class="space-y-5">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Server Name
            </label>
            <input
              v-model="newServerName"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
              placeholder="e.g. postgres-db"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Connection Type
            </label>
            <select
              v-model="newServerType"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
            >
              <option value="stdio">Stdio (Local Command)</option>
              <option value="http">HTTP (Remote URL)</option>
            </select>
          </div>

          <template v-if="newServerType === 'stdio'">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Command
              </label>
              <input
                v-model="newServerCommand"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
                placeholder="npx"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Arguments
                <span class="text-gray-400 font-normal text-xs ml-1"
                  >(one per line)</span
                >
              </label>
              <textarea
                v-model="newServerArgs"
                rows="4"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none resize-none"
                placeholder="-y
@modelcontextprotocol/server-filesystem
/path/to/directory"
              />
            </div>
          </template>

          <template v-else>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                URL
              </label>
              <input
                v-model="newServerUrl"
                type="url"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
                placeholder="http://localhost:3000/mcp"
              />
            </div>
          </template>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button
            class="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            class="px-5 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors"
            :disabled="!newServerName.trim()"
            :class="{ 'opacity-50 cursor-not-allowed': !newServerName.trim() }"
            @click="addServer"
          >
            Add Server
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
