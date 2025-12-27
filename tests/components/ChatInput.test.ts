import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatInput from '@/components/chat/ChatInput.vue'

describe('ChatInput', () => {
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
  })

  describe('send functionality', () => {
    it('should emit send event with content on button click', async () => {
      const wrapper = mount(ChatInput)
      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('Hello, Claude!')
      await button.trigger('click')

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

      await textarea.setValue('Hello!')
      await wrapper.find('button').trigger('click')

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })

    it('should not emit send with empty content', async () => {
      const wrapper = mount(ChatInput)
      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should not emit send with whitespace-only content', async () => {
      const wrapper = mount(ChatInput)
      await wrapper.find('textarea').setValue('   ')
      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('send')).toBeFalsy()
    })
  })

  describe('button state', () => {
    it('should disable button when content is empty', () => {
      const wrapper = mount(ChatInput)
      const button = wrapper.find('button')

      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should enable button when content is present', async () => {
      const wrapper = mount(ChatInput)
      const button = wrapper.find('button')

      await wrapper.find('textarea').setValue('Hello')

      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('should disable button when component is disabled', async () => {
      const wrapper = mount(ChatInput, {
        props: { disabled: true },
      })

      await wrapper.find('textarea').setValue('Hello')

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('exposed methods', () => {
    it('should expose focus method', () => {
      const wrapper = mount(ChatInput)

      expect(typeof wrapper.vm.focus).toBe('function')
    })
  })
})
