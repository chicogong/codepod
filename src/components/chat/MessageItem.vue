<script setup lang="ts">
import { computed } from 'vue'
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
      content: match[2].trim(),
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
</script>

<template>
  <div
    class="mb-6 last:mb-0 transition-opacity"
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

    <!-- Timestamp -->
    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {{ new Date(message.timestamp).toLocaleTimeString() }}
    </div>
  </div>
</template>
