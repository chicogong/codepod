#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * CodeBuddy Proxy Server
 * 将 HTTP 请求转发到 codebuddy -p 命令
 *
 * 用法: node scripts/proxy-server.js [port]
 * 默认端口: 3000
 */

import http from 'http'
import { spawn } from 'child_process'

const PORT = process.argv[2] || process.env.PORT || 3002

// 使用环境变量或默认命令名（假设在 PATH 中）
const CODEBUDDY_PATH = process.env.CODEBUDDY_PATH || 'codebuddy'

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
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', version: 'proxy-1.0.0' }))
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
        const { prompt, outputFormat = 'stream-json', model } = request

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'prompt is required' }))
          return
        }

        // 构建命令参数
        const args = ['-p', prompt, '-y', '--output-format', outputFormat]
        if (model) {
          args.push('--model', model)
        }

        console.log('[Proxy] Running: codebuddy', args.join(' '))

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
        console.log('[Proxy] Spawning:', CODEBUDDY_PATH, args)
        const child = spawn(CODEBUDDY_PATH, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let outputBuffer = ''

        child.stdout.on('data', data => {
          const text = data.toString()
          outputBuffer += text

          if (outputFormat === 'stream-json') {
            // 转换为 SSE 格式
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

        // 注意：移除 req.on('close') 因为它可能过早触发
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
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   CodeBuddy Proxy Server                                   ║
║                                                            ║
║   Endpoint: http://127.0.0.1:${PORT}                          ║
║                                                            ║
║   Available endpoints:                                     ║
║   - GET  /health     - Health check                        ║
║   - POST /agent      - Send prompt to CodeBuddy            ║
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
