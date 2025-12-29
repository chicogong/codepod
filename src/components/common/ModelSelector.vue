<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { NModal, NIcon, NText, NScrollbar, NTag } from 'naive-ui'
import { CheckmarkOutline, SearchOutline } from '@vicons/ionicons5'
import { useChatStore } from '@/stores'
import { AVAILABLE_MODELS, type ModelId } from '@/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const chatStore = useChatStore()
const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

// Filter models based on search
const filteredModels = computed(() => {
  if (!searchQuery.value) return AVAILABLE_MODELS
  const query = searchQuery.value.toLowerCase()
  return AVAILABLE_MODELS.filter(
    model =>
      model.name.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query)
  )
})

// Watch for show changes
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      searchQuery.value = ''
      // Find current model index
      const currentIndex = filteredModels.value.findIndex(
        m => m.id === chatStore.currentModel
      )
      selectedIndex.value = currentIndex >= 0 ? currentIndex : 0
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

// Watch for search changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})

function close() {
  emit('update:show', false)
}

function selectModel(modelId: ModelId) {
  chatStore.setModel(modelId)
  close()
}

function handleKeyDown(event: KeyboardEvent) {
  const totalModels = filteredModels.value.length
  if (totalModels === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalModels
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value =
        (selectedIndex.value - 1 + totalModels) % totalModels
      break
    case 'Enter':
      event.preventDefault()
      if (filteredModels.value[selectedIndex.value]) {
        selectModel(filteredModels.value[selectedIndex.value].id)
      }
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}

// Get model provider badge color
function getProviderColor(modelId: string): string {
  if (modelId.includes('claude')) return 'warning'
  if (modelId.includes('gemini')) return 'info'
  if (modelId.includes('gpt')) return 'success'
  if (modelId.includes('deepseek')) return 'default'
  return 'default'
}

function getProviderName(modelId: string): string {
  if (modelId.includes('claude')) return 'Anthropic'
  if (modelId.includes('gemini')) return 'Google'
  if (modelId.includes('gpt')) return 'OpenAI'
  if (modelId.includes('deepseek')) return 'DeepSeek'
  return 'Other'
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="true"
    :close-on-esc="false"
    transform-origin="center"
    @update:show="emit('update:show', $event)"
  >
    <div class="model-selector" @keydown="handleKeyDown">
      <div class="header">
        <h3 class="title">Select Model</h3>
        <NText class="subtitle" depth="3">
          Current: {{ chatStore.currentModel }}
        </NText>
      </div>

      <div class="search-container">
        <NIcon :component="SearchOutline" class="search-icon" />
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search models..."
          @keydown="handleKeyDown"
        />
      </div>

      <NScrollbar class="models-container" style="max-height: 350px">
        <div
          v-for="(model, index) in filteredModels"
          :key="model.id"
          :class="[
            'model-item',
            {
              selected: index === selectedIndex,
              current: model.id === chatStore.currentModel,
            },
          ]"
          @click="selectModel(model.id)"
          @mouseenter="selectedIndex = index"
        >
          <div class="model-info">
            <div class="model-name-row">
              <span class="model-name">{{ model.name }}</span>
              <NTag
                :type="getProviderColor(model.id)"
                size="small"
                :bordered="false"
              >
                {{ getProviderName(model.id) }}
              </NTag>
            </div>
            <NText class="model-description" depth="3">
              {{ model.description }}
            </NText>
          </div>
          <NIcon
            v-if="model.id === chatStore.currentModel"
            :component="CheckmarkOutline"
            class="check-icon"
          />
        </div>

        <div v-if="filteredModels.length === 0" class="no-results">
          No models found
        </div>
      </NScrollbar>

      <div class="footer">
        <NText depth="3" class="hint">
          ↑↓ Navigate · Enter Select · Esc Close
        </NText>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.model-selector {
  width: 480px;
  max-width: 90vw;
  background: var(--n-color);
  border-radius: 12px;
  box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--n-border-color);
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 12px;
}

.search-container {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  gap: 12px;
}

.search-icon {
  font-size: 18px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--n-text-color);
}

.search-input::placeholder {
  color: var(--n-text-color-3);
}

.models-container {
  padding: 8px;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.model-item:hover,
.model-item.selected {
  background: var(--n-color-target);
}

.model-item.current {
  background: rgba(var(--n-primary-color-rgb), 0.1);
}

.model-item.current.selected {
  background: rgba(var(--n-primary-color-rgb), 0.15);
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
}

.model-description {
  font-size: 12px;
  display: block;
}

.check-icon {
  font-size: 18px;
  color: var(--n-primary-color);
  flex-shrink: 0;
  margin-left: 12px;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: var(--n-text-color-3);
  font-size: 14px;
}

.footer {
  padding: 12px 16px;
  border-top: 1px solid var(--n-border-color);
  text-align: center;
}

.hint {
  font-size: 11px;
}
</style>
