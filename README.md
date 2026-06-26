# AI Coding Playground 🎮🌈

> AI 编程引擎可视化系统 —— 孩子用自然语言与 Claude Code 协同开发小游戏的演示。

孩子负责创意，AI 负责编程，程序员负责审核运行。
孩子说一句话 → Claude Code 在已有工程上做最小修改 → 浏览器自动刷新 → 软件一点点长大。

## 技术栈

Vue3 · TypeScript · Vite · pnpm · 单页面 · 无后端

## 快速开始

```bash
pnpm install      # 安装依赖
pnpm run dev      # 启动开发服务器（浏览器会自动打开）
pnpm run build    # 类型检查 + 构建
pnpm run preview  # 预览构建产物
```

## 怎么玩（演示流程）

1. 终端运行 `pnpm run dev`，浏览器打开页面。
2. 在**另一个终端**运行 Claude Code（孩子可以用系统语音转文字插件把想法"说"进去）。
3. 孩子说一句需求，例如"我要一个小恐龙"。
4. Claude Code 按 [CLAUDE.md](CLAUDE.md) 的契约改代码，浏览器自动刷新，新东西出现。
5. 继续说、继续改，软件不断成长。

## 目录简介

- `docs/` — 需求与架构文档
- `src/generated/` — Claude Code 每次只在这里改（加功能 + 追加日志账本）
- `src/components/`、`src/views/` — 页面与组件
- `src/composables/gameProgress.ts` — 状态（从日志账本自动派生）
- `src/styles/` — 卡通糖果风设计变量与全局样式

详细工作规范见 [CLAUDE.md](CLAUDE.md)。
