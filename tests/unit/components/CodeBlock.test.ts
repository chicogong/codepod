import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CodeBlock from '@/components/chat/CodeBlock.vue'

// Mock useHighlighter
vi.mock('@/composables/useHighlighter', () => ({
  useHighlighter: () => ({
    highlight: vi
      .fn()
      .mockResolvedValue('<pre><code>highlighted code</code></pre>'),
    detectLanguage: vi.fn().mockReturnValue('javascript'),
    isLoading: { value: false },
  }),
}))

describe('CodeBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders code block', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1',
        language: 'javascript',
      },
    })

    expect(wrapper.find('.relative').exists()).toBe(true)
  })

  it('displays language label', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1',
        language: 'typescript',
      },
    })

    expect(wrapper.text()).toContain('typescript')
  })

  it('has copy button', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1',
      },
    })

    const copyButton = wrapper.find('button')
    expect(copyButton.exists()).toBe(true)
    expect(wrapper.text()).toContain('Copy')
  })

  it('shows copied feedback', async () => {
    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1',
      },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Copied!')

    vi.unstubAllGlobals()
  })

  it('detects language when not provided', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'function test() {}',
      },
    })

    // Language should be detected
    expect(wrapper.text()).toContain('javascript')
  })
})
