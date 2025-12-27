<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useHighlighter } from '@/composables/useHighlighter'
import { useAppStore } from '@/stores'

const props = defineProps<{
  code: string
  language?: string
}>()

const appStore = useAppStore()
const { highlight, detectLanguage, isLoading } = useHighlighter()

const highlightedCode = ref('')
const copied = ref(false)

const lang = computed(() => props.language || detectLanguage(props.code))

async function updateHighlight() {
  if (isLoading.value) return
  highlightedCode.value = await highlight(
    props.code,
    lang.value,
    appStore.isDarkMode
  )
}

// Update when code, language, or theme changes
watch(
  [() => props.code, () => props.language, () => appStore.isDarkMode],
  updateHighlight
)
onMounted(updateHighlight)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="relative group my-3 rounded-lg overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-gray-400 text-xs"
    >
      <span class="font-mono">{{ lang }}</span>
      <button
        class="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        @click="copyCode"
      >
        <svg
          v-if="!copied"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="w-4 h-4 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
      </button>
    </div>

    <!-- Code -->
    <div
      class="overflow-x-auto text-sm [&_pre]:!m-0 [&_pre]:!p-4 [&_pre]:!bg-gray-900 [&_code]:!bg-transparent"
      v-html="
        highlightedCode ||
        `<pre class='p-4 bg-gray-900'><code>${code}</code></pre>`
      "
    />
  </div>
</template>
