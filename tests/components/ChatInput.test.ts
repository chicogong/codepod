import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ChatInput from '@/components/chat/ChatInput.vue'

// Mock useClaude composable
vi.mock('@/composables', () => ({
  useClaude: () => ({
    stopGeneration: vi.fn(),
    regenerateMessage: vi.fn(),
  }),
}))

describe('ChatInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render textarea and send button', () => {
      const wrapper = mount(ChatInput)

      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should show placeholder text', () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')

      expect(textarea.attributes('placeholder')).toBe('Message Claude...')
    })

    it('should disable textarea when disabled prop is true', () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })

      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    })

    it('should render model selector', () => {
      const wrapper = mount(ChatInput)

      expect(wrapper.find('select').exists()).toBe(true)
    })
  })

  describe('send functionality', () => {
    it('should emit send event with content on button click', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')
      // Find the send button (not the stop button, which has bg-red-500 class)
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))

      await textarea.setValue('Hello, Claude!')
      await sendButton!.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
      expect(wrapper.emitted('send')![0]).toEqual(['Hello, Claude!'])
    })

    it('should emit send event on Enter key', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toBeTruthy()
      expect(wrapper.emitted('send')![0]).toEqual(['Test message'])
    })

    it('should not emit send on Shift+Enter', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should clear textarea after sending', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))

      await textarea.setValue('Hello!')
      await sendButton!.trigger('click')

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })

    it('should not emit send with empty content', async () => {
      const wrapper = mount(ChatInput)
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))
      await sendButton!.trigger('click')

      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should not emit send with whitespace-only content', async () => {
      const wrapper = mount(ChatInput)
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))
      await wrapper.find('textarea').setValue('   ')
      await sendButton!.trigger('click')

      expect(wrapper.emitted('send')).toBeFalsy()
    })
  })

  describe('button state', () => {
    it('should disable button when content is empty', () => {
      const wrapper = mount(ChatInput)
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))

      expect(sendButton!.attributes('disabled')).toBeDefined()
    })

    it('should enable button when content is present', async () => {
      const wrapper = mount(ChatInput)
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))

      await wrapper.find('textarea').setValue('Hello')

      expect(sendButton!.attributes('disabled')).toBeUndefined()
    })

    it('should disable button when component is disabled', async () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })

      await wrapper.find('textarea').setValue('Hello')
      const buttons = wrapper.findAll('button')
      const sendButton = buttons.find(b => !b.classes().includes('bg-red-500'))

      expect(sendButton!.attributes('disabled')).toBeDefined()
    })
  })

  describe('exposed methods', () => {
    it('should expose focus method', () => {
      const wrapper = mount(ChatInput)

      expect(typeof wrapper.vm.focus).toBe('function')
    })
  })

  describe('model selector', () => {
    it('should have multiple model options', () => {
      const wrapper = mount(ChatInput)
      const options = wrapper.findAll('select option')

      expect(options.length).toBeGreaterThan(1)
    })

    it('should have Claude 4.5 as default selected model', () => {
      const wrapper = mount(ChatInput)
      const select = wrapper.find('select')

      expect((select.element as HTMLSelectElement).value).toBe('claude-4.5')
    })
  })
})
