// 仅导出 HTTP 服务
export {
  claudeHttpService,
  type HttpApiConfig,
  type AgentRequest,
  type StreamMessage,
  type StreamCallback,
  type ErrorCallback,
  type DoneCallback,
} from './claudeHttp'

// ACP 服务暂时不导出，需要 Tauri shell 插件
// export * from './claudeAcp'
