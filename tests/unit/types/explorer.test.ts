import { describe, it, expect } from 'vitest'
import type {
  FileEntry,
  DirectoryListing,
  GitStatus,
  GitFileStatus,
  GitBranch,
  GitCommit,
  FileTreeNode,
} from '@/types/explorer'

describe('Explorer Types', () => {
  describe('FileEntry', () => {
    it('should have correct structure for a file', () => {
      const file: FileEntry = {
        name: 'test.ts',
        path: '/project/test.ts',
        is_dir: false,
        is_file: true,
        is_hidden: false,
        size: 1024,
        extension: 'ts',
      }

      expect(file.name).toBe('test.ts')
      expect(file.is_file).toBe(true)
      expect(file.is_dir).toBe(false)
      expect(file.extension).toBe('ts')
    })

    it('should have correct structure for a directory', () => {
      const dir: FileEntry = {
        name: 'src',
        path: '/project/src',
        is_dir: true,
        is_file: false,
        is_hidden: false,
      }

      expect(dir.name).toBe('src')
      expect(dir.is_dir).toBe(true)
      expect(dir.is_file).toBe(false)
      expect(dir.size).toBeUndefined()
    })

    it('should handle hidden files', () => {
      const hidden: FileEntry = {
        name: '.gitignore',
        path: '/project/.gitignore',
        is_dir: false,
        is_file: true,
        is_hidden: true,
      }

      expect(hidden.is_hidden).toBe(true)
    })
  })

  describe('DirectoryListing', () => {
    it('should have correct structure', () => {
      const listing: DirectoryListing = {
        path: '/project/src',
        entries: [
          {
            name: 'index.ts',
            path: '/project/src/index.ts',
            is_dir: false,
            is_file: true,
            is_hidden: false,
          },
        ],
        parent: '/project',
      }

      expect(listing.path).toBe('/project/src')
      expect(listing.entries).toHaveLength(1)
      expect(listing.parent).toBe('/project')
    })

    it('should allow undefined parent (root)', () => {
      const root: DirectoryListing = {
        path: '/',
        entries: [],
      }

      expect(root.parent).toBeUndefined()
    })
  })

  describe('GitStatus', () => {
    it('should represent a git repository', () => {
      const status: GitStatus = {
        is_repo: true,
        branch: 'main',
        ahead: 2,
        behind: 1,
        staged_count: 3,
        unstaged_count: 5,
        untracked_count: 2,
        files: [],
        has_conflicts: false,
      }

      expect(status.is_repo).toBe(true)
      expect(status.branch).toBe('main')
      expect(status.staged_count).toBe(3)
    })

    it('should represent a non-git directory', () => {
      const notRepo: GitStatus = {
        is_repo: false,
        ahead: 0,
        behind: 0,
        staged_count: 0,
        unstaged_count: 0,
        untracked_count: 0,
        files: [],
        has_conflicts: false,
      }

      expect(notRepo.is_repo).toBe(false)
      expect(notRepo.branch).toBeUndefined()
    })
  })

  describe('GitFileStatus', () => {
    it('should represent modified file', () => {
      const modified: GitFileStatus = {
        path: 'src/main.ts',
        status: 'M',
        staged: false,
        status_text: 'modified',
      }

      expect(modified.status).toBe('M')
      expect(modified.staged).toBe(false)
    })

    it('should represent staged file', () => {
      const staged: GitFileStatus = {
        path: 'src/new.ts',
        status: 'A',
        staged: true,
        status_text: 'added',
      }

      expect(staged.status).toBe('A')
      expect(staged.staged).toBe(true)
    })
  })

  describe('GitBranch', () => {
    it('should represent local branch', () => {
      const branch: GitBranch = {
        name: 'feature/new-feature',
        is_current: true,
        is_remote: false,
      }

      expect(branch.is_current).toBe(true)
      expect(branch.is_remote).toBe(false)
    })

    it('should represent remote branch', () => {
      const remote: GitBranch = {
        name: 'origin/main',
        is_current: false,
        is_remote: true,
      }

      expect(remote.is_remote).toBe(true)
    })
  })

  describe('GitCommit', () => {
    it('should have correct structure', () => {
      const commit: GitCommit = {
        hash: 'abc123def456',
        short_hash: 'abc123d',
        message: 'feat: add new feature',
        author: 'John Doe',
        date: '2 hours ago',
      }

      expect(commit.hash).toBe('abc123def456')
      expect(commit.short_hash).toBe('abc123d')
      expect(commit.message).toBe('feat: add new feature')
    })
  })

  describe('FileTreeNode', () => {
    it('should have correct structure for tree', () => {
      const node: FileTreeNode = {
        key: '/project/src',
        label: 'src',
        isLeaf: false,
        path: '/project/src',
        isDir: true,
        isFile: false,
        isHidden: false,
        children: [
          {
            key: '/project/src/index.ts',
            label: 'index.ts',
            isLeaf: true,
            path: '/project/src/index.ts',
            isDir: false,
            isFile: true,
            isHidden: false,
            extension: 'ts',
            size: 512,
          },
        ],
      }

      expect(node.isLeaf).toBe(false)
      expect(node.children).toHaveLength(1)
      expect(node.children?.[0].isLeaf).toBe(true)
    })
  })
})
