# AI Coding Playground 🎮🌈

> AI 编程引擎可视化系统 —— 孩子在网页上用自然语言指挥 AI 写小游戏。

孩子负责创意，AI 负责编程，程序员负责审核运行。
孩子说一句话 → 网页把需求送给 Claude Code → Claude 改代码 → 浏览器自动刷新 → 软件一点点长大。

## 技术栈

Vue3 · TypeScript · Vite · pnpm · 单页面 · 本机 `claude`（Claude Code）驱动

## 运行前提

1. 本机已安装 **Claude Code**（`claude` 命令）并**已登录**。网页里的输入框会把孩子的话送给它。
   鉴权复用 `claude` 的登录态（OAuth），**不需要单独的 API Key**。
2. Node ≥ 18、pnpm。

## 快速开始

```bash
pnpm install      # 安装依赖
pnpm run dev      # 启动开发服务器（浏览器会自动打开）
pnpm run build    # 类型检查 + 构建
pnpm run preview  # 预览构建产物（注意：preview 下没有 AI 接口，演示请用 dev）
```

## 怎么玩（演示流程）

1. 终端运行 `pnpm run dev`，浏览器打开页面。
2. 孩子在输入框打字，例如"我要一个会飞的小恐龙"，点 **✨ 帮我做**。
3. 页面实时显示 AI 的工作过程（想办法 → 改代码 → 完成）。
4. Claude 按契约改好代码后，游戏区和日志自动"长大"，孩子立刻看到结果。
5. 继续说、继续改，软件不断成长。

> 单次请求约 5～20 秒，取决于 Claude 的回复速度。

## 目录简介

- `docs/` — 需求与架构文档
- `server/claudeBridge.ts` — 本地接口 `/api/wish`（dev 下把需求送给 claude，实时回推过程）
- `src/generated/` — Claude Code 每次只在这里改（加功能 + 追加日志账本）
- `src/components/InputBar.vue` — 孩子输入 + 实时 AI 状态
- `src/composables/` — 状态：日志派生（gameProgress）、AI 工作流（useAiWorkflow）
- `src/styles/` — 卡通糖果风设计变量与全局样式

详细工作规范见 [CLAUDE.md](CLAUDE.md)。
