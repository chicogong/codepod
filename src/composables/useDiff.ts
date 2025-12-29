import { ref } from 'vue'
import * as Diff from 'diff'

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  value: string
  lineNumber: {
    old?: number
    new?: number
  }
}

export interface DiffResult {
  lines: DiffLine[]
  hasChanges: boolean
  addedCount: number
  removedCount: number
}

export function useDiff() {
  const isProcessing = ref(false)

  // Calculate line-by-line diff
  function calculateDiff(oldText: string, newText: string): DiffResult {
    isProcessing.value = true

    try {
      const changes = Diff.diffLines(oldText, newText)
      const lines: DiffLine[] = []
      let oldLineNum = 1
      let newLineNum = 1
      let addedCount = 0
      let removedCount = 0

      for (const change of changes) {
        const changeLines = change.value.split('\n')
        // Remove last empty element if the string ends with \n
        if (changeLines[changeLines.length - 1] === '') {
          changeLines.pop()
        }

        for (const line of changeLines) {
          if (change.added) {
            lines.push({
              type: 'added',
              value: line,
              lineNumber: { new: newLineNum++ },
            })
            addedCount++
          } else if (change.removed) {
            lines.push({
              type: 'removed',
              value: line,
              lineNumber: { old: oldLineNum++ },
            })
            removedCount++
          } else {
            lines.push({
              type: 'unchanged',
              value: line,
              lineNumber: { old: oldLineNum++, new: newLineNum++ },
            })
          }
        }
      }

      return {
        lines,
        hasChanges: addedCount > 0 || removedCount > 0,
        addedCount,
        removedCount,
      }
    } finally {
      isProcessing.value = false
    }
  }

  // Calculate word-level diff for more granular highlighting
  function calculateWordDiff(
    oldText: string,
    newText: string
  ): Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> {
    const changes = Diff.diffWords(oldText, newText)
    return changes.map(change => ({
      type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      value: change.value,
    }))
  }

  // Apply changes: accept all additions, remove all deletions
  function applyChanges(_oldText: string, newText: string): string {
    return newText
  }

  // Reject changes: keep old text
  function rejectChanges(oldText: string): string {
    return oldText
  }

  // Apply specific lines from diff result
  function applySelectedLines(
    diffResult: DiffResult,
    selectedLineIndices: Set<number>
  ): string {
    const resultLines: string[] = []

    diffResult.lines.forEach((line, index) => {
      if (line.type === 'unchanged') {
        resultLines.push(line.value)
      } else if (line.type === 'added') {
        if (selectedLineIndices.has(index)) {
          resultLines.push(line.value)
        }
      } else if (line.type === 'removed') {
        if (!selectedLineIndices.has(index)) {
          resultLines.push(line.value)
        }
      }
    })

    return resultLines.join('\n')
  }

  return {
    isProcessing,
    calculateDiff,
    calculateWordDiff,
    applyChanges,
    rejectChanges,
    applySelectedLines,
  }
}
