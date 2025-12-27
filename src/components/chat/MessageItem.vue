<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message, ContentBlock } from '@/types'
import CodeBlock from './CodeBlock.vue'

const props = defineProps<{
  message: Message
  searchQuery?: string
}>()

interface ParsedContent {
  type: 'text' | 'code'
  content: string
  language?: string
}

// 复制状态
const copySuccess = ref(false)
// 反馈状态
const feedback = ref<'up' | 'down' | null>(null)

// Parse text content to extract code blocks
function parseContent(text: string): ParsedContent[] {
  const parts: ParsedContent[] = []
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockPattern.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index)
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore })
      }
    }

    // Add code block
    parts.push({
      type: 'code',
      content: match[2]?.trim() ?? '',
      language: match[1] || undefined,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining })
    }
  }

  // If no code blocks found, return original text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}

function renderTextContent(block: ContentBlock): string {
  if (block.type === 'text') {
    return block.text
  }
  if (block.type === 'thinking') {
    return block.thinking
  }
  return ''
}

function isTextBlock(block: ContentBlock): boolean {
  return block.type === 'text' || block.type === 'thinking'
}

// Get parsed content for a block
function getParsedContent(block: ContentBlock): ParsedContent[] {
  const text = renderTextContent(block)
  return parseContent(text)
}

// Highlight search matches in text
function highlightText(text: string): string {
  if (!props.searchQuery?.trim()) return escapeHtml(text)

  const query = props.searchQuery.toLowerCase()
  const escaped = escapeHtml(text)
  const lowerEscaped = escaped.toLowerCase()

  let result = ''
  let lastIndex = 0
  let pos = 0

  while ((pos = lowerEscaped.indexOf(query, lastIndex)) !== -1) {
    result += escaped.slice(lastIndex, pos)
    result += `<mark class="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">${escaped.slice(pos, pos + query.length)}</mark>`
    lastIndex = pos + query.length
  }

  result += escaped.slice(lastIndex)
  return result
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Check if message matches search
const matchesSearch = computed(() => {
  if (!props.searchQuery?.trim()) return true

  const query = props.searchQuery.toLowerCase()
  return props.message.content.some(block => {
    const text = renderTextContent(block).toLowerCase()
    return text.includes(query)
  })
})

// 获取完整文本内容（用于复制）
function getFullText(): string {
  return props.message.content
    .map(block => {
      if (block.type === 'text') return block.text
      if (block.type === 'thinking') return block.thinking
      if (block.type === 'tool_result') return block.content
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

// 复制消息内容
async function copyMessage() {
  try {
    await navigator.clipboard.writeText(getFullText())
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 处理反馈
function handleFeedback(type: 'up' | 'down') {
  // Toggle: 再次点击相同的则取消
  if (feedback.value === type) {
    feedback.value = null
  } else {
    feedback.value = type
  }
  // 可以扩展：发送到后端
  console.log('Feedback:', type, props.message.uuid)
}
</script>

<template>
  <div
    class="mb-6 last:mb-0 transition-opacity group"
    :class="[
      message.role === 'user' ? 'text-right' : 'text-left',
      matchesSearch ? 'opacity-100' : 'opacity-30',
    ]"
  >
    <!-- Role Label -->
    <div
      class="text-xs font-medium mb-1"
      :class="
        message.role === 'user'
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-500 dark:text-gray-400'
      "
    >
      {{ message.role === 'user' ? 'You' : 'Claude' }}
    </div>

    <!-- Message Content -->
    <div
      class="inline-block max-w-[85%] px-4 py-3 rounded-2xl text-left"
      :class="
        message.role === 'user'
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      "
    >
      <template v-for="(block, index) in message.content" :key="index">
        <!-- Text/Code Content with Highlighting -->
        <template v-if="isTextBlock(block) && block.type === 'text'">
          <template
            v-for="(part, partIndex) in getParsedContent(block)"
            :key="`${index}-${partIndex}`"
          >
            <div
              v-if="part.type === 'text'"
              class="whitespace-pre-wrap break-words"
              v-html="highlightText(part.content)"
            />
            <CodeBlock v-else :code="part.content" :language="part.language" />
          </template>
        </template>

        <!-- Thinking Block -->
        <details
          v-if="block.type === 'thinking'"
          class="mt-2 text-sm opacity-70"
        >
          <summary class="cursor-pointer">Thinking...</summary>
          <div
            class="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600"
            v-html="highlightText(block.thinking)"
          />
        </details>

        <!-- Tool Use -->
        <div
          v-if="block.type === 'tool_use'"
          class="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-sm"
        >
          <div class="font-mono text-xs text-gray-500 dark:text-gray-400">
            Tool: {{ block.name }}
          </div>
        </div>

        <!-- Tool Result -->
        <div
          v-if="block.type === 'tool_result'"
          class="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          :class="{ 'border-l-2 border-red-500': block.is_error }"
        >
          <pre
            class="whitespace-pre-wrap font-mono text-xs"
            v-html="highlightText(block.content)"
          />
        </div>
      </template>
    </div>

    <!-- Action Buttons (hover to show) -->
    <div
      class="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <!-- Copy Button -->
      <button
        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :title="copySuccess ? 'Copied!' : 'Copy message'"
        @click="copyMessage"
      >
        <!-- Check icon when copied -->
        <svg
          v-if="copySuccess"
          class="w-4 h-4 text-green-500"
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
        <!-- Copy icon -->
        <svg
          v-else
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
      </button>

      <!-- Feedback Buttons (only for assistant messages) -->
      <template v-if="message.role === 'assistant'">
        <!-- Thumbs Up -->
        <button
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="
            feedback === 'up'
              ? 'text-green-500'
              : 'text-gray-400 hover:text-green-500'
          "
          title="Good response"
          @click="handleFeedback('up')"
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
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
        </button>

        <!-- Thumbs Down -->
        <button
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="
            feedback === 'down'
              ? 'text-red-500'
              : 'text-gray-400 hover:text-red-500'
          "
          title="Bad response"
          @click="handleFeedback('down')"
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
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
        </button>
      </template>
    </div>

    <!-- Timestamp -->
    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {{ new Date(message.timestamp).toLocaleTimeString() }}
    </div>
  </div>
</template>
