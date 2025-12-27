import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageItem from '@/components/chat/MessageItem.vue'
import type { Message } from '@/types'

describe('MessageItem', () => {
  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    uuid: 'test-uuid',
    parentUuid: null,
    role: 'user',
    content: [{ type: 'text', text: 'Hello!' }],
    timestamp: new Date('2024-01-01T12:00:00'),
    ...overrides,
  })

  describe('user messages', () => {
    it('should render user message with correct styling', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({ role: 'user' }),
        },
      })

      expect(wrapper.text()).toContain('You')
      expect(wrapper.text()).toContain('Hello!')
    })

    it('should display "You" label for user messages', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({ role: 'user' }),
        },
      })

      expect(wrapper.text()).toContain('You')
    })
  })

  describe('assistant messages', () => {
    it('should render assistant message', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [{ type: 'text', text: 'I can help you!' }],
          }),
        },
      })

      expect(wrapper.text()).toContain('Claude')
      expect(wrapper.text()).toContain('I can help you!')
    })

    it('should display "Claude" label for assistant messages', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({ role: 'assistant' }),
        },
      })

      expect(wrapper.text()).toContain('Claude')
    })
  })

  describe('content blocks', () => {
    it('should render text blocks', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            content: [{ type: 'text', text: 'Test text content' }],
          }),
        },
      })

      expect(wrapper.text()).toContain('Test text content')
    })

    it('should render thinking blocks', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [
              { type: 'thinking', thinking: 'Let me think about this...' },
            ],
          }),
        },
      })

      expect(wrapper.text()).toContain('Thinking...')
      expect(wrapper.text()).toContain('Let me think about this...')
    })

    it('should render tool_use blocks', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.txt' },
              },
            ],
          }),
        },
      })

      expect(wrapper.text()).toContain('Tool:')
      expect(wrapper.text()).toContain('read_file')
    })

    it('should render tool_result blocks', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'File content here',
              },
            ],
          }),
        },
      })

      expect(wrapper.text()).toContain('File content here')
    })

    it('should render error tool_result with error styling', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'Error occurred',
                is_error: true,
              },
            ],
          }),
        },
      })

      expect(wrapper.text()).toContain('Error occurred')
      // Check for error border class
      expect(wrapper.find('.border-red-500').exists()).toBe(true)
    })

    it('should render multiple content blocks', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            role: 'assistant',
            content: [
              { type: 'text', text: 'First block' },
              { type: 'text', text: 'Second block' },
            ],
          }),
        },
      })

      expect(wrapper.text()).toContain('First block')
      expect(wrapper.text()).toContain('Second block')
    })
  })

  describe('timestamp', () => {
    it('should display formatted timestamp', () => {
      const wrapper = mount(MessageItem, {
        props: {
          message: createMessage({
            timestamp: new Date('2024-01-01T12:30:45'),
          }),
        },
      })

      // Timestamp format depends on locale, just check it's rendered
      expect(wrapper.text()).toMatch(/\d{1,2}:\d{2}/)
    })
  })
})
