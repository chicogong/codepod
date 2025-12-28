# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodePod is a desktop application that provides a ChatGPT-like user experience for Claude Code CLI. It's built as a Tauri v2 app with a Vue 3 frontend and Rust backend.

## Development Commands

### Frontend (Vue/TypeScript)
```bash
# Development
npm run dev              # Vite dev server (web only)
npm run tauri:dev        # Tauri + Vite (full desktop app)

# Build
npm run build            # Build Vue app
npm run tauri:build      # Build Tauri desktop app

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint with auto-fix
npm run lint:check       # ESLint check only
npm run format           # Prettier format
npm run typecheck        # TypeScript type checking
```

### Backend (Rust)
```bash
cd src-tauri

# Testing
cargo test               # Run all Rust tests
cargo test -- --nocapture  # Show test output

# Code Quality
cargo clippy             # Rust linter
cargo fmt                # Format Rust code
cargo build              # Build debug version
cargo build --release    # Build release version
```

Note: This project uses npm (not bun) as specified in `src-tauri/tauri.conf.json`.

## Architecture

### Dual-Mode Communication Architecture

The app supports two communication modes with Claude CLI:

1. **Tauri IPC Mode** (Desktop): Direct IPC calls to Rust backend which spawns Claude CLI
2. **HTTP API Mode** (Fallback): HTTP proxy server for development/alternative environments

Priority: Always tries Tauri IPC first, falls back to HTTP if unavailable.

Key files:
- `src/composables/useClaude.ts` - Handles mode detection and message routing
- `src/services/claudeHttp.ts` - HTTP API client
- `src-tauri/src/commands/claude.rs` - Tauri command handlers

### PTY Terminal System

The app includes a sophisticated PTY (pseudo-terminal) system for interactive Claude CLI sessions, providing full terminal emulation with bidirectional communication.

#### Backend Implementation (`src-tauri/src/pty.rs`)

**Architecture:**
- Uses `portable-pty` crate for cross-platform PTY support
- Global session manager: `lazy_static` HashMap with `parking_lot::Mutex`
- Each session stores `PtyPair` and `Box<dyn Write + Send>` writer

**Session Lifecycle:**
1. `create_pty_session()` spawns PTY with command (default: `claude`)
2. Spawns dedicated thread for reading PTY output (4KB buffer)
3. Thread emits Tauri events: `pty-output` and `pty-exit`
4. Thread auto-cleans session from HashMap on process exit

**Environment Setup:**
- `TERM=xterm-256color` - Full color support
- `COLORTERM=truecolor` - 24-bit color
- Default size: 80 cols × 24 rows

**Key Commands:**
- `create_pty_session(cwd, command, args, cols, rows)` - Generic PTY creation
- `create_claude_pty(cwd, resume_session, cols, rows)` - Claude-specific wrapper with `--resume` support
- `write_to_pty(session_id, data)` - Send user input, flushes immediately
- `resize_pty(session_id, cols, rows)` - Sync terminal size changes
- `close_pty_session(session_id)` - Manual cleanup (auto-cleanup on process exit)
- `list_pty_sessions()` - Get all active session IDs

**Event Payloads:**
```rust
PtyOutput { session_id: String, data: String }
PtyExit { session_id: String, exit_code: Option<i32> }
```

#### Frontend Implementation (`src/components/terminal/TerminalView.vue`)

**Stack:**
- `@xterm/xterm` - Terminal emulator
- `@xterm/addon-fit` - Auto-resize to container
- `@xterm/addon-web-links` - Clickable URLs

**Terminal Configuration:**
- Theme: Tokyo Night-inspired color scheme
- Font: JetBrains Mono / Fira Code / Menlo (14px)
- Scrollback: 10,000 lines
- Cursor: Blinking bar style

**Component Architecture:**
```typescript
// Props
sessionId?: string        // Resume existing Claude session
cwd?: string             // Working directory
autoConnect?: boolean    // Auto-connect on mount

// Events
@connected(sessionId)    // PTY established
@disconnected()          // PTY closed
@error(message)          // Connection failed

// Exposed Methods
connect()                // Manual PTY connection
disconnect()             // Close PTY session
focus()                  // Focus terminal
clear()                  // Clear terminal buffer
```

**Bidirectional Flow:**
1. **User Input**: `terminal.onData()` → `write_to_pty` Tauri command
2. **PTY Output**: `pty-output` event → `terminal.write(data)`
3. **Process Exit**: `pty-exit` event → Display exit code, cleanup listeners

