# CodePod

<p align="center">
  <img src="public/logo.svg" alt="CodePod Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Claude Code Desktop App</strong><br>
  让 AI 编程助手拥有 ChatGPT 级别的用户体验
</p>

<p align="center">
  <a href="https://github.com/chicogong/codepod/actions/workflows/ci.yml">
    <img src="https://github.com/chicogong/codepod/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
  <a href="https://github.com/chicogong/codepod/releases">
    <img src="https://img.shields.io/github/v/release/chicogong/codepod?include_prereleases" alt="Release">
  </a>
  <a href="https://github.com/chicogong/codepod/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/chicogong/codepod" alt="License">
  </a>
  <a href="https://codecov.io/gh/chicogong/codepod">
    <img src="https://codecov.io/gh/chicogong/codepod/branch/master/graph/badge.svg" alt="Coverage">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

- **Chat Interface** - 流畅的聊天体验，支持流式输出
- **Session Management** - 会话列表和历史管理
- **Dark Mode** - 支持亮色/暗色主题切换
- **Claude CLI Integration** - 通过 Tauri 调用本地 Claude Code CLI
- **Project Selector** - 项目文件夹选择和最近项目列表
- **Keyboard Shortcuts** - 快捷键支持 (⌘/Ctrl+N, ⌘/Ctrl+D, ⌘/Ctrl+B, ⌘/Ctrl+K)
- **Message Search** - 消息搜索和高亮显示

## Tech Stack

| 层级 | 技术 |
|------|------|
| **Frontend** | Vue 3 + TypeScript + Pinia |
| **Backend** | Rust (Tauri 2.0) |
| **Build** | Bun + Vite |
| **Styling** | Tailwind CSS v4 |
| **Testing** | Vitest + Vue Test Utils |

## Installation

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 已安装并配置
- macOS 10.15+ / Windows 10+ / Linux

### Download

从 [Releases](https://github.com/chicogong/codepod/releases) 页面下载适合你系统的安装包：

| 平台 | 文件 |
|------|------|
| macOS (Universal) | `CodePod_x.x.x_universal.dmg` |
| Windows | `CodePod_x.x.x_x64-setup.exe` |
| Linux | `CodePod_x.x.x_amd64.AppImage` |

## Development

### 环境要求

- [Bun](https://bun.sh/) v1.0+
- [Rust](https://www.rust-lang.org/) 1.77+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/chicogong/codepod.git
cd codepod

# 安装依赖
bun install

# 开发模式
bun run tauri:dev

# 构建生产版本
bun run tauri:build
```

### 常用命令

```bash
# 代码检查
bun run lint          # Lint 并自动修复
bun run lint:check    # 仅检查
bun run format        # 格式化代码
bun run typecheck     # TypeScript 类型检查

# 测试
bun run test          # 运行测试 (watch mode)
bun run test:run      # 运行测试 (单次)
bun run test:coverage # 生成覆盖率报告

# Rust
cd src-tauri
cargo test            # 运行 Rust 测试
cargo clippy          # Rust 静态分析
```

## Project Structure

```
codepod/
├── src/                      # Vue frontend
│   ├── components/
│   │   ├── chat/            # ChatView, ChatInput, MessageList, MessageItem, SearchBar
│   │   ├── session/         # SessionList
│   │   ├── project/         # ProjectSelector
│   │   └── layout/          # AppLayout, Sidebar, StatusBar
│   ├── composables/         # Vue composables (useClaude, useProject, useKeyboard, useSearch)
│   ├── stores/              # Pinia stores (app, chat, session)
│   └── types/               # TypeScript 类型定义
├── src-tauri/               # Rust backend
│   └── src/commands/        # Tauri commands (Claude CLI 集成)
├── tests/                   # 测试文件
└── .github/                 # GitHub 配置 (CI, Issue 模板)
```

## Roadmap

### v0.1.0 - MVP

- [x] 基础聊天界面
- [x] 流式输出支持
- [x] 会话管理
- [x] 亮色/暗色主题
- [x] CI/CD 配置

### v0.2.0 - Enhanced UX (Current)

- [x] 项目选择器
- [x] 快捷键支持
- [x] 消息搜索
- [ ] 代码高亮改进 (Shiki)

### v0.3.0 - Configuration

- [ ] MCP 服务器管理
- [ ] Skills 配置
- [ ] Commands 配置
- [ ] Agents 配置

### v0.4.0 - Advanced Features

- [ ] 多标签页对话
- [ ] 导出对话历史
- [ ] 插件系统
- [ ] 自定义主题

## Contributing

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与开发。

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/chicogong">chicogong</a>
</p>
