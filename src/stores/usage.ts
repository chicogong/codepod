import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Usage record for each API call
export interface UsageRecord {
  id: string
  timestamp: Date
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  sessionId?: string
  projectPath?: string
}

// Daily aggregated stats
export interface DailyStats {
  date: string // YYYY-MM-DD
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cost: number
  requestCount: number
  byModel: Record<string, { tokens: number; cost: number; count: number }>
}

// Model pricing per 1M tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-4.5': { input: 3.0, output: 15.0 },
  'claude-4-opus': { input: 15.0, output: 75.0 },
  'claude-4-sonnet': { input: 3.0, output: 15.0 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3.5-haiku': { input: 0.8, output: 4.0 },
  'claude-opus-4.5': { input: 15.0, output: 75.0 },
}

const STORAGE_KEY = 'codepod_usage_records'
const MAX_RECORDS = 1000 // Keep last 1000 records

export const useUsageStore = defineStore('usage', () => {
  // State
  const records = ref<UsageRecord[]>([])
  const isLoaded = ref(false)

  // Load from localStorage
  function loadRecords() {
    if (isLoaded.value) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        records.value = parsed.map((r: UsageRecord) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }))
      }
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load usage records:', e)
      records.value = []
      isLoaded.value = true
    }
  }

  // Save to localStorage
  function saveRecords() {
    try {
      // Keep only last MAX_RECORDS
      const toSave = records.value.slice(-MAX_RECORDS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.error('Failed to save usage records:', e)
    }
  }

  // Add a new usage record
  function addRecord(
    model: string,
    inputTokens: number,
    outputTokens: number,
    sessionId?: string,
    projectPath?: string
  ) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-4.5']
    const cost =
      (inputTokens / 1_000_000) * (pricing?.input ?? 3.0) +
      (outputTokens / 1_000_000) * (pricing?.output ?? 15.0)

    const record: UsageRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      cost,
      sessionId,
      projectPath,
    }

    records.value.push(record)
    saveRecords()
  }

  // Get daily stats for last N days
  const dailyStats = computed<DailyStats[]>(() => {
    const statsMap = new Map<string, DailyStats>()

    records.value.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0] ?? ''

      if (!statsMap.has(date)) {
        statsMap.set(date, {
          date,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          requestCount: 0,
          byModel: {},
        })
      }

      const stats = statsMap.get(date)!
      stats.totalTokens += record.inputTokens + record.outputTokens
      stats.inputTokens += record.inputTokens
      stats.outputTokens += record.outputTokens
      stats.cost += record.cost
      stats.requestCount += 1

      // Aggregate by model
      if (!stats.byModel[record.model]) {
        stats.byModel[record.model] = { tokens: 0, cost: 0, count: 0 }
      }
      const modelStats = stats.byModel[record.model]
      if (modelStats) {
        modelStats.tokens += record.inputTokens + record.outputTokens
        modelStats.cost += record.cost
        modelStats.count += 1
      }
    })

    // Sort by date descending
    return Array.from(statsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  // Total stats
  const totalStats = computed(() => {
    return records.value.reduce(
      (acc, r) => ({
        totalTokens: acc.totalTokens + r.inputTokens + r.outputTokens,
        inputTokens: acc.inputTokens + r.inputTokens,
        outputTokens: acc.outputTokens + r.outputTokens,
        cost: acc.cost + r.cost,
        requestCount: acc.requestCount + 1,
      }),
      {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        requestCount: 0,
      }
    )
  })

  // Stats for last 7 days
  const last7DaysStats = computed(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return records.value
      .filter(r => r.timestamp >= sevenDaysAgo)
      .reduce(
        (acc, r) => ({
          totalTokens: acc.totalTokens + r.inputTokens + r.outputTokens,
          inputTokens: acc.inputTokens + r.inputTokens,
          outputTokens: acc.outputTokens + r.outputTokens,
          cost: acc.cost + r.cost,
          requestCount: acc.requestCount + 1,
        }),
        {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          requestCount: 0,
        }
      )
  })

  // Stats by model
  const statsByModel = computed(() => {
    const modelStats = new Map<
      string,
      { tokens: number; cost: number; count: number }
    >()

    records.value.forEach(r => {
      if (!modelStats.has(r.model)) {
        modelStats.set(r.model, { tokens: 0, cost: 0, count: 0 })
      }
      const stats = modelStats.get(r.model)!
      stats.tokens += r.inputTokens + r.outputTokens
      stats.cost += r.cost
      stats.count += 1
    })

    return Array.from(modelStats.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost)
  })

  // Clear all records
  function clearRecords() {
    records.value = []
    saveRecords()
  }

  // Export records as JSON
  function exportRecords(): string {
    return JSON.stringify(records.value, null, 2)
  }

  return {
    // State
    records,
    isLoaded,

    // Getters
    dailyStats,
    totalStats,
    last7DaysStats,
    statsByModel,

    // Actions
    loadRecords,
    addRecord,
    clearRecords,
    exportRecords,
  }
})
