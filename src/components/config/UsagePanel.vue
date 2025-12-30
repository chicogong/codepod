<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useUsageStore } from '@/stores/usage'

const usageStore = useUsageStore()

// Tab state
type TimeRange = '7d' | '30d' | 'all'
const timeRange = ref<TimeRange>('7d')

onMounted(() => {
  usageStore.loadRecords()
})

// Format cost
function formatCost(cost: number): string {
  return cost < 0.01 ? '<$0.01' : `$${cost.toFixed(2)}`
}

// Format tokens
function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`
  }
  return tokens.toString()
}

// Get filtered stats based on time range
const filteredDailyStats = computed(() => {
  const stats = usageStore.dailyStats
  if (timeRange.value === 'all') return stats.slice(0, 30) // Max 30 days for display

  const days = timeRange.value === '7d' ? 7 : 30
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  return stats.filter(s => new Date(s.date) >= cutoff)
})

// Get max cost for chart scaling
const maxDailyCost = computed(() => {
  const costs = filteredDailyStats.value.map(s => s.cost)
  return Math.max(...costs, 0.01) // At least 0.01 to avoid division by zero
})

// Summary stats based on time range
const summaryStats = computed(() => {
  if (timeRange.value === '7d') {
    return usageStore.last7DaysStats
  }
  return usageStore.totalStats
})

// Export usage data
function exportData() {
  const data = usageStore.exportRecords()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `codepod-usage-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Clear all data
function clearData() {
  if (confirm('Clear all usage data? This cannot be undone.')) {
    usageStore.clearRecords()
  }
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- Header with time range selector -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Usage Analytics
      </h3>
      <div class="flex items-center gap-2">
        <button
          v-for="range in ['7d', '30d', 'all'] as TimeRange[]"
          :key="range"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          :class="
            timeRange === range
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          "
          @click="timeRange = range"
        >
          {{ range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All' }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Total Cost -->
      <div
        class="p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl"
      >
        <div class="text-sm text-primary-600 dark:text-primary-400 font-medium">
          Total Cost
        </div>
        <div
          class="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1"
        >
          {{ formatCost(summaryStats.cost) }}
        </div>
        <div class="text-xs text-primary-500 dark:text-primary-400 mt-1">
          {{ summaryStats.requestCount }} requests
        </div>
      </div>

      <!-- Total Tokens -->
      <div
        class="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl"
      >
        <div class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          Total Tokens
        </div>
        <div
          class="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1"
        >
          {{ formatTokens(summaryStats.totalTokens) }}
        </div>
        <div class="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
          {{ formatTokens(summaryStats.inputTokens) }} in /
          {{ formatTokens(summaryStats.outputTokens) }} out
        </div>
      </div>
    </div>

    <!-- Daily Cost Chart -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Daily Cost
      </h4>

      <!-- Empty state -->
      <div
        v-if="filteredDailyStats.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <div class="text-3xl mb-2">📊</div>
        <p>No usage data yet</p>
        <p class="text-xs mt-1">Start chatting to see statistics</p>
      </div>

      <!-- Chart -->
      <div v-else class="space-y-2">
        <div
          v-for="day in filteredDailyStats"
          :key="day.date"
          class="flex items-center gap-3"
        >
          <!-- Date label -->
          <div class="w-16 text-xs text-gray-500 dark:text-gray-400 text-right">
            {{ formatDate(day.date) }}
          </div>

          <!-- Bar -->
          <div
            class="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
          >
            <div
              class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded transition-all duration-300"
              :style="{ width: `${(day.cost / maxDailyCost) * 100}%` }"
            />
          </div>

          <!-- Cost label -->
          <div
            class="w-16 text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {{ formatCost(day.cost) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Usage by Model -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Usage by Model
      </h4>

      <div
        v-if="usageStore.statsByModel.length === 0"
        class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm"
      >
        No model data
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="model in usageStore.statsByModel"
          :key="model.model"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-primary-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ model.model }}
            </span>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCost(model.cost) }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTokens(model.tokens) }} tokens
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div
      class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        @click="exportData"
      >
        Export Data
      </button>
      <button
        class="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        @click="clearData"
      >
        Clear All Data
      </button>
    </div>
  </div>
</template>
