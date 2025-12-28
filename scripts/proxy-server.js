#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Claude Code Proxy Server
 * 将 HTTP 请求转发到 claude/codebuddy 命令
 *
 * 用法: node scripts/proxy-server.js [port]
 * 默认端口: 3002
 *
 * 环境变量:
 * - CLI_TYPE: 'claude' | 'codebuddy' (默认: 'claude')
 * - CLAUDE_PATH: claude CLI 路径 (默认: /opt/homebrew/bin/claude)
 * - CODEBUDDY_PATH: codebuddy CLI 路径 (默认: codebuddy)
 */

import http from 'http'
import { spawn, execFileSync } from 'child_process'

const PORT = process.argv[2] || process.env.PORT || 3002

// CLI 配置
const CLI_CONFIGS = {
  claude: {
    path: process.env.CLAUDE_PATH || '/opt/homebrew/bin/claude',
    // Claude Code CLI 参数
    skipPermissions: '--dangerously-skip-permissions',
    requiresVerbose: true, // stream-json 需要 --verbose
  },
  codebuddy: {
    path: process.env.CODEBUDDY_PATH || 'codebuddy',
    // CodeBuddy CLI 参数
    skipPermissions: '-y',
    requiresVerbose: false,
  },
}

// 当前使用的 CLI 类型（可通过 API 切换）
let currentCliType = process.env.CLI_TYPE || 'claude'

/**
 * 检测 CLI 是否可用
 */
function detectCli(cliType) {
  const config = CLI_CONFIGS[cliType]
  if (!config) return false

  try {
    execFileSync(config.path, ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * 获取当前 CLI 配置
 */
function getCurrentCliConfig() {
  return CLI_CONFIGS[currentCliType] || CLI_CONFIGS.claude
}

const server = http.createServer(async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 健康检查
  if (req.url === '/health' || req.url === '/doctor') {
    const claudeAvailable = detectCli('claude')
    const codebuddyAvailable = detectCli('codebuddy')

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        version: 'proxy-1.1.0',
        currentCli: currentCliType,
        cliPath: getCurrentCliConfig().path,
        availableClis: {
          claude: claudeAvailable,
          codebuddy: codebuddyAvailable,
        },
      })
    )
    return
  }

  // 获取/设置 CLI 类型
  if (req.url === '/cli' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        currentCli: currentCliType,
        cliPath: getCurrentCliConfig().path,
        availableClis: Object.keys(CLI_CONFIGS),
      })
    )
    return
  }

  if (req.url === '/cli' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const { cliType } = JSON.parse(body)
        if (!CLI_CONFIGS[cliType]) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              error: `Invalid CLI type: ${cliType}. Available: ${Object.keys(CLI_CONFIGS).join(', ')}`,
            })
          )
          return
        }

        // 检测 CLI 是否可用
        if (!detectCli(cliType)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              error: `CLI '${cliType}' is not available at path: ${CLI_CONFIGS[cliType].path}`,
            })
          )
          return
        }

        currentCliType = cliType
        console.log(`[Proxy] Switched to CLI: ${cliType}`)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            success: true,
            currentCli: currentCliType,
            cliPath: getCurrentCliConfig().path,
          })
        )
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  // Agent 请求
  if (req.url === '/agent' && req.method === 'POST') {
    let body = ''

    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      console.log('[Proxy] Request body received')
      try {
        const request = JSON.parse(body)
        console.log('[Proxy] Parsed request:', request)
        const { prompt, outputFormat = 'stream-json', model, cliType } = request

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'prompt is required' }))
          return
        }

        // 如果请求中指定了 cliType，临时使用该类型
        const useCliType =
          cliType && CLI_CONFIGS[cliType] ? cliType : currentCliType
        const cliConfig = CLI_CONFIGS[useCliType]

        // 构建命令参数
        const args = [
          '-p',
          prompt,
          cliConfig.skipPermissions,
          '--output-format',
          outputFormat,
        ]

        // 流式输出需要 --include-partial-messages 来获取增量更新
        if (outputFormat === 'stream-json') {
          args.push('--include-partial-messages')
        }

        if (cliConfig.requiresVerbose && outputFormat === 'stream-json') {
          args.push('--verbose')
        }

        if (model) {
          args.push('--model', model)
        }

        console.log(
          `[Proxy] Running (${useCliType}):`,
          cliConfig.path,
          args.join(' ')
        )

        // 设置响应头
        if (outputFormat === 'stream-json') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
        }

        // 启动子进程
        console.log('[Proxy] Spawning:', cliConfig.path, args)
        const child = spawn(cliConfig.path, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            // 禁用 Node.js stdout 缓冲
            PYTHONUNBUFFERED: '1',
            NODE_OPTIONS: '--no-warnings',
          },
        })

        let outputBuffer = ''

        // 设置 stdout 为流式模式，尽快发送数据
        child.stdout.setEncoding('utf8')

        child.stdout.on('data', data => {
          const text = data.toString()
          outputBuffer += text

          if (outputFormat === 'stream-json') {
            // 转换为 SSE 格式，立即发送每一行
            const lines = text.split('\n')
            for (const line of lines) {
              if (line.trim()) {
                res.write(`event: next\ndata: ${line}\n\n`)
              }
            }
          }
        })

        child.stderr.on('data', data => {
          console.error('[Proxy stderr]', data.toString())
        })

        child.on('close', code => {
          console.log('[Proxy] Process exited with code:', code)

          if (outputFormat === 'stream-json') {
            res.write('event: done\ndata: {}\n\n')
            res.end()
          } else {
            res.end(outputBuffer)
          }
        })

        child.on('error', err => {
          console.error('[Proxy] Process error:', err)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
          }
          res.end(JSON.stringify({ error: err.message }))
        })
      } catch (err) {
        console.error('[Proxy] Error:', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })

    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  const claudeAvailable = detectCli('claude')
  const codebuddyAvailable = detectCli('codebuddy')

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Claude/CodeBuddy Proxy Server v1.1.0                     ║
║                                                            ║
║   Endpoint: http://127.0.0.1:${PORT}                          ║
║                                                            ║
║   Current CLI: ${currentCliType.padEnd(42)}║
║   CLI Path: ${getCurrentCliConfig().path.padEnd(45).slice(0, 45)}║
║                                                            ║
║   Available CLIs:                                          ║
║   - claude:    ${claudeAvailable ? '✓ available' : '✗ not found'}                               ║
║   - codebuddy: ${codebuddyAvailable ? '✓ available' : '✗ not found'}                               ║
║                                                            ║
║   Endpoints:                                               ║
║   - GET  /health  - Health check + CLI status              ║
║   - GET  /cli     - Get current CLI config                 ║
║   - POST /cli     - Switch CLI type                        ║
║   - POST /agent   - Send prompt to CLI                     ║
║                                                            ║
║   Press Ctrl+C to stop                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`)
})

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n[Proxy] Shutting down...')
  server.close(() => {
    process.exit(0)
  })
})
