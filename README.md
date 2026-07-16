<div align="center">
  <img src="public/logo.svg" alt="CodePod Logo" width="160" height="160">
  
  <h1>CodePod</h1>
  <p><b>The Ultimate GUI Desktop App for Claude Code CLI</b></p>
  <p><i>Bring the power of Anthropic's terminal agent into a beautiful, persistent, and highly productive desktop environment.</i></p>

  <a href="https://github.com/chicogong/codepod/stargazers"><img src="https://img.shields.io/github/stars/chicogong/codepod?style=for-the-badge&color=eab308" alt="Stars"></a>
  <a href="https://github.com/chicogong/codepod/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/chicogong/codepod/ci.yml?style=for-the-badge" alt="CI Status"></a>
  <a href="https://github.com/chicogong/codepod/releases"><img src="https://img.shields.io/github/v/release/chicogong/codepod?include_prereleases&style=for-the-badge&color=3b82f6" alt="Release"></a>
  <a href="https://github.com/chicogong/codepod/blob/master/LICENSE"><img src="https://img.shields.io/github/license/chicogong/codepod?style=for-the-badge" alt="License"></a>
  
  <br><br>
</div>

CodePod is a cross-platform desktop application built with **Tauri v2** and **Vue 3**. It wraps the powerful [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) into a premium graphical interface. 

Why use a raw terminal when you can have a visually stunning dual-engine (Chat + Terminal) environment that tracks your history, manages your MCP servers, and checkpoints your code automatically?

---

## ✨ Why CodePod? (Features)

### ☯️ Dual Engine: Chat & Terminal
Never compromise between GUI comfort and CLI power again.
* **Chat View**: Translates raw terminal ANSI streams into beautiful, Markdown-rendered conversations with syntax highlighting.
* **Pro Terminal View**: A fully-featured xterm.js PTY instance with custom themes, search functionality, and full standard input/output mapping.

### 🧠 Advanced Session Management
Raw CLIs suffer from "session amnesia". CodePod fixes this:
* **Multi-tab Sessions**: Chat with Claude about `bug-fixes` in one tab while discussing `architecture` in another.
* **Command History**: Just press `↑` or `↓` to recall your previous commands across any session.
* **Auto Checkpoints**: AI broke your code? CodePod automatically creates session checkpoints based on your commit history and message counts so you can always roll back safely.

### 🔌 Visual AI Toolchain Control Center
Stop editing JSON files blindly.
* **MCP Servers**: Add, toggle, and manage Model Context Protocol integrations via a beautiful glassmorphic UI.
* **Custom Agents**: View your custom Claude agents and their system prompts in high-fidelity cards.
* **AI Skills**: Effortlessly load markdown skill sets from `~/.claude/skills/` and toggle them on/off with a click.

---

## 📸 Screenshots

<p align="center">
  <img src="https://github.com/chicogong/codepod/releases/download/v0.5.0/codepod-window.png" alt="CodePod Screenshot" width="800" style="border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
</p>
<p align="center"><i>Beautiful dark mode, custom terminal themes, and a highly polished Naive UI integration.</i></p>

---

## 🚀 Installation

### Prerequisites
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated.
- macOS 10.15+ / Windows 10+ / Linux

### Download Latest Release

Download the pre-compiled binaries from the [Releases](https://github.com/chicogong/codepod/releases/latest) page:

🍎 **macOS**
- **Apple Silicon (M1/M2/M3)**: [`CodePod_aarch64.dmg`](https://github.com/chicogong/codepod/releases/latest) *(Recommended)*

🪟 **Windows**
- **Setup Installer**: [`CodePod_x64-setup.exe`](https://github.com/chicogong/codepod/releases/latest) *(Recommended)*

🐧 **Linux**
- **AppImage**: [`CodePod_amd64.AppImage`](https://github.com/chicogong/codepod/releases/latest) *(Recommended)*
- Debian/Ubuntu `.deb` & Fedora `.rpm` also available.

---

## 🛠️ Development

We welcome contributors! CodePod is built with modern web technologies and Rust.

### Tech Stack
- **Frontend**: Vue 3 + TypeScript + Pinia + Tailwind CSS v4
- **UI Framework**: Naive UI
- **Terminal Engine**: xterm.js + portable-pty
- **Backend**: Rust (Tauri 2.0)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/chicogong/codepod.git
cd codepod

# Install dependencies
npm install

# Run in development mode (starts both Vite and Tauri)
npm run tauri:dev
```

---

## 🗺️ Roadmap

**v0.5.0 - The Terminal Era**
- [x] PTY Terminal integration
- [x] xterm.js with Naive UI wrapper
- [x] Dual View Mode (Chat/Terminal)

**v0.6.0 - The UX Polish & Control Center (Current)**
- [x] Terminal Search Addon
- [x] Premium Terminal Themes (Tokyo Night, GitHub Dark, etc.)
- [x] Command History (Up/Down arrow navigation)
- [x] Auto Checkpoint System
- [x] Visual Overhaul for MCP / Agents / Skills configuration

**v0.7.0 - The Workflow Era (Planned)**
- [ ] Visual Diffing (GUI review for AI file edits)
- [ ] Context Drag & Drop (Drag files straight into context)
- [ ] Cloud Sync

---

## 🤝 Contributing
Found a bug or want to suggest a feature? Please check our [CONTRIBUTING.md](CONTRIBUTING.md) and open an issue or pull request!

## 📄 License
This project is licensed under the [MIT License](LICENSE).

<p align="center">
  Made with ❤️ by <a href="https://github.com/chicogong">chicogong</a>
</p>