**Resize Handling:**
- `ResizeObserver` on container detects size changes
- `FitAddon.fit()` calculates new terminal dimensions
- `resize_pty` Tauri command syncs PTY size
- Ensures terminal and PTY stay synchronized

**Connection States:**
- `isConnected` ref tracks connection status
- Connection overlay with spinner shown while connecting
- Exit code displayed in yellow on process termination

**Lifecycle:**
- `onMounted`: Initialize xterm, setup ResizeObserver, auto-connect if enabled
- `onUnmounted`: Cleanup event listeners, disconnect PTY, dispose terminal
- Event listeners cleaned up via `unlisten()` functions

**Usage Example:**
```vue
<TerminalView
  :cwd="projectPath"
  :auto-connect="true"
  @connected="handleConnected"
  @error="handleError"
/>
```

### State Management (Pinia)

The app uses Pinia stores with localStorage persistence:

- **appStore** (`stores/app.ts`) - Dark mode, sidebar, project path, global settings
- **chatStore** (`stores/chat.ts`) - Messages, streaming state, token statistics
- **sessionStore** (`stores/session.ts`) - Session list, history, persistence
- **configStore** (`stores/config.ts`) - MCP servers, commands, agents, skills
- **tabsStore** (`stores/tabs.ts`) - Multi-tab dialog management

**Persistence**: All stores auto-save to localStorage. Session messages are serialized with full message history per session ID.

**Token Tracking**: `chatStore` tracks input/output tokens and calculates estimated costs based on model pricing.

### Message Flow

1. User sends message via `ChatInput.vue`
2. `useClaude` composable routes to appropriate mode (Tauri/HTTP)
3. **Tauri Mode**:
   - Invokes `invoke_claude_stream` Rust command
   - Rust spawns Claude CLI with `--output-format stream-json`
   - Streams back via Tauri events (`claude-stream-{requestId}`)
4. **HTTP Mode**:
   - Sends POST to HTTP proxy server
   - Server spawns Claude CLI and streams response
   - Frontend uses `fetch` with streaming response reader
5. `chatStore` accumulates `ContentBlock[]` during streaming
6. On stream completion, finalizes message and persists to session

### Content Block Types

Messages consist of `ContentBlock[]` with types:
- `text` - Regular text content
- `thinking` - Claude's internal reasoning (extended thinking)
- `tool_use` - Tool invocations
- `tool_result` - Tool execution results

Code highlighting uses Shiki with lazy loading for syntax highlighting.

### Configuration Management

The app manages Claude Code configuration files:

- MCP servers: `~/.claude/mcp_settings.json`
- Commands: `~/.claude/commands/*.md`
- Agents: `~/.claude/agents/*.json`
- Skills: `~/.claude/skills/*.md`

Rust backend provides:
- `read_config_file` / `write_config_file` - Generic file I/O with `~` expansion
- `list_commands` / `list_agents` / `list_skills` - Directory scanning

Frontend config panel (`src/components/config/`) provides UI for viewing/editing.

### CLI Selection

Supports toggling between `claude` and `codebuddy` CLI executables:
- Stored in `appStore.cliCommand`
- Persisted to localStorage
- Used when spawning PTY sessions or invoking commands

## Important Patterns

### AbortController for Stream Cancellation

`chatStore` manages an `AbortController` to cancel ongoing streams:
```typescript
// In chatStore
const abortController = ref<AbortController | null>(null)

function createAbortController() {
  abortController.value = new AbortController()
  return abortController.value
}

function stopStreaming() {
  abortController.value?.abort()
  // ... finalize streaming
}
```

This is critical for the "Stop Generation" feature.

### Session Persistence

Sessions auto-save on every message change:
```typescript
// In chatStore
function saveCurrentSession() {
  if (currentSessionId.value && messages.value.length > 0) {
    const sessionStore = useSessionStore()
    sessionStore.saveMessages(currentSessionId.value, messages.value)
    sessionStore.updateSession(currentSessionId.value, {
      messageCount: messages.value.length,
      updatedAt: new Date(),
    })
  }
}
```

Called after every message addition/modification.

### Multi-Tab Architecture

Each tab has its own isolated chat context:
- Tabs stored in `tabsStore.tabs` array
- Each tab has `sessionId`, `title`, `isActive`
- Switching tabs loads corresponding session from `sessionStore`
- New tab creates new session automatically

## Testing

### Frontend Tests
- Framework: Vitest + Vue Test Utils
- Environment: happy-dom
- Setup: `tests/setup.ts`
- Location: `src/**/*.{test,spec}.ts` and `tests/**/*.{test,spec}.ts`

