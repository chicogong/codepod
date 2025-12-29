/**
 * Integration tests for FileExplorer component
 * Tests file system operations and component interactions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'

// Mock Tauri API
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  NTree: {
    name: 'NTree',
    props: ['data', 'expandedKeys', 'selectedKeys', 'blockLine', 'nodeProps'],
    emits: ['update:expanded-keys', 'update:selected-keys'],
    setup(
      props: Record<string, unknown>,
      { emit }: { emit: (event: string, ...args: unknown[]) => void }
    ) {
      return () =>
        h('div', { class: 'n-tree', 'data-testid': 'file-tree' }, [
          ...(
            props.data as Array<{
              key: string
              label: string
              isLeaf: boolean
              isDir: boolean
              isFile: boolean
              path: string
            }>
          ).map(node =>
            h(
              'div',
              {
                class: 'n-tree-node',
                'data-key': node.key,
                'data-is-dir': node.isDir,
                'data-is-file': node.isFile,
                onClick: () => emit('update:selected-keys', [node.key], [node]),
                ondblclick: () => {
                  const nodeProps = props.nodeProps as (info: {
                    option: typeof node
                  }) => Record<string, () => void>
                  if (nodeProps) {
                    const handlers = nodeProps({ option: node })
                    handlers.ondblclick?.()
                  }
                },
              },
              node.label
            )
          ),
        ])
    },
  },
  NIcon: {
    name: 'NIcon',
    props: ['component', 'size'],
    setup() {
      return () => h('span', { class: 'n-icon' })
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
          { class: 'n-spin', 'data-loading': props.show },
          slots.default?.()
        )
    },
  },
  NEmpty: {
    name: 'NEmpty',
    props: ['description'],
    setup(props: Record<string, unknown>) {
      return () =>
        h(
          'div',
          { class: 'n-empty', 'data-testid': 'empty-state' },
          props.description as string
        )
    },
  },
  NButton: {
    name: 'NButton',
    props: ['quaternary', 'size', 'disabled', 'loading'],
    emits: ['click'],
    setup(
      props: Record<string, unknown>,
      {
        slots,
        attrs,
      }: {
        slots: Record<string, () => unknown>
        attrs: Record<string, unknown>
      }
    ) {
      return () =>
        h(
          'button',
          {
            class: 'n-button',
            disabled: props.disabled,
            'data-disabled': props.disabled ? 'true' : 'false',
            onClick: attrs.onClick,
          },
          slots.icon?.()
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
}))

describe('FileExplorer Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Directory Loading', () => {
    it('loads directory contents on mount when rootPath is provided', async () => {
      mockInvoke.mockResolvedValue({
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
              name: 'package.json',
              path: '/test/project/package.json',
              is_dir: false,
              is_file: true,
              is_hidden: false,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/project',
      })

      // Check tree nodes are rendered
      const tree = wrapper.find('[data-testid="file-tree"]')
      expect(tree.exists()).toBe(true)
      expect(wrapper.findAll('.n-tree-node')).toHaveLength(2)
    })

    it('displays error state when directory loading fails', async () => {
      mockInvoke.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/protected' },
      })

      await flushPromises()

      const empty = wrapper.find('[data-testid="empty-state"]')
      expect(empty.exists()).toBe(true)
      expect(empty.text()).toContain('Permission denied')
    })

    it('displays empty state for empty directories', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/empty',
          entries: [],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/empty' },
      })

      await flushPromises()

      const empty = wrapper.find('[data-testid="empty-state"]')
      expect(empty.exists()).toBe(true)
      expect(empty.text()).toContain('Empty directory')
    })

    it('shows loading state while fetching directory', async () => {
      let resolvePromise: (value: unknown) => void
      mockInvoke.mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve
        })
      )

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      // Should show loading initially
      expect(wrapper.find('.n-spin').attributes('data-loading')).toBe('true')

      // Resolve the promise
      resolvePromise!({
        success: true,
        data: { path: '/test/project', entries: [], parent: '/test' },
      })
      await flushPromises()

      // Loading should be done
      expect(wrapper.find('.n-spin').attributes('data-loading')).toBe('false')
    })
  })

  describe('File Selection', () => {
    it('emits select event when file is clicked', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: 'index.ts',
              path: '/test/project/index.ts',
              is_dir: false,
              is_file: true,
              is_hidden: false,
              extension: 'ts',
              size: 1024,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()

      // Click on the file node
      const fileNode = wrapper.find('.n-tree-node')
      await fileNode.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0][0]).toMatchObject({
        name: 'index.ts',
        path: '/test/project/index.ts',
        is_file: true,
      })
    })

    it('emits open event when file is double-clicked', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: 'index.ts',
              path: '/test/project/index.ts',
              is_dir: false,
              is_file: true,
              is_hidden: false,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()

      const fileNode = wrapper.find('.n-tree-node[data-is-file="true"]')
      await fileNode.trigger('dblclick')

      expect(wrapper.emitted('open')).toBeTruthy()
    })

    it('navigates into directory on double-click', async () => {
      mockInvoke
        .mockResolvedValueOnce({
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
            ],
            parent: '/test',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            path: '/test/project/src',
            entries: [
              {
                name: 'main.ts',
                path: '/test/project/src/main.ts',
                is_dir: false,
                is_file: true,
                is_hidden: false,
              },
            ],
            parent: '/test/project',
          },
        })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()

      // Double-click on directory
      const dirNode = wrapper.find('.n-tree-node[data-is-dir="true"]')
      await dirNode.trigger('dblclick')

      await flushPromises()

      // Should have called invoke twice (initial load + navigation)
      expect(mockInvoke).toHaveBeenCalledTimes(2)
      expect(mockInvoke).toHaveBeenLastCalledWith('list_directory', {
        path: '/test/project/src',
      })
    })
  })

  describe('Navigation', () => {
    it('can navigate to parent directory via exposed method', async () => {
      mockInvoke
        .mockResolvedValueOnce({
          success: true,
          data: {
            path: '/test/project/src',
            entries: [],
            parent: '/test/project',
          },
        })
        .mockResolvedValueOnce({
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
            ],
            parent: '/test',
          },
        })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project/src' },
      })

      await flushPromises()

      // Call loadDirectory directly to navigate to parent
      await wrapper.vm.loadDirectory('/test/project')
      await flushPromises()

      expect(mockInvoke).toHaveBeenLastCalledWith('list_directory', {
        path: '/test/project',
      })
    })

    it('shows disabled state for parent button when at root', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/',
          entries: [],
          parent: null,
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/' },
      })

      await flushPromises()

      const buttons = wrapper.findAll('.n-button')
      const parentButton = buttons[0]
      // Check for data-disabled attribute instead of disabled attribute
      expect(parentButton.attributes('data-disabled')).toBe('true')
    })

    it('refreshes current directory via exposed method', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()
      mockInvoke.mockClear()

      // Call refresh method directly
      wrapper.vm.refresh()
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/project',
      })
    })
  })

  describe('Hidden Files', () => {
    it('filters hidden files when showHidden is false', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: '.git',
              path: '/test/project/.git',
              is_dir: true,
              is_file: false,
              is_hidden: true,
            },
            {
              name: 'src',
              path: '/test/project/src',
              is_dir: true,
              is_file: false,
              is_hidden: false,
            },
            {
              name: '.env',
              path: '/test/project/.env',
              is_dir: false,
              is_file: true,
              is_hidden: true,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project', showHidden: false },
      })

      await flushPromises()

      // Should only show non-hidden entry
      expect(wrapper.findAll('.n-tree-node')).toHaveLength(1)
      expect(wrapper.find('.n-tree-node').text()).toBe('src')
    })

    it('shows hidden files when showHidden is true', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          path: '/test/project',
          entries: [
            {
              name: '.git',
              path: '/test/project/.git',
              is_dir: true,
              is_file: false,
              is_hidden: true,
            },
            {
              name: 'src',
              path: '/test/project/src',
              is_dir: true,
              is_file: false,
              is_hidden: false,
            },
          ],
          parent: '/test',
        },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project', showHidden: true },
      })

      await flushPromises()

      // Should show all entries
      expect(wrapper.findAll('.n-tree-node')).toHaveLength(2)
    })
  })

  describe('Root Path Changes', () => {
    it('reloads directory when rootPath prop changes', async () => {
      mockInvoke
        .mockResolvedValueOnce({
          success: true,
          data: { path: '/test/project1', entries: [], parent: '/test' },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { path: '/test/project2', entries: [], parent: '/test' },
        })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project1' },
      })

      await flushPromises()
      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/project1',
      })

      // Change root path
      await wrapper.setProps({ rootPath: '/test/project2' })
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/project2',
      })
    })
  })

  describe('Exposed Methods', () => {
    it('exposes loadDirectory method', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: { path: '/test/project', entries: [], parent: '/test' },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()
      mockInvoke.mockClear()

      // Call exposed method
      await wrapper.vm.loadDirectory('/test/other')
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/other',
      })
    })

    it('exposes refresh method', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: { path: '/test/project', entries: [], parent: '/test' },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()
      mockInvoke.mockClear()

      // Call exposed method
      wrapper.vm.refresh()
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('list_directory', {
        path: '/test/project',
      })
    })

    it('exposes currentPath ref', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: { path: '/test/project', entries: [], parent: '/test' },
      })

      const wrapper = mount(FileExplorer, {
        props: { rootPath: '/test/project' },
      })

      await flushPromises()

      expect(wrapper.vm.currentPath).toBe('/test/project')
    })
  })
})
