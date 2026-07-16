<script setup lang="ts">
import { useAppStore } from '@/stores'
import { themes } from '@/utils/terminalThemes'
import { computed } from 'vue'

const appStore = useAppStore()

const themeOptions = computed(() => {
  return Object.entries(themes).map(([id, theme]) => ({
    id,
    name: theme.name,
    type: theme.type,
    colors: theme.theme,
  }))
})
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div class="space-y-2">
      <h2
        class="text-2xl font-semibold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent"
      >
        Appearance
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        Customize the look and feel of your workspace.
      </p>
    </div>

    <!-- Terminal Theme -->
    <div class="space-y-4">
      <h3
        class="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2"
      >
        <span class="text-xl">🖥️</span> Terminal Theme
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="theme in themeOptions"
          :key="theme.id"
          class="group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          :class="[
            appStore.terminalTheme === theme.id
              ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md'
              : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-300 dark:hover:ring-primary-700',
          ]"
          @click="appStore.setTerminalTheme(theme.id)"
        >
          <!-- Mini Terminal Preview -->
          <div
            class="h-32 p-4 font-mono text-[13px] leading-relaxed flex flex-col transition-colors duration-300"
            :style="{ backgroundColor: theme.colors.background }"
          >
            <!-- Mac window dots -->
            <div class="flex gap-1.5 mb-4">
              <div
                class="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10 dark:border-white/10"
              ></div>
              <div
                class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10 dark:border-white/10"
              ></div>
              <div
                class="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10 dark:border-white/10"
              ></div>
            </div>

            <!-- Fake Code -->
            <div class="space-y-1">
              <div class="flex gap-2">
                <span :style="{ color: theme.colors.magenta }">~/codepod</span>
                <span :style="{ color: theme.colors.green }">❯</span>
                <span :style="{ color: theme.colors.foreground }">claude</span>
              </div>
              <div class="flex gap-2 pl-2">
                <span :style="{ color: theme.colors.blue }">CodePod</span>
                <span :style="{ color: theme.colors.foreground }"
                  >is running</span
                >
              </div>
              <div class="flex gap-2 pl-2">
                <span :style="{ color: theme.colors.yellow }">★</span>
                <span :style="{ color: theme.colors.cyan }"
                  >Ready for commands...</span
                >
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div
            class="p-4 bg-white dark:bg-gray-800 flex items-center justify-between border-t border-gray-100 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-semibold text-gray-900 dark:text-gray-100"
                >{{ theme.name }}</span
              >
              <span
                class="px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider font-bold"
                :class="
                  theme.type === 'dark'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ theme.type }}
              </span>
            </div>
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
              :class="
                appStore.terminalTheme === theme.id
                  ? 'bg-primary-500 text-white scale-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-transparent group-hover:bg-gray-200 dark:group-hover:bg-gray-600 scale-90'
              "
            >
              <svg
                v-if="appStore.terminalTheme === theme.id"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
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
</style>
