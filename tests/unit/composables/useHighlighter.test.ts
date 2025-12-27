import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock shiki
vi.mock('shiki', () => ({
  createHighlighter: vi.fn().mockResolvedValue({
    codeToHtml: vi.fn().mockReturnValue('<pre><code>highlighted</code></pre>'),
    getLoadedLanguages: vi.fn().mockReturnValue(['javascript', 'typescript']),
    loadLanguage: vi.fn(),
  }),
}))

describe('useHighlighter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export highlight function', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { highlight } = useHighlighter()
    expect(highlight).toBeDefined()
    expect(typeof highlight).toBe('function')
  })

  it('should export detectLanguage function', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { detectLanguage } = useHighlighter()
    expect(detectLanguage).toBeDefined()
    expect(typeof detectLanguage).toBe('function')
  })

  it('should detect language from hint', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { detectLanguage } = useHighlighter()

    expect(detectLanguage('const x = 1', 'js')).toBe('javascript')
    expect(detectLanguage('const x = 1', 'ts')).toBe('typescript')
    expect(detectLanguage('def foo():', 'py')).toBe('python')
    expect(detectLanguage('fn main() {}', 'rs')).toBe('rust')
  })

  it('should detect language from code heuristics', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { detectLanguage } = useHighlighter()

    expect(detectLanguage('function foo() {}')).toBe('javascript')
    expect(detectLanguage('const x = 1')).toBe('javascript')
    expect(detectLanguage('def foo():\n    pass')).toBe('python')
    expect(detectLanguage('fn main() { let mut x = 1; }')).toBe('rust')
  })

  it('should return plaintext for unknown code', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { detectLanguage } = useHighlighter()

    expect(detectLanguage('some random text')).toBe('plaintext')
  })

  it('should highlight code', async () => {
    const { useHighlighter } = await import('@/composables/useHighlighter')
    const { highlight } = useHighlighter()

    // Wait for highlighter to initialize
    await new Promise(resolve => setTimeout(resolve, 100))

    const result = await highlight('const x = 1', 'javascript', false)
    expect(result).toContain('highlighted')
  })
})
