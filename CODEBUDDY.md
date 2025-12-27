# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

CodePod is a desktop application that provides a ChatGPT-like interface for Claude Code CLI. It wraps the `claude` CLI tool with a native GUI built using Tauri 2.0.

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Pinia (state management)
- **Backend**: Rust (Tauri 2.0)
- **Build**: Bun + Vite
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + Vue Test Utils

## Commands

```bash
# Install dependencies
bun install

# Development (runs both Vite dev server and Tauri)
bun run tauri:dev

# Build for production
bun run tauri:build

# Run all tests
bun run test

# Run tests once (CI mode)
bun run test:run

# Run single test file
bunx vitest run tests/stores/chat.test.ts

# Run tests with coverage
bun run test:coverage

# Lint and fix
bun run lint

# Check lint only
bun run lint:check

# Format code
bun run format

# Type check
bun run typecheck

# Rust tests (from src-tauri/)
cd src-tauri && cargo test
```

## Architecture

### Frontend-Backend Communication

The app uses Tauri's IPC (Inter-Process Communication) pattern:

1. **Frontend** calls Tauri commands via `@tauri-apps/api`
2. **Backend** (Rust) executes commands and returns results or emits events
3. **Streaming** uses Tauri's event system for real-time updates

### Key Data Flow: Chat Message

```
User Input → ChatInput.vue → useChatStore.addUserMessage()
                                    ↓
                          invoke_claude_stream (Rust)
                                    ↓
                          Spawns `claude` CLI process
                                    ↓
                          Emits stream events via app.emit()
                                    ↓
                          Frontend listens, updates streamingContent
                                    ↓
                          finalizeStreaming() → addAssistantMessage()
```

### Directory Structure

```
src/                          # Vue frontend
├── components/
│   ├── chat/                 # ChatView, ChatInput, MessageList, MessageItem
│   └── layout/               # AppLayout, Sidebar, StatusBar
├── stores/                   # Pinia stores
│   ├── app.ts                # App-level state (theme, project path)
│   ├── chat.ts               # Chat messages, streaming state
│   └── session.ts            # Session history management
├── types/                    # TypeScript type definitions
│   ├── claude.ts             # Message, ContentBlock, Model types
│   ├── session.ts            # Session types
│   └── config.ts             # Config types (MCP, Skills, etc.)
└── App.vue                   # Root component

src-tauri/                    # Rust backend
├── src/
│   ├── lib.rs                # Tauri app setup, command registration
│   ├── main.rs               # Entry point
│   └── commands/
│       ├── mod.rs            # Command module exports
│       └── claude.rs         # Claude CLI integration commands
├── Cargo.toml
└── tauri.conf.json           # Tauri configuration
```

### Core Types (src/types/claude.ts)

```typescript
// Message content can be text, thinking, tool_use, or tool_result
type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock

// Each message has a UUID chain for conversation threading
interface Message {
  uuid: string
  parentUuid: string | null
  role: 'user' | 'assistant'
  content: ContentBlock[]
  timestamp: Date
  model?: string
}
```

### Pinia Stores

- **useChatStore**: Manages current conversation state, streaming, messages
- **useSessionStore**: Manages session history with time-based grouping
- **useAppStore**: App-wide settings (theme, current project path)

### Rust Commands (src-tauri/src/commands/claude.rs)

- `get_claude_version()`: Check if Claude CLI is installed
- `invoke_claude(prompt, options)`: Non-streaming call to Claude CLI
- `invoke_claude_stream(app, prompt, request_id, options)`: Streaming call that emits events

### Event Pattern for Streaming

```rust
// Backend emits to channel: "claude-stream-{request_id}"
app.emit(&format!("claude-stream-{}", request_id), &event);

// Frontend listens with:
listen(`claude-stream-${requestId}`, (event) => { ... })
```

## Testing

Tests are located in `tests/` directory. Store tests use Pinia with `setActivePinia(createPinia())` pattern.

```typescript
// Example test setup
beforeEach(() => {
  setActivePinia(createPinia())
})
```

## Path Aliases

- `@/` maps to `src/` (configured in vite.config.ts and vitest.config.ts)
