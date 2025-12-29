// File Explorer types

export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  is_file: boolean
  is_hidden: boolean
  size?: number
  extension?: string
}

export interface DirectoryListing {
  path: string
  entries: FileEntry[]
  parent?: string
}

// Git types

export interface GitFileStatus {
  path: string
  status: string // M, A, D, R, C, U, ?
  staged: boolean
  status_text: string // "modified", "added", "deleted", etc.
}

export interface GitStatus {
  is_repo: boolean
  branch?: string
  ahead: number
  behind: number
  staged_count: number
  unstaged_count: number
  untracked_count: number
  files: GitFileStatus[]
  has_conflicts: boolean
}

export interface GitBranch {
  name: string
  is_current: boolean
  is_remote: boolean
}

export interface GitCommit {
  hash: string
  short_hash: string
  message: string
  author: string
  date: string
}

// Tree node type for Naive UI NTree
export interface FileTreeNode {
  key: string
  label: string
  isLeaf: boolean
  prefix?: () => unknown
  children?: FileTreeNode[]
  // Custom data
  path: string
  isDir: boolean
  isFile: boolean
  isHidden: boolean
  extension?: string
  size?: number
}
