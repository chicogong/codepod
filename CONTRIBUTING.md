# Contributing to CodePod

感谢你有兴趣为 CodePod 做出贡献！

## 开发环境设置

### 前置要求

- [Bun](https://bun.sh/) (v1.0+)
- [Rust](https://www.rust-lang.org/) (1.77+)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/chicogong/codepod.git
cd codepod

# 安装依赖
bun install

# 启动开发模式
bun run tauri:dev
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新功能，也不是修复 bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置相关

### 示例

```
feat(chat): add streaming response support
fix(session): resolve session restore issue
docs(readme): update installation instructions
```

## Pull Request 流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### PR 检查清单

- [ ] 代码通过 lint 检查 (`bun run lint`)
- [ ] 代码格式正确 (`bun run format:check`)
- [ ] TypeScript 类型检查通过 (`bun run typecheck`)
- [ ] 所有测试通过 (`bun run test:run`)
- [ ] Rust 代码通过 clippy 检查 (`cd src-tauri && cargo clippy`)
- [ ] 如有新功能，已添加相应测试

## 代码风格

### TypeScript/Vue

- 使用 ESLint + Prettier 进行代码格式化
- Vue 组件使用 `<script setup lang="ts">` 语法
- 优先使用 Composition API

### Rust

- 遵循 Rust 官方风格指南
- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 进行静态分析

## 测试

### 前端测试

```bash
# 运行所有测试
bun run test

# 运行单个测试文件
bunx vitest run tests/stores/chat.test.ts

# 运行测试并生成覆盖率报告
bun run test:coverage
```

### Rust 测试

```bash
cd src-tauri
cargo test
```

## 问题反馈

- 使用 [Bug Report](https://github.com/chicogong/codepod/issues/new?template=bug_report.yml) 报告问题
- 使用 [Feature Request](https://github.com/chicogong/codepod/issues/new?template=feature_request.yml) 提出新功能建议

## 许可证

通过提交 PR，你同意你的贡献将在 [MIT License](LICENSE) 下发布。
