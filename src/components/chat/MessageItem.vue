<script setup lang="ts">
import type { Message, ContentBlock } from '@/types'

defineProps<{
  message: Message
}>()

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
</script>

<template>
  <div
    class="mb-6 last:mb-0"
    :class="message.role === 'user' ? 'text-right' : 'text-left'"
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
        <!-- Text Content -->
        <div v-if="isTextBlock(block)" class="whitespace-pre-wrap break-words">
          {{ renderTextContent(block) }}
        </div>

        <!-- Thinking Block -->
        <details
          v-if="block.type === 'thinking'"
          class="mt-2 text-sm opacity-70"
        >
          <summary class="cursor-pointer">Thinking...</summary>
          <div
            class="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600"
          >
            {{ block.thinking }}
          </div>
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
          <pre class="whitespace-pre-wrap font-mono text-xs">{{
            block.content
          }}</pre>
        </div>
      </template>
    </div>

    <!-- Timestamp -->
    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {{ new Date(message.timestamp).toLocaleTimeString() }}
    </div>
  </div>
</template>
