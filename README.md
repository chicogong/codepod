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

## Screenshots

<p align="center">
  <img src="https://github.com/chicogong/codepod/releases/download/v0.5.0/codepod-window.png" alt="CodePod Screenshot" width="800">
</p>

<p align="center">
  <em>CodePod v0.5.0 - Chat & Terminal integrated interface with Naive UI</em>
</p>

---

## 🎉 What's New in v0.5.0

### 🖥️ **Terminal Support**
完整的 PTY 终端集成，支持与 Claude CLI 的实时交互！
- 基于 xterm.js 的全功能终端模拟器
- 真实的伪终端（PTY）支持，完整 ANSI 转义序列
- 多终端标签页，同时运行多个会话
- 支持恢复之前的 Claude 会话（`--resume`）
- 自动窗口大小调整和可点击链接

### 🎨 **Naive UI 集成**
全面升级到 Naive UI 组件库，提供更现代、更专业的界面体验！
- 更好的布局和视觉层次
- 优化的交互设计
- 响应式设计，适配不同窗口尺寸

### 📑 **高级特性**
- **多标签对话**：同时进行多个对话，灵活切换
- **会话导出**：支持导出为 Markdown 和 JSON 格式
- **Token 统计**：实时跟踪使用量和估算成本
- **会话持久化**：所有对话自动保存到 localStorage

### 🔧 **其他改进**
- 流式输出支持，更流畅的对话体验
- 模型选择器，快速切换 Claude 模型
- 双 CLI 支持（claude / codebuddy）
- 更好的错误处理和恢复机制

---

## Features

### 💬 Chat Mode
- **Chat Interface** - 流畅的聊天体验，支持流式输出
- **Session Management** - 会话列表、历史管理、会话持久化、重命名
- **Multi-tab Dialogs** - 多标签页对话，同时进行多个会话
- **Message Operations** - 消息编辑、删除、重新生成
- **Message Search** - 消息搜索和高亮显示
- **Code Highlighting** - 使用 Shiki 进行代码语法高亮
- **Export Dialog** - 导出对话为 Markdown/JSON 格式
- **Token Statistics** - 实时显示 Token 使用量和估算成本

### 🖥️ Terminal Mode (NEW!)
- **Integrated Terminal** - 基于 xterm.js 的完整终端模拟器
- **PTY Support** - 真实的伪终端支持，完整 ANSI 转义序列
- **Multi-terminal Tabs** - 支持多个并发终端会话
- **Claude CLI Integration** - 直接在终端运行 Claude 命令
- **Session Resume** - 支持恢复之前的 Claude 会话
- **Auto-resize** - 终端自动适应窗口大小
- **Clickable Links** - 终端中的 URL 可点击

### 🎨 UI/UX
- **Naive UI** - 现代化组件库，提供优秀的交互体验
- **Dark Mode** - 支持亮色/暗色主题切换
- **Dual View Mode** - Chat 与 Terminal 视图无缝切换
- **Project Selector** - 项目文件夹选择和最近项目列表
- **Keyboard Shortcuts** - 丰富的快捷键支持

### ⚙️ Configuration
- **Claude CLI Integration** - 支持 `claude` 和 `codebuddy` 双 CLI 切换
- **MCP Server Management** - 管理 MCP 服务器配置
- **Commands & Agents** - 查看和管理自定义 Commands 和 Agents
- **Skills Configuration** - 技能配置和管理

## Tech Stack

| 层级 | 技术 |
|------|------|
| **Frontend** | Vue 3 + TypeScript + Pinia |
| **UI Library** | Naive UI |
| **Terminal** | xterm.js + portable-pty |
| **Backend** | Rust (Tauri 2.0) |
| **Build** | npm + Vite |
| **Styling** | Tailwind CSS v4 |
| **Testing** | Vitest + Vue Test Utils |

## Keyboard Shortcuts

| 快捷键 | 功能 |
|--------|------|
| `⌘/Ctrl + N` | 新建会话 |
| `⌘/Ctrl + D` | 切换暗色模式 |
| `⌘/Ctrl + B` | 切换侧边栏 |
| `⌘/Ctrl + K` | 搜索消息 |
| `⌘/Ctrl + F` | 搜索消息 |
| `⇧⌘/Ctrl + E` | 导出对话 |
| `⌘/Ctrl + T` | 新建标签页 |

## Installation

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 已安装并配置
- macOS 10.15+ / Windows 10+ / Linux

