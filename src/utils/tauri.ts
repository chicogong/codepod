/**
 * Tauri API compatibility layer
 * Provides mock implementations for browser environment
 */

// Check if running in Tauri
export const isTauri = (): boolean => {
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}

// Safe invoke wrapper
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauri()) {
    console.warn(`[Tauri] Command "${command}" called in browser environment`)
    throw new Error('Tauri API not available in browser')
  }

  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

// Safe listen wrapper
export async function safeListen<T>(
  event: string,
  handler: (event: { payload: T }) => void
): Promise<() => void> {
  if (!isTauri()) {
    console.warn(`[Tauri] Event "${event}" listener in browser environment`)
    return () => {} // Return no-op unlisten function
  }

  const { listen } = await import('@tauri-apps/api/event')
  return listen<T>(event, handler)
}
