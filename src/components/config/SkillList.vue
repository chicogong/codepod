<script setup lang="ts">
import { useConfigStore } from '@/stores'

const configStore = useConfigStore()
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="space-y-2 flex justify-between items-end">
      <div>
        <h2
          class="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"
        >
          AI Skills
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Manage skill files loaded from
          <code
            class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs text-pink-600 dark:text-pink-400"
            >~/.claude/skills/</code
          >
        </p>
      </div>
      <button
        class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-pink-300 dark:hover:border-pink-700 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 font-medium text-sm"
        @click="configStore.loadSkills"
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          ></path>
        </svg>
        Reload Skills
      </button>
    </div>

    <!-- Skill List -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div
        v-for="skill in configStore.skills"
        :key="skill.name"
        class="group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-xl hover:-translate-y-1 hover:ring-pink-300 dark:hover:ring-pink-700"
      >
        <!-- Card Header -->
        <div
          class="p-5 flex items-start justify-between border-b border-gray-100 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-900/20"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xl shadow-sm"
            >
              🎯
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                {{ skill.name }}
              </h3>
              <p
                v-if="skill.description"
                class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1"
              >
                {{ skill.description }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full shadow-sm"
              :class="
                skill.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-500/20'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ring-1 ring-gray-500/20'
              "
            >
              {{ skill.enabled ? 'Enabled' : 'Disabled' }}
            </span>
            <!-- Toggle Switch -->
            <button
              class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="
                skill.enabled ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'
              "
              :title="skill.enabled ? 'Disable skill' : 'Enable skill'"
              @click="configStore.toggleSkill(skill.name)"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="skill.enabled ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-5 flex-1 flex flex-col gap-4">
          <!-- Preview -->
          <div class="mt-auto">
            <details class="group/details relative">
              <summary
                class="list-none cursor-pointer text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex items-center gap-1.5 transition-colors"
              >
                <svg
                  class="w-4 h-4 transition-transform group-open/details:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
                View Skill Content
              </summary>
              <div
                class="absolute z-10 top-full left-0 mt-2 w-full max-h-64 overflow-y-auto bg-gray-900 rounded-lg p-4 shadow-xl border border-gray-700"
              >
                <pre
                  class="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed"
                  >{{ skill.content }}</pre
                >
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="configStore.skills.length === 0"
      class="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700"
    >
      <div class="text-4xl mb-4 opacity-50">🎯</div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No Skills Found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
        Add markdown files with instructions to your
        <code class="font-mono text-xs">~/.claude/skills/</code> directory.
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
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

details > summary::-webkit-details-marker {
  display: none;
}
</style>