### Download Latest Release (v0.5.0)

从 [Releases](https://github.com/chicogong/codepod/releases/latest) 页面下载适合你系统的安装包：

#### macOS
- **Apple Silicon (M1/M2/M3)**: [`CodePod_0.1.0_aarch64.dmg`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_0.1.0_aarch64.dmg) (推荐)
- **Alternative**: [`CodePod_aarch64.app.tar.gz`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_aarch64.app.tar.gz)

#### Windows
- **Setup Installer**: [`CodePod_0.1.0_x64-setup.exe`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_0.1.0_x64-setup.exe) (推荐)
- **MSI Installer**: [`CodePod_0.1.0_x64_en-US.msi`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_0.1.0_x64_en-US.msi)

#### Linux
- **AppImage (Universal)**: [`CodePod_0.1.0_amd64.AppImage`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_0.1.0_amd64.AppImage) (推荐)
- **Debian/Ubuntu**: [`CodePod_0.1.0_amd64.deb`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod_0.1.0_amd64.deb)
- **Fedora/RHEL**: [`CodePod-0.1.0-1.x86_64.rpm`](https://github.com/chicogong/codepod/releases/download/v0.5.0/CodePod-0.1.0-1.x86_64.rpm)

## Development

### 环境要求

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/) 1.77+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/chicogong/codepod.git
cd codepod

# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### 常用命令

```bash
# 代码检查
npm run lint          # Lint 并自动修复
npm run lint:check    # 仅检查
npm run format        # 格式化代码
npm run typecheck     # TypeScript 类型检查

# 测试
npm run test          # 运行测试 (watch mode)
npm run test:run      # 运行测试 (单次)
npm run test:coverage # 生成覆盖率报告

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
│   │   ├── chat/            # ChatView, ChatInput, MessageList, MessageItem, SearchBar, CodeBlock, ExportDialog
│   │   ├── terminal/        # TerminalView (xterm.js 集成)
│   │   ├── session/         # SessionList
│   │   ├── project/         # ProjectSelector
│   │   ├── config/          # ConfigPanel, McpServerList, CommandList, AgentList, SkillList, CliSettings
│   │   └── layout/          # AppLayout, Sidebar, StatusBar, TabBar
│   ├── composables/         # Vue composables (useClaude, useProject, useKeyboard, useSearch, useHighlighter)
│   ├── services/            # HTTP API service (claudeHttp)
│   ├── stores/              # Pinia stores (app, chat, session, config, tabs)
│   ├── types/               # TypeScript 类型定义
│   └── MainView.vue         # 主视图 (Chat/Terminal 切换)
├── src-tauri/               # Rust backend
│   └── src/
│       ├── commands/        # Tauri commands (Claude CLI, Config 集成)
│       └── pty.rs           # PTY 终端管理
├── scripts/                 # 辅助脚本 (proxy-server.js)
├── tests/                   # 测试文件
├── CLAUDE.md                # 项目架构文档
└── .github/                 # GitHub 配置 (CI, Issue 模板)
```

## Roadmap

### v0.1.0 - MVP

- [x] 基础聊天界面
- [x] 流式输出支持
- [x] 会话管理
- [x] 亮色/暗色主题

### v0.2.0 - Enhanced UX

- [x] 项目选择器
- [x] 快捷键支持
- [x] 消息搜索
- [x] 代码高亮改进 (Shiki)

### v0.3.0 - Configuration

- [x] MCP 服务器管理
- [x] Commands 配置
- [x] Agents 配置
- [x] Skills 配置
- [x] 双 CLI 支持 (claude/codebuddy)

### v0.4.0 - Advanced Features

- [x] 会话持久化 (localStorage)
- [x] 消息编辑与删除
- [x] 会话重命名
- [x] 多标签页对话
- [x] 导出对话历史 (Markdown/JSON)
- [x] Token 使用量统计

### v0.5.0 - Terminal & UI Enhancement (Current)

- [x] PTY 终端系统
- [x] xterm.js 集成
- [x] Naive UI 组件库
- [x] 双视图模式 (Chat/Terminal)
- [x] 多终端标签页
- [x] 终端会话恢复

### v0.6.0 - Future

- [ ] 终端主题自定义
- [ ] 终端会话持久化
- [ ] 命令历史记录
- [ ] 终端搜索功能
- [ ] 插件系统
- [ ] 云端同步

## Contributing

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与开发。

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/chicogong">chicogong</a>
</p>