### Rust Tests
- Standard Rust test framework
- Run with `cargo test` in `src-tauri/`
- PTY tests should handle session cleanup

## Known Patterns to Follow

### Adding New Tauri Commands

1. Define command in `src-tauri/src/commands/<module>.rs`
2. Add to `invoke_handler!` macro in `src-tauri/src/lib.rs`
3. Use `CommandResult<T>` return type from `commands/mod.rs`
4. Import and call via `@tauri-apps/api/core` `invoke()` on frontend

### Adding New Content Block Types

1. Update `ContentBlock` type in `src/types/chat.ts`
2. Handle in `parseContentBlock` in `useClaude.ts`
3. Add rendering logic to `src/components/chat/MessageItem.vue`

### Adding New Models

1. Update `ModelId` type in `src/types/chat.ts`
2. Add pricing info to `MODEL_PRICING` in `stores/chat.ts`
3. Update model selector options in UI components

### Working with the Terminal System

**Adding Terminal Addons (xterm.js):**
1. Install addon: `npm install @xterm/addon-<name>`
2. Import in `TerminalView.vue`: `import { AddonName } from '@xterm/addon-<name>'`
3. Instantiate and load: `terminal.loadAddon(new AddonName())`
4. Call after `terminal.open()` but before first use

**Supporting Additional CLI Commands:**
1. Extend `create_pty_session` call with different `command` parameter
2. Adjust environment variables in `src-tauri/src/pty.rs` if needed
3. Handle command-specific arguments via `args` parameter

**Customizing Terminal Theme:**
1. Modify `theme` object in `TerminalView.vue` Terminal constructor
2. For dynamic themes, watch `appStore.isDarkMode` and call `terminal.options.theme = newTheme`
3. Color codes follow xterm standard: 16 colors (8 normal + 8 bright)

**Handling Special Terminal Sequences:**
1. ANSI escape codes are automatically handled by xterm.js
2. For custom handling, use `terminal.parser.registerCsiHandler()` or `terminal.parser.registerOscHandler()`
3. Example: Custom link handling beyond WebLinksAddon

**PTY Session Management:**
1. Access sessions via `PTY_SESSIONS.lock()` (always scope lock to minimal duration)
2. Never hold lock across async operations
3. Session cleanup is automatic on process exit, manual cleanup via `close_pty_session` for user-initiated close
4. Use `list_pty_sessions` for debugging/monitoring active sessions

## Build Targets

The Tauri app builds for:
- macOS (Universal binary - Intel + Apple Silicon)
- Windows (x64)
- Linux (AppImage)

Build artifacts generated by `npm run tauri:build` appear in `src-tauri/target/release/bundle/`.

## Common Gotchas

- **Don't use bun commands**: The project has migrated to npm (see `tauri.conf.json`)
- **Session IDs are UUIDs**: Generated client-side, not from Claude CLI
- **PTY sessions are global**: Use proper locking when accessing `PTY_SESSIONS` HashMap
- **AbortController is HTTP-only**: Tauri stream mode doesn't support mid-stream cancellation (would need process kill)
- **localStorage can fail**: Wrap persistence calls in try-catch
- **Shiki is lazy-loaded**: Don't expect immediate syntax highlighting on first render

### Terminal-Specific Gotchas

- **PTY Thread Auto-Cleanup**: PTY sessions auto-remove from HashMap when process exits. Don't rely on manual cleanup for normal termination.
- **UTF-8 Lossy Conversion**: PTY output uses `String::from_utf8_lossy()`. Binary data may be corrupted.
- **Write Flushing**: Always call `writer.flush()` after `write_all()` in PTY commands for immediate transmission.
- **Event Filtering by Session ID**: Multiple PTY sessions can exist. Always filter `pty-output`/`pty-exit` events by `session_id`.
- **Terminal Disposal**: Must call `terminal.dispose()` on unmount to prevent memory leaks from xterm.js.
- **ResizeObserver Must Be Disconnected**: Always disconnect ResizeObserver in cleanup to prevent performance issues.
- **FitAddon Timing**: Call `fitAddon.fit()` after `nextTick()` to ensure container has rendered.
- **Unlisten Functions**: Store unlisten functions from Tauri `listen()` and call them on cleanup to prevent event listener leaks.
- **Session Resume**: `create_claude_pty` with `resume_session` adds `--resume` flag. Ensure session ID is valid Claude session.
- **Terminal Theme in Light Mode**: Current theme is hardcoded to dark (Tokyo Night). Need separate theme for light mode.
