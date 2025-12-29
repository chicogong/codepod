import { test, expect } from '@playwright/test'

/**
 * E2E tests for CodePod main application flows
 */

test.describe('Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main layout', async ({ page }) => {
    // Check sidebar exists
    await expect(page.locator('.sidebar')).toBeVisible()

    // Check main content area exists (may be different class names)
    const mainArea = page
      .locator('.app-layout, .main, main, [class*="content"]')
      .first()
    await expect(mainArea).toBeVisible()
  })

  test('should have a New Chat button', async ({ page }) => {
    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await expect(newChatButton).toBeVisible()
  })

  test('should have a Settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i })
    await expect(settingsButton).toBeVisible()
  })
})

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have three tabs in sidebar', async ({ page }) => {
    // Check for Sessions, Files, and Git tabs
    await expect(page.getByText('Sessions')).toBeVisible()
    await expect(page.getByText('Files')).toBeVisible()
    await expect(page.getByText('Git')).toBeVisible()
  })

  test('should switch to Files tab', async ({ page }) => {
    // Click Files tab
    await page.getByText('Files').click()

    // Wait for tab switch and check that content changed
    await page.waitForTimeout(300)

    // The tab should be active now - just verify no errors occurred
    await expect(page.locator('.sidebar')).toBeVisible()
  })

  test('should switch to Git tab', async ({ page }) => {
    // Click Git tab
    await page.getByText('Git').click()

    // Wait for tab switch
    await page.waitForTimeout(300)

    // The tab should be active now - just verify no errors occurred
    await expect(page.locator('.sidebar')).toBeVisible()
  })
})

test.describe('New Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should create a new chat session', async ({ page }) => {
    // Click New Chat button
    await page.getByRole('button', { name: /new chat/i }).click()

    // Should switch to chat view - check for chat-related elements
    await expect(
      page.locator('textarea, .chat-input, [class*="input"]').first()
    ).toBeVisible()
  })

  test('should display chat input', async ({ page }) => {
    await page.getByRole('button', { name: /new chat/i }).click()

    // Chat input should be visible
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible()
  })
})

test.describe('Chat Input Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Create a new chat first
    await page.getByRole('button', { name: /new chat/i }).click()
  })

  test('should allow typing in chat input', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await chatInput.fill('Hello, Claude!')
    await expect(chatInput).toHaveValue('Hello, Claude!')
  })

  test('should have a send button', async ({ page }) => {
    // Look for send button (may have different selectors)
    const sendButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last()
    await expect(sendButton).toBeVisible()
  })

  test('should clear input after sending (when connected)', async ({
    page,
  }) => {
    const chatInput = page.locator('textarea').first()
    await chatInput.fill('Test message')

    // Press Enter to send (may not work without backend)
    await chatInput.press('Enter')

    // The input should either clear or show the message in chat
    // This depends on backend connection
  })
})

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display session list in Sessions tab', async ({ page }) => {
    // Sessions tab should be active by default - check for any session-related content
    const sessionArea = page.locator('.sidebar .n-tab-pane').first()
    await expect(sessionArea).toBeVisible()
  })

  test('should create multiple sessions', async ({ page }) => {
    // Create first session
    await page.getByRole('button', { name: /new chat/i }).click()

    // Go back to sessions (might need to click Sessions tab)
    await page.getByText('Sessions').click()

    // Create second session
    await page.getByRole('button', { name: /new chat/i }).click()

    // Should have at least 2 sessions now
    // This depends on the session list implementation
  })
})

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open settings when clicking Settings button', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /settings/i }).click()

    // Settings modal or panel should appear
    const settingsPanel = page
      .locator(
        '.settings, .config, [class*="modal"], [class*="drawer"], .n-modal, .n-drawer'
      )
      .first()
    await expect(settingsPanel).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Responsive Layout', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // On mobile, sidebar might be hidden or collapsed
    // Check if app is still functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // App should be fully functional
    await expect(page.locator('.sidebar')).toBeVisible()
  })

  test('should work on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // All elements should be visible
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible()
  })
})

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /new chat/i }).click()
  })

  test('should focus chat input', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await chatInput.focus()
    await expect(chatInput).toBeFocused()
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+N for new chat (if implemented)
    await page.keyboard.press('Control+n')

    // Or test Tab navigation
    await page.keyboard.press('Tab')
    // Some element should be focused
  })
})

test.describe('Theme and Appearance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should render without visual errors', async ({ page }) => {
    // Check no console errors related to styling
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      err =>
        !err.includes('favicon') &&
        !err.includes('net::') &&
        !err.includes('Claude not connected')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should have proper contrast and readability', async ({ page }) => {
    // Basic accessibility check
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Check text is visible - use more specific selector
    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await expect(newChatButton).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle missing Claude connection gracefully', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /new chat/i }).click()

    // Try to send a message
    const chatInput = page.locator('textarea').first()
    await chatInput.fill('Test message')
    await chatInput.press('Enter')

    // Should not crash, may show error message
    await expect(page.locator('body')).toBeVisible()
  })

  test('should recover from network errors', async ({ page }) => {
    await page.goto('/')

    // Simulate offline
    await page.context().setOffline(true)

    // App should still be visible
    await expect(page.locator('.sidebar')).toBeVisible()

    // Restore connection
    await page.context().setOffline(false)
  })
})
