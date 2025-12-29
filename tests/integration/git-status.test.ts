/**
 * Integration tests for GitStatus component
 * Tests Git status operations and component interactions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import GitStatus from '@/components/explorer/GitStatus.vue'

// Mock Tauri API
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

// Mock naive-ui components
vi.mock('naive-ui', () => ({
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
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'span',
          { class: 'n-tag', 'data-type': props.type },
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
    props: ['description', 'size'],
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
    props: ['quaternary', 'size'],
    setup(
      _props: Record<string, unknown>,
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
          { class: 'n-button', onClick: attrs.onClick },
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
  NBadge: {
    name: 'NBadge',
    props: ['value', 'max', 'type'],
    setup(
      props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'span',
          { class: 'n-badge', 'data-value': props.value },
          slots.default?.()
        )
    },
  },
  NCollapse: {
    name: 'NCollapse',
    props: ['arrowPlacement', 'defaultExpandedNames'],
    setup(
      _props: Record<string, unknown>,
      { slots }: { slots: Record<string, () => unknown> }
    ) {
      return () =>
        h(
          'div',
          { class: 'n-collapse', 'data-testid': 'file-changes' },
          slots.default?.()
        )
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
        h(
          'div',
          {
            class: 'n-collapse-item',
            'data-name': props.name,
            'data-title': props.title,
          },
          [
            h(
              'div',
              { class: 'n-collapse-item-header' },
              props.title as string
            ),
            slots.default?.(),
          ]
        )
    },
  },
}))

describe('GitStatus Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Git Status Loading', () => {
    it('loads git status on mount when path is provided', async () => {
      mockInvoke.mockResolvedValue({
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

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('get_git_status', {
        path: '/test/project',
      })
      expect(wrapper.find('.branch-name').text()).toBe('main')
    })

    it('shows loading state while fetching', async () => {
      let resolvePromise: (value: unknown) => void
      mockInvoke.mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve
        })
      )

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      expect(wrapper.find('.n-spin').attributes('data-loading')).toBe('true')

      resolvePromise!({
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
      await flushPromises()

      expect(wrapper.find('.n-spin').attributes('data-loading')).toBe('false')
    })

    it('displays error state when loading fails', async () => {
      mockInvoke.mockResolvedValue({
        success: false,
        error: 'Git command failed',
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const empty = wrapper.find('[data-testid="empty-state"]')
      expect(empty.exists()).toBe(true)
      expect(empty.text()).toContain('Git command failed')
    })

    it('shows not a repo message when directory is not a git repository', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: false,
          branch: null,
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/not-a-repo' },
      })

      await flushPromises()

      const empty = wrapper.find('[data-testid="empty-state"]')
      expect(empty.text()).toContain('Not a git repository')
    })
  })

  describe('Branch Information', () => {
    it('displays current branch name', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'feature/new-feature',
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      expect(wrapper.find('.branch-name').text()).toBe('feature/new-feature')
    })

    it('shows HEAD when branch is detached', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: null,
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      expect(wrapper.find('.branch-name').text()).toBe('HEAD')
    })

    it('displays ahead count badge', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 3,
          behind: 0,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const badges = wrapper.findAll('.n-badge')
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0].attributes('data-value')).toBe('3')
    })

    it('displays behind count badge', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 5,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const badges = wrapper.findAll('.n-badge')
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0].attributes('data-value')).toBe('5')
    })

    it('displays both ahead and behind badges', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 2,
          behind: 3,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const badges = wrapper.findAll('.n-badge')
      expect(badges).toHaveLength(2)
    })
  })

  describe('File Changes', () => {
    it('shows working tree clean message when no changes', async () => {
      mockInvoke.mockResolvedValue({
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

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      expect(wrapper.find('.no-changes').text()).toBe('Working tree clean')
    })

    it('displays staged files in staged section', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged_count: 2,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [
            { path: 'src/index.ts', status: 'M', staged: true },
            { path: 'src/utils.ts', status: 'A', staged: true },
          ],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const stagedSection = wrapper.find('[data-name="staged"]')
      expect(stagedSection.exists()).toBe(true)
      expect(stagedSection.attributes('data-title')).toContain(
        'Staged Changes (2)'
      )
    })

    it('displays unstaged files in changes section', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 1,
          untracked_count: 0,
          has_conflicts: false,
          files: [{ path: 'src/modified.ts', status: 'M', staged: false }],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const unstagedSection = wrapper.find('[data-name="unstaged"]')
      expect(unstagedSection.exists()).toBe(true)
      expect(unstagedSection.attributes('data-title')).toContain('Changes (1)')
    })

    it('displays untracked files in untracked section', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 0,
          untracked_count: 2,
          has_conflicts: false,
          files: [
            { path: 'new-file.ts', status: '?', staged: false },
            { path: 'another-file.ts', status: '?', staged: false },
          ],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const untrackedSection = wrapper.find('[data-name="untracked"]')
      expect(untrackedSection.exists()).toBe(true)
      expect(untrackedSection.attributes('data-title')).toContain(
        'Untracked (2)'
      )
    })

    it('applies correct status colors to file tags', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged_count: 3,
          unstaged_count: 0,
          untracked_count: 0,
          has_conflicts: false,
          files: [
            { path: 'modified.ts', status: 'M', staged: true },
            { path: 'added.ts', status: 'A', staged: true },
            { path: 'deleted.ts', status: 'D', staged: true },
          ],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const tags = wrapper.findAll('.n-tag')
      const tagTypes = tags.map(tag => tag.attributes('data-type'))

      expect(tagTypes).toContain('warning') // M = warning
      expect(tagTypes).toContain('success') // A = success
      expect(tagTypes).toContain('error') // D = error
    })
  })

  describe('Merge Conflicts', () => {
    it('displays conflict warning when has_conflicts is true', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        data: {
          is_repo: true,
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged_count: 0,
          unstaged_count: 1,
          untracked_count: 0,
          has_conflicts: true,
          files: [{ path: 'conflicted.ts', status: 'U', staged: false }],
        },
      })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const conflictTag = wrapper.find('.conflict-tag')
      expect(conflictTag.exists()).toBe(true)
      expect(conflictTag.text()).toContain('merge conflicts')
    })
  })

  describe('Refresh Functionality', () => {
    it('refreshes status when refresh button is clicked', async () => {
      mockInvoke.mockResolvedValue({
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

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()
      mockInvoke.mockClear()

      // Find and click refresh button
      const refreshButton = wrapper.find('.n-button')
      await refreshButton.trigger('click')
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('get_git_status', {
        path: '/test/project',
      })
    })

    it('exposes refresh method', async () => {
      mockInvoke.mockResolvedValue({
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

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()
      mockInvoke.mockClear()

      // Call exposed method
      wrapper.vm.refresh()
      await flushPromises()

      expect(mockInvoke).toHaveBeenCalledWith('get_git_status', {
        path: '/test/project',
      })
    })
  })

  describe('Path Changes', () => {
    it('reloads status when path prop changes', async () => {
      mockInvoke
        .mockResolvedValueOnce({
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
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_repo: true,
            branch: 'develop',
            ahead: 0,
            behind: 0,
            staged_count: 0,
            unstaged_count: 0,
            untracked_count: 0,
            has_conflicts: false,
            files: [],
          },
        })

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project1' },
      })

      await flushPromises()
      expect(wrapper.find('.branch-name').text()).toBe('main')

      // Change path
      await wrapper.setProps({ path: '/test/project2' })
      await flushPromises()

      expect(mockInvoke).toHaveBeenLastCalledWith('get_git_status', {
        path: '/test/project2',
      })
      expect(wrapper.find('.branch-name').text()).toBe('develop')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty path gracefully', async () => {
      mount(GitStatus, {
        props: { path: '' },
      })

      await flushPromises()

      // Should not call invoke with empty path
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('handles undefined path gracefully', async () => {
      mount(GitStatus, {
        props: { path: undefined },
      })

      await flushPromises()

      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('handles exception from invoke', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))

      const wrapper = mount(GitStatus, {
        props: { path: '/test/project' },
      })

      await flushPromises()

      const empty = wrapper.find('[data-testid="empty-state"]')
      expect(empty.exists()).toBe(true)
      expect(empty.text()).toContain('Network error')
    })
  })
})
