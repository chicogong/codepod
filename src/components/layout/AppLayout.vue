<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NIcon,
  NTooltip,
  NDrawer,
  NDrawerContent,
  NSpace,
  NDropdown,
} from 'naive-ui'
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
  FolderOpenOutline,
  MenuOutline,
  ChevronDownOutline,
} from '@vicons/ionicons5'
import { useAppStore, useChatStore, useSessionStore } from '@/stores'
import { useTabsStore } from '@/stores/tabs'
import Sidebar from './Sidebar.vue'
import StatusBar from './StatusBar.vue'
import TabBar from './TabBar.vue'
import { ConfigPanel } from '@/components/config'

const appStore = useAppStore()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const tabsStore = useTabsStore()
const showConfigPanel = ref(false)
const sidebarCollapsed = ref(false)

// Initialize tabs on mount
onMounted(() => {
  tabsStore.loadTabs()

  // If we have a current session but no tabs, create a tab for it
  if (chatStore.currentSessionId && tabsStore.tabs.length === 0) {
    const session = sessionStore.sessions.find(
      s => s.id === chatStore.currentSessionId
    )
    if (session) {
      tabsStore.addTab(session)
    }
  }

  // If we have tabs but active tab's session doesn't match current, sync them
  if (
    tabsStore.activeTab &&
    tabsStore.activeTab.sessionId !== chatStore.currentSessionId
  ) {
    chatStore.loadSessionFromStorage(tabsStore.activeTab.sessionId)
  }
})

// Project selector options
const projectOptions = [
  {
    label: 'Open Project...',
    key: 'open',
    icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) }),
  },
]

function handleProjectSelect(key: string) {
  if (key === 'open') {
    // TODO: Open project dialog
  }
}

// Import h for rendering icons in dropdown
import { h } from 'vue'
</script>

<template>
  <NLayout class="app-layout" has-sider position="absolute">
    <!-- Sidebar -->
    <NLayoutSider
      v-if="!appStore.isSidebarCollapsed"
      bordered
      collapse-mode="width"
      :collapsed="sidebarCollapsed"
      :collapsed-width="0"
      :width="appStore.sidebarWidth"
      :native-scrollbar="false"
      class="app-sider"
    >
      <Sidebar
        :width="appStore.sidebarWidth"
        @show-config="showConfigPanel = true"
      />
    </NLayoutSider>

    <!-- Main Content -->
    <NLayout class="main-layout">
      <!-- Header -->
      <NLayoutHeader bordered class="app-header">
        <div class="header-left">
          <!-- Toggle Sidebar -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                quaternary
                circle
                size="small"
                @click="appStore.toggleSidebar"
              >
                <template #icon>
                  <NIcon :component="MenuOutline" />
                </template>
              </NButton>
            </template>
            Toggle Sidebar
          </NTooltip>

          <!-- Logo -->
          <div class="app-logo">
            <span class="logo-text">CodePod</span>
          </div>
        </div>

        <!-- Project Selector -->
        <div class="header-center">
          <NDropdown
            trigger="click"
            :options="projectOptions"
            @select="handleProjectSelect"
          >
            <NButton text class="project-selector">
              <NIcon :component="FolderOpenOutline" class="project-icon" />
              <span class="project-name">{{
                appStore.projectName || 'No Project'
              }}</span>
              <NIcon :component="ChevronDownOutline" :size="14" />
            </NButton>
          </NDropdown>
        </div>

        <!-- Header Actions -->
        <div class="header-right">
          <NSpace :size="4">
            <!-- Theme Toggle -->
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  quaternary
                  circle
                  size="small"
                  @click="appStore.toggleDarkMode"
                >
                  <template #icon>
                    <NIcon
                      :component="
                        appStore.isDarkMode ? SunnyOutline : MoonOutline
                      "
                    />
                  </template>
                </NButton>
              </template>
              {{ appStore.isDarkMode ? 'Light Mode' : 'Dark Mode' }}
            </NTooltip>

            <!-- Settings -->
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  quaternary
                  circle
                  size="small"
                  @click="showConfigPanel = true"
                >
                  <template #icon>
                    <NIcon :component="SettingsOutline" />
                  </template>
                </NButton>
              </template>
              Settings
            </NTooltip>
          </NSpace>
        </div>
      </NLayoutHeader>

      <!-- Tab Bar -->
      <TabBar />

      <!-- Content -->
      <NLayoutContent
        class="app-content"
        content-class="app-content-inner"
        :native-scrollbar="true"
      >
        <slot />
      </NLayoutContent>

      <!-- Status Bar -->
      <StatusBar />
    </NLayout>

    <!-- Config Panel Drawer -->
    <NDrawer v-model:show="showConfigPanel" :width="400" placement="right">
      <NDrawerContent title="Settings" closable>
        <ConfigPanel />
      </NDrawerContent>
    </NDrawer>
  </NLayout>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.app-sider {
  background: var(--n-color);
}

.main-layout {
  display: flex;
  flex-direction: column;
}

/* Override Naive UI's scroll container to use flex layout */
.main-layout :deep(> .n-layout-scroll-container) {
  display: flex !important;
  flex-direction: column;
  flex: 1;
}

.app-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--n-text-color-2);
  transition: all 0.2s;
}

.project-selector:hover {
  background: var(--n-color-target);
}

.project-icon {
  font-size: 16px;
}

.project-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.app-content-inner) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>
