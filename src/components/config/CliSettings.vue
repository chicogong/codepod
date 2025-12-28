<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { claudeHttpService, type CliType } from '@/services/claudeHttp'

const currentCli = ref<CliType>('claude')
const cliPath = ref('')
const availableClis = ref<{ claude: boolean; codebuddy: boolean }>({
  claude: false,
  codebuddy: false,
})
const isLoading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function loadCliStatus() {
  isLoading.value = true
  error.value = null

  try {
    // 先检查健康状态
    const isHealthy = await claudeHttpService.checkHealth()
    if (!isHealthy) {
      error.value = 'Proxy server is not running. Start it with: npm run proxy'
      return
    }

    // 获取 CLI 状态
    const status = await claudeHttpService.getCliStatus()
    if (status) {
      currentCli.value = status.currentCli
      cliPath.value = status.cliPath
    }

    // 获取可用的 CLI
    availableClis.value = claudeHttpService.getAvailableClis()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load CLI status'
  } finally {
    isLoading.value = false
  }
}

async function switchCli(cliType: CliType) {
  if (cliType === currentCli.value) return

  isLoading.value = true
  error.value = null
  success.value = null

  try {
    const result = await claudeHttpService.setCliType(cliType)
    if (result) {
      currentCli.value = cliType
      success.value = `Switched to ${cliType} CLI`
      // 刷新状态
      await loadCliStatus()
    } else {
      error.value = `Failed to switch to ${cliType} CLI`
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to switch CLI'
  } finally {
    isLoading.value = false
    // 3秒后清除成功消息
    if (success.value) {
      setTimeout(() => {
        success.value = null
      }, 3000)
    }
  }
}

onMounted(() => {
  loadCliStatus()
})
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium text-gray-900 dark:text-white">
        CLI Settings
      </h3>
      <button
        class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        :disabled="isLoading"
        @click="loadCliStatus"
      >
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-gray-500 dark:text-gray-400 text-sm">
      Loading...
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm"
    >
      {{ error }}
    </div>

    <!-- Success -->
    <div
      v-if="success"
      class="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm"
    >
      {{ success }}
    </div>

    <!-- CLI Selection -->
    <div v-if="!isLoading && !error" class="space-y-3">
      <!-- Current CLI Info -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Current CLI:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{
            currentCli
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Path:</span>
          <span
            class="font-mono text-xs text-gray-700 dark:text-gray-300 truncate ml-2"
            :title="cliPath"
            >{{ cliPath }}</span
          >
        </div>
      </div>

      <!-- CLI Options -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
          >Select CLI:</label
        >

        <!-- Claude Code -->
        <button
          class="w-full p-3 rounded-lg border-2 transition-all text-left"
          :class="[
            currentCli === 'claude'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          ]"
          :disabled="!availableClis.claude || isLoading"
          @click="switchCli('claude')"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🔮</span>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  Claude Code
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Official Anthropic Claude Code CLI
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                v-if="availableClis.claude"
                class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              >
                Available
              </span>
              <span
                v-else
                class="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              >
                Not Found
              </span>
              <span
                v-if="currentCli === 'claude'"
                class="text-primary-500 dark:text-primary-400"
              >
                ✓
              </span>
            </div>
          </div>
        </button>

        <!-- CodeBuddy -->
        <button
          class="w-full p-3 rounded-lg border-2 transition-all text-left"
          :class="[
            currentCli === 'codebuddy'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          ]"
          :disabled="!availableClis.codebuddy || isLoading"
          @click="switchCli('codebuddy')"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🤖</span>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  CodeBuddy
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  CodeBuddy Code CLI
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                v-if="availableClis.codebuddy"
                class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              >
                Available
              </span>
              <span
                v-else
                class="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              >
                Not Found
              </span>
              <span
                v-if="currentCli === 'codebuddy'"
                class="text-primary-500 dark:text-primary-400"
              >
                ✓
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- Help Text -->
      <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          <strong>Claude Code:</strong> Uses
          <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
            >--dangerously-skip-permissions</code
          >
          and
          <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
            >--verbose</code
          >
        </p>
        <p>
          <strong>CodeBuddy:</strong> Uses
          <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
            >-y</code
          >
          flag
        </p>
      </div>
    </div>
  </div>
</template>
