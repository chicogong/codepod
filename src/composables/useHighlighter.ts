import { ref, shallowRef } from 'vue'
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
  type BundledTheme,
} from 'shiki'

// Singleton highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null
const highlighter = shallowRef<Highlighter | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Common languages for code highlighting
const COMMON_LANGUAGES: BundledLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'toml',
  'markdown',
  'sql',
  'bash',
  'shell',
  'dockerfile',
  'vue',
  'jsx',
  'tsx',
]

const THEMES: BundledTheme[] = ['github-dark', 'github-light']

async function initHighlighter(): Promise<Highlighter> {
  if (highlighterPromise) {
    return highlighterPromise
  }

  highlighterPromise = createHighlighter({
    themes: THEMES,
    langs: COMMON_LANGUAGES,
  })

  try {
    const instance = await highlighterPromise
    highlighter.value = instance
    isLoading.value = false
    return instance
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load highlighter'
    isLoading.value = false
    throw e
  }
}

// Initialize on module load
initHighlighter().catch(console.error)

export function useHighlighter() {
  async function highlight(
    code: string,
    lang: string,
    isDark: boolean = false
  ): Promise<string> {
    try {
      const hl = highlighter.value || (await initHighlighter())

      // Check if language is loaded, fallback to plaintext
      const loadedLangs = hl.getLoadedLanguages()
      const language = loadedLangs.includes(lang as BundledLanguage)
        ? lang
        : 'plaintext'

      // Load language if not loaded and it's in our common list
      if (
        !loadedLangs.includes(lang as BundledLanguage) &&
        COMMON_LANGUAGES.includes(lang as BundledLanguage)
      ) {
        await hl.loadLanguage(lang as BundledLanguage)
      }

      return hl.codeToHtml(code, {
        lang: language,
        theme: isDark ? 'github-dark' : 'github-light',
      })
    } catch {
      // Fallback to plain code block
      return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
    }
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Detect language from code fence or filename
  function detectLanguage(code: string, hint?: string): string {
    if (hint) {
      // Map common aliases
      const aliases: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        yml: 'yaml',
        md: 'markdown',
        rs: 'rust',
      }
      return aliases[hint.toLowerCase()] || hint.toLowerCase()
    }

    // Simple heuristics
    if (code.includes('function') || code.includes('const '))
      return 'javascript'
    if (code.includes('def ') || code.includes('import ')) return 'python'
    if (code.includes('fn ') || code.includes('let mut')) return 'rust'
    if (code.includes('func ') || code.includes('package ')) return 'go'

    return 'plaintext'
  }

  return {
    highlighter,
    isLoading,
    error,
    highlight,
    detectLanguage,
  }
}
