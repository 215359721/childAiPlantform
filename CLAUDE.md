# CLAUDE.md — AI Coding Playground 工作契约

> 本文件是给 **Claude Code（你）** 看的。每次开工请先读完本文件，再读 `docs/` 下的需求与架构文档。

## 这是一个什么项目

**AI 编程引擎可视化系统（AI Coding Playground）** —— 面向亲子 AI 活动的演示项目。

展示一种新的开发模式：**孩子负责创意、AI 负责编程、程序员负责审核运行**。
孩子用自然语言一句一句提需求（"我要一个小恐龙""我要它会飞"），Claude Code 在已有工程上做**最小修改**，Vite 热更新让浏览器自动刷新，软件就这样"一点点长大"。

- 技术栈：Vue3 + TypeScript + Vite + pnpm
- 单页面、无后端、不加复杂第三方依赖
- **重点是过程（一句话 → 改代码 → 运行 → 再改），不是最终作品**

## 每次开工必做

1. 读 `docs/AI编程引擎可视化系统-需求.md` 和 `docs/AI编程引擎可视化系统-技术架构.md`。
2. 理解孩子这一句需求，分析当前代码，找**最小修改方案**。
3. 只完成这一个需求。改完必须保证 `pnpm run dev` 能正常启动。

## ⭐ 最小修改契约（核心）

每一轮需求，**只动 `src/generated/` 下的文件，只做两件事**：

### 1. 在 `src/generated/GameContent.vue` 里加入新功能
- 在现有内容**下方继续加**新元素（小恐龙、按钮、动画、背景…）。
- **只增不改不删**：已有功能继续保留可用，不要重构、不要覆盖历史功能。
- 新功能与已有冲突时，优先兼容。

### 2. 在 `src/generated/changeLog.ts` 的数组末尾追加一条记录
```ts
{ emoji: '🦕', summary: '新增小恐龙', childSaid: '我要一个小恐龙', time: '2026-06-26', type: 'feature' }
```
- `type` 只有两种：`'create'`（项目创建，仅此一条，不要动）/ `'feature'`（孩子的新需求）。
- **不要**手动改状态面板里的"修改次数 / 最后修改时间"——它们由 `src/composables/gameProgress.ts` 从 `changeLog` **自动派生**。

只要做好这两件事，状态、日志、计数就会自动更新，几乎不可能把项目改崩。

## ❌ 绝对不要做

- 不要改项目结构、不要新增/删除目录。
- 不要改 `vite.config.ts` / `tsconfig.json` / `package.json`。
- 不要加后端、不要加新的 npm 依赖。
- 不要加复杂导航、登录、后台、路由——**始终单页面**。
- 不要一次改多个需求；不要删除已有功能；不要整体重构。
- 不要保留 TODO，不要留死代码。

## 项目结构（参考，勿改）

```
src/
├── main.ts                  # 入口，挂载 App + 引入全局样式
├── App.vue                  # 渲染 PlaygroundView
├── env.d.ts                 # 类型声明
├── assets/                  # 图片资源
├── styles/
│   ├── variables.css        # 糖果调色板 & 设计变量（颜色、圆角、字体）
│   └── main.css             # 全局样式、渐变背景、漂浮圆斑
├── composables/
│   └── gameProgress.ts      # 状态：从 changeLog 派生 计数/最后时间/日志列表
├── components/              # 公共组件（职责单一）
│   ├── GameHeader.vue       # ① 标题
│   ├── GameCanvas.vue       # ② 游戏区卡片（内嵌 GameContent）
│   ├── StatusPanel.vue      # ③ 当前状态
│   └── ChangeLog.vue        # ④ 修改日志
├── views/
│   └── PlaygroundView.vue   # 唯一页面，四块布局
└── generated/               # ← Claude Code 只在这里改
    ├── GameContent.vue      # 游戏画布（"长大"发生的地方）
    └── changeLog.ts         # 修改日志账本（每次追加一条）
```

## 视觉风格：卡通糖果风

- 背景：糖果渐变（粉→蜜桃→淡黄）+ 漂浮圆斑。
- 卡片：白色半透明、大圆角（`--radius-card: 28px`）、柔和投影、糖果色描边。
- 标题字体：ZCOOL KuaiLe（在 `index.html` 里以 Google Fonts 引入，非 npm 依赖）。
- 颜色/圆角/字体变量统一在 `src/styles/variables.css`，需要配色就复用这些变量。

## 代码规范

- 用 Composition API + `<script setup lang="ts">`。
- 变量命名清晰，组件职责单一。
- 所有代码必须真正可运行（改完跑一遍 `pnpm run dev`）。

## 验证命令

```bash
pnpm install        # 安装依赖（一般只在首次或改了 package.json 时需要）
pnpm run dev        # 启动开发服务器，浏览器自动打开，改完代码会热更新刷新
pnpm run build      # 类型检查（vue-tsc）+ 构建，确保类型正确、能构建
```

## 交互方式说明

页面是**纯展示**：标题 + 游戏区 + 状态 + 日志。页面**没有输入框、没有后端**。
孩子的需求通过**外部的 Claude Code 终端**进入（可配合系统语音转文字插件）；Claude Code 改完代码，Vite 热更新会自动刷新浏览器，页面就是软件成长的"实时镜像"。
