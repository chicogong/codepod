/**
 * Integration tests for Sidebar component
 * Tests the interaction between Sidebar, FileExplorer, and GitStatus components
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { useAppStore } from '@/stores'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
  NTabs: {
    name: 'NTabs',
    props: ['value'],
    emits: ['update:value'],
    setup(
      props: Record<string, unknown>,
      {
        slots,
        emit,
      }: {
        slots: Record<string, () => unknown>
        emit: (event: string, ...args: unknown[]) => void
      }
    ) {
      return () =>
        h('div', { class: 'n-tabs', 'data-value': props.value }, [
          h('div', { class: 'n-tabs-nav' }, [
            h(
              'button',
              {
                'data-tab': 'sessions',
                onClick: () => emit('update:value', 'sessions'),
              },
              'Sessions'
            ),
            h(
              'button',
              {
                'data-tab': 'files',
                onClick: () => emit('update:value', 'files'),
              },
              'Files'
            ),
            h(
              'button',
              { 'data-tab': 'git', onClick: () => emit('update:value', 'git') },
              'Git'
            ),
            h(
              'button',
              { 'data-tab': 'mcp', onClick: () => emit('update:value', 'mcp') },
              'MCP'
            ),
          ]),
          slots.default?.(),
        ])
    },
  },
  NTabPane: {
    name: 'NTabPane',
    props: ['name'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'div',
          { class: 'n-tab-pane', 'data-name': props.name },
          slots.default?.()
        )
    },
  },
  NIcon: {
    name: 'NIcon',
    props: ['component', 'size'],
    setup() {
      return () => h('span', { class: 'n-icon' })
    },
  },
  NTree: {
    name: 'NTree',
    props: ['data', 'expandedKeys', 'selectedKeys', 'blockLine', 'nodeProps'],
    emits: ['update:expanded-keys', 'update:selected-keys'],
    setup(
      props: Record<string, unknown>,
      { emit }: { emit: (event: string, ...args: unknown[]) => void }
    ) {
      return () =>
        h('div', { class: 'n-tree' }, [
          ...(props.data as Array<{ key: string; label: string }>).map(
            (node: { key: string; label: string }) =>
              h(
                'div',
                {
                  class: 'n-tree-node',
                  'data-key': node.key,
                  onClick: () =>
                    emit('update:selected-keys', [node.key], [node]),
                },
                node.label
              )
          ),
        ])
    },
  },
  NSpin: {
    name: 'NSpin',
    props: ['show'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'div',
          { class: 'n-spin', 'data-show': props.show },
          slots.default?.()
        )
    },
  },
  NEmpty: {
    name: 'NEmpty',
    props: ['description', 'size'],
    setup(props: Record<string, unknown>) {
      return () => h('div', { class: 'n-empty' }, props.description as string)
    },
  },
  NButton: {
    name: 'NButton',
    props: ['quaternary', 'size', 'disabled', 'loading'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'button',
          { class: 'n-button', disabled: props.disabled },
          slots.default?.()
        )
    },
  },
  NTooltip: {
    name: 'NTooltip',
    props: ['trigger'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('div', { class: 'n-tooltip' }, slots.trigger?.())
    },
  },
  NList: {
    name: 'NList',
    props: ['showDivider', 'size'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('div', { class: 'n-list' }, slots.default?.())
    },
  },
  NListItem: {
    name: 'NListItem',
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('div', { class: 'n-list-item' }, slots.default?.())
    },
  },
  NTag: {
    name: 'NTag',
    props: ['type', 'size'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('span', { class: 'n-tag' }, slots.default?.())
    },
  },
  NBadge: {
    name: 'NBadge',
    props: ['value', 'max', 'type'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('span', { class: 'n-badge' }, slots.default?.())
    },
  },
  NCollapse: {
    name: 'NCollapse',
    props: ['arrowPlacement', 'defaultExpandedNames'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('div', { class: 'n-collapse' }, slots.default?.())
    },
  },
  NCollapseItem: {
    name: 'NCollapseItem',
    props: ['name', 'title'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h('div', { class: 'n-collapse-item', 'data-name': props.name }, [
          h('div', { class: 'n-collapse-item-header' }, props.title as string),
          slots.default?.(),
        ])
    },
  },
  NScrollbar: {
    name: 'NScrollbar',
    props: ['xScrollable'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('div', { class: 'n-scrollbar' }, slots.default?.())
    },
  },
  NText: {
    name: 'NText',
    props: ['depth'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () => h('span', { class: 'n-text' }, slots.default?.())
    },
  },
  NInput: {
    name: 'NInput',
    props: ['value', 'type', 'placeholder', 'rows', 'disabled'],
    setup(
      _props: Record<string, unknown>,
      { attrs }: { attrs: Record<string, unknown> }
    ) {
      return () => h('textarea', { class: 'n-input', ...attrs })
    },
  },
  NModal: {
    name: 'NModal',
    props: ['show', 'preset', 'title', 'style', 'bordered'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        props.show
          ? h('div', { class: 'n-modal' }, [
              slots.default?.(),
              slots.footer?.(),
            ])
          : null
    },
  },
}))

// Mock SessionList component
vi.mock('@/components/session', () => ({
  SessionList: {
    name: 'SessionList',
    emits: ['select'],
    setup() {
      return () => h('div', { class: 'session-list' }, 'Session List')
    },
  },
}))

describe('Sidebar Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Tab Navigation', () => {
    it('shows sessions tab by default', () => {
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      const tabs = wrapper.find('.n-tabs')
      expect(tabs.attributes('data-value')).toBe('sessions')
    })

    it('switches between tabs', async () => {
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      // Find and click Files tab
      const filesTabButton = wrapper.find('[data-tab="files"]')
      await filesTabButton.trigger('click')
      await flushPromises()

      // Verify tab switched
      expect(wrapper.find('.n-tabs').attributes('data-value')).toBe('files')
    })

    it('shows placeholder when no project path is set', () => {
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      // Check for placeholder text in files tab
      const filesPane = wrapper.find('[data-name="files"]')
      expect(filesPane.text()).toContain('Select a project folder')
    })
  })

  describe('FileExplorer Integration', () => {
    it('renders FileExplorer when project path is set', async () => {
      const appStore = useAppStore()
      // Use the action to set project, which updates the computed projectPath
      appStore.setCurrentProject({
        name: 'Test Project',
        path: '/test/project',
      })

      const { invoke } = await import('@tauri-apps/api/core')
      ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: 'src',
              path: '/test/project/src',
              is_dir: true,
              is_file: false,
              is_hidden: false,
            },
            {
              name: 'README.md',
              path: '/test/project/README.md',
              is_dir: false,
              is_file: true,
              is_hidden: false,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      await flushPromises()

      // FileExplorer should be rendered (check for file-explorer class in files tab)
      const filesPane = wrapper.find('[data-name="files"]')
      expect(filesPane.find('.file-explorer').exists()).toBe(true)
    })

    it('emits fileSelect event when file is selected in FileExplorer', async () => {
      const appStore = useAppStore()
      appStore.setCurrentProject({
        name: 'Test Project',
        path: '/test/project',
      })

      const { invoke } = await import('@tauri-apps/api/core')
      ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: 'test.ts',
              path: '/test/project/test.ts',
              is_dir: false,
              is_file: true,
              is_hidden: false,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      await flushPromises()

      // Find FileExplorer component and emit event through tree node click
      const treeNode = wrapper.find('.n-tree-node')
      if (treeNode.exists()) {
        await treeNode.trigger('click')
        // The select event should propagate up
        const selectEvents = wrapper.emitted('fileSelect')
        expect(selectEvents).toBeTruthy()
      }
    })

    it('passes correct rootPath to FileExplorer', async () => {
      const appStore = useAppStore()
      appStore.setCurrentProject({
        name: 'Test Project',
        path: '/my/custom/path',
      })

      const { invoke } = await import('@tauri-apps/api/core')
      ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          path: '/my/custom/path',
          entries: [],
          parent: '/my/custom',
        },
      })

      mount(Sidebar, {
        props: { width: 280 },
      })

      await flushPromises()

      // Verify invoke was called with correct path
      expect(invoke).toHaveBeenCalledWith('list_directory', {
        path: '/my/custom/path',
      })
    })
  })

  describe('GitStatus Integration', () => {
    it('renders GitStatus when project path is set', async () => {
      const appStore = useAppStore()
      appStore.setCurrentProject({
        name: 'Test Project',
        path: '/test/project',
      })

      const { invoke } = await import('@tauri-apps/api/core')
      ;(invoke as ReturnType<typeof vi.fn>).mockImplementation(
        (cmd: string) => {
          if (cmd === 'list_directory') {
            return Promise.resolve({
              success: true,
              data: { path: '/test/project', entries: [], parent: '/test' },
            })
          }
          if (cmd === 'get_git_status') {
            return Promise.resolve({
              success: true,
              data: {
                is_repo: true,
                branch: 'main',
                ahead: 0,
                behind: 0,
                staged_count: 0,
                unstaged_count: 0,
                untracked_count: 0,
                has_conflicts: false,
                files: [],
              },
            })
          }
          return Promise.resolve({ success: false })
        }
      )

      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      await flushPromises()

      // GitStatus should be rendered
      const gitPane = wrapper.find('[data-name="git"]')
      expect(gitPane.find('.git-status').exists()).toBe(true)
    })

    it('shows placeholder when no project path for git', () => {
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      const gitPane = wrapper.find('[data-name="git"]')
      expect(gitPane.text()).toContain('Select a project folder')
    })
  })

  describe('New Chat Button', () => {
    it('creates new chat and switches to chat view', async () => {
      const appStore = useAppStore()
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      const newChatButton = wrapper.find('button')
      await newChatButton.trigger('click')

      expect(appStore.viewMode).toBe('chat')
    })
  })

  describe('Settings Button', () => {
    it('emits showConfig event when clicked', async () => {
      const wrapper = mount(Sidebar, {
        props: { width: 280 },
      })

      // Find settings button (last button in sidebar)
      const buttons = wrapper.findAll('button')
      const settingsButton = buttons[buttons.length - 1]
      await settingsButton.trigger('click')

      expect(wrapper.emitted('showConfig')).toBeTruthy()
    })
  })
})
