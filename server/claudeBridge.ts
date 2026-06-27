import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Claude 桥接插件（仅 dev 服务生效）。
 *
 * 暴露 POST /api/wish：接收孩子的自然语言需求，spawn `claude -p`，
 * 把孩子的文字作为 -p 参数传入（Windows 命令行是 Unicode 宽字符，
 * 中文不会乱码，比 stdin 更可靠），再把 claude 的 stream-json 事件
 * 实时翻译成对儿童友好的 SSE 事件推给浏览器。
 *
 * claude 改完 src/generated/ 下的两个文件后，Vite 会自动热更新页面。
 */

// 固定的契约提示（作为 --append-system-prompt 参数；命令行宽字符，中文安全）
const SYSTEM_PROMPT = [
  '你在 AI Coding Playground 里为小朋友做一个小游戏。',
  '严格遵循项目根目录的 CLAUDE.md：',
  '只编辑 src/generated/GameContent.vue 与 src/generated/changeLog.ts；',
  '已有功能只增不改不删；在 changeLog.ts 数组末尾追加一条 feature 记录（含 emoji/summary/childSaid/time/type），其中 childSaid 必须一字不差照抄孩子原话（不得改写）；',
  '不要运行任何命令、不要改动其它文件；完成后用一句话告诉孩子做了什么。',
  '视觉保持卡通糖果风，颜色复用 src/styles/variables.css 里的糖果色变量。',
  '新加的场景/外层容器必须 width:100%/height:100% 撑满整个游戏画布，且内容不得溢出画布（超出用 overflow:hidden 裁剪或调整定位保证不出界），无论做什么功能都遵守。',
].join('')

// 只允许的文件编辑工具（安全收口）
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])

interface WishRequest {
  text?: unknown
}

export function claudeBridgePlugin(): Plugin {
  // 同一时间只处理一个愿望
  let busy = false

  return {
    name: 'claude-bridge',
    configureServer(server) {
      server.middlewares.use('/api/wish', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 POST' }))
          return
        }
        if (busy) {
          res.writeHead(409, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'AI 正忙，请稍等一下～' }))
          return
        }

        const body = await readBody(req)
        const text = parseText(body)
        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '要说点什么哦～' }))
          return
        }

        busy = true
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        // 收尾：保证只结束一次，并释放 busy
        let completed = false
        const complete = (payload: Record<string, unknown>): void => {
          if (completed) return
          completed = true
          busy = false
          send(res, payload)
          send(res, { kind: '_end' })
          res.end()
        }

        const today = new Date().toISOString().slice(0, 10)
        const wish = sanitizeForArg(
          `${text}（今天 ${today}，请把这个日期写进 changeLog 的 time 字段）`,
        )

        send(res, { kind: 'start' })

        // 孩子的话作为 -p 参数（Unicode 安全）；命令行其余都是固定参数
        const child = spawn(
          'claude',
          [
            '-p',
            wish,
            '--output-format',
            'stream-json',
            '--verbose',
            '--permission-mode',
            'acceptEdits',
            '--append-system-prompt',
            SYSTEM_PROMPT,
          ],
          { cwd: process.cwd(), shell: true },
        )

        let buffer = ''
        child.stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          let nl = buffer.indexOf('\n')
          while (nl >= 0) {
            const line = buffer.slice(0, nl).trim()
            buffer = buffer.slice(nl + 1)
            nl = buffer.indexOf('\n')
            if (line) handleLine(line, res)
          }
        })

        let stderrText = ''
        child.stderr.on('data', (chunk: Buffer) => {
          stderrText += chunk.toString()
        })

        child.on('error', (err) => {
          complete({
            kind: 'error',
            message: `无法启动 claude，请确认已安装并登录 Claude Code：${err.message}`,
          })
        })

        child.on('close', (code) => {
          if (code !== 0) {
            const message = stderrText.trim().slice(0, 300) || `claude 退出码 ${code}`
            complete({ kind: 'error', message })
          } else {
            complete({ kind: 'done' })
          }
        })

        // -p 已提供完整提示，stdin 不再传内容，立即 EOF
        child.stdin.on('error', () => {})
        child.stdin.end()

        // 客户端提前断开时，停掉子进程
        req.on('close', () => {
          if (!child.killed) child.kill()
        })
      })

      // POST /api/reset：一键重置 generated/ 为干净骨架（复用 scripts/reset-generated.mjs）
      server.middlewares.use('/api/reset', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 POST' }))
          return
        }
        const child = spawn('node', ['scripts/reset-generated.mjs'], { cwd: process.cwd() })
        let stderrText = ''
        child.stderr.on('data', (c: Buffer) => {
          stderrText += c.toString()
        })
        child.on('close', (code) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              ok: code === 0,
              error: code === 0 ? '' : stderrText.trim().slice(0, 300) || `退出码 ${code}`,
            }),
          )
        })
        child.on('error', (err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        })
      })

      // ===== 本地作品库接口（works/）=====
      // 一个作品 = src/generated/{GameContent.vue, changeLog.ts} 两个文件的快照。
      // 注意：Connect 中间件按路径前缀匹配，所以列表用 /api/works/list，
      // 避免被 /api/works 这个前缀吞掉 save/load/delete 等子路径。
      // GET /api/works/list：列出所有已保存作品（按保存时间倒序）
      server.middlewares.use('/api/works/list', (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 GET' }))
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(listWorks()))
      })

      // POST /api/works/save：把当前 generated 两文件快照另存为新作品
      server.middlewares.use('/api/works/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 POST' }))
          return
        }
        try {
          const data = JSON.parse((await readBody(req)) || '{}') as SaveWorkInput
          const name = typeof data.name === 'string' ? data.name.trim().slice(0, 60) : ''
          if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '要给作品起个名字哦～' }))
            return
          }
          const id = `${slugify(name)}-${Date.now().toString(36)}`
          const dir = join(worksRoot, id)
          mkdirSync(dir, { recursive: true })
          copyFileSync(join(generatedDir, 'GameContent.vue'), join(dir, 'GameContent.vue'))
          copyFileSync(join(generatedDir, 'changeLog.ts'), join(dir, 'changeLog.ts'))
          const now = new Date().toISOString()
          const meta: WorkMeta = {
            id,
            name,
            emoji:
              typeof data.emoji === 'string' && data.emoji ? data.emoji.slice(0, 8) : '🎨',
            summary: typeof data.summary === 'string' ? data.summary.slice(0, 200) : '',
            modificationCount: Number.isFinite(data.modificationCount)
              ? Number(data.modificationCount)
              : 0,
            lastModifiedAt: typeof data.lastModifiedAt === 'string' ? data.lastModifiedAt : '',
            childSaid:
              typeof data.childSaid === 'string' && data.childSaid
                ? data.childSaid.slice(0, 200)
                : undefined,
            createdAt: now,
            savedAt: now,
          }
          writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, work: meta }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: errMsg(e) }))
        }
      })

      // POST /api/works/load：把某作品写回 generated（切换/恢复作品）
      server.middlewares.use('/api/works/load', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 POST' }))
          return
        }
        try {
          const { id } = JSON.parse((await readBody(req)) || '{}') as { id?: unknown }
          const sid = String(id ?? '')
          if (!assertSafeId(sid)) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '作品 id 不合法' }))
            return
          }
          const dir = join(worksRoot, sid)
          if (!existsSync(join(dir, 'meta.json'))) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '找不到这个作品' }))
            return
          }
          copyFileSync(join(dir, 'GameContent.vue'), join(generatedDir, 'GameContent.vue'))
          copyFileSync(join(dir, 'changeLog.ts'), join(generatedDir, 'changeLog.ts'))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: errMsg(e) }))
        }
      })

      // POST /api/works/delete：删除某作品
      server.middlewares.use('/api/works/delete', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '只支持 POST' }))
          return
        }
        try {
          const { id } = JSON.parse((await readBody(req)) || '{}') as { id?: unknown }
          const sid = String(id ?? '')
          if (!assertSafeId(sid)) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '作品 id 不合法' }))
            return
          }
          rmSync(join(worksRoot, sid), { recursive: true, force: true })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: errMsg(e) }))
        }
      })
    },
  }
}

/** 清理可能在 cmd 命令行里被解释的字符，防止注入；孩子的自然语言一般不含这些 */
function sanitizeForArg(s: string): string {
  return s.replace(/[&|<>%^"`\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800)
}

/** 解析请求体里的 text 字段 */
function parseText(body: string): string {
  try {
    const parsed = JSON.parse(body || '{}') as WishRequest
    return typeof parsed.text === 'string' ? parsed.text.trim().slice(0, 500) : ''
  } catch {
    return ''
  }
}

/** 读完整请求体 */
function readBody(req: { on: (e: string, cb: (c?: Buffer) => void) => void }): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c?: Buffer) => {
      if (c) data += c.toString()
    })
    req.on('end', () => resolve(data))
  })
}

/** 写一条 SSE 事件 */
function send(res: { write: (s: string) => void }, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/** 把 claude 的一行 stream-json 翻译成儿童友好的事件 */
function handleLine(line: string, res: { write: (s: string) => void }): void {
  let evt: {
    type?: string
    is_error?: boolean
    result?: unknown
    message?: {
      content?: Array<{
        type: string
        text?: string
        name?: string
        input?: { file_path?: string; path?: string }
      }>
    }
  }
  try {
    evt = JSON.parse(line)
  } catch {
    return
  }

  if (evt.type === 'assistant' && evt.message?.content) {
    for (const block of evt.message.content) {
      if (block.type === 'text' && block.text) {
        send(res, { kind: 'thinking', text: block.text })
      } else if (block.type === 'tool_use' && block.name && EDIT_TOOLS.has(block.name)) {
        const filePath = String(block.input?.file_path || block.input?.path || '')
        const file = filePath.split(/[\\/]/).pop() || ''
        send(res, { kind: 'editing', file })
      }
    }
  } else if (evt.type === 'result') {
    send(res, {
      kind: 'result',
      ok: evt.is_error === false,
      text: typeof evt.result === 'string' ? evt.result : '',
    })
  }
}

// ===== 本地作品库（works/）：路径常量、类型与辅助函数 =====

const worksRoot = join(process.cwd(), 'works')
const generatedDir = join(process.cwd(), 'src/generated')

interface WorkMeta {
  id: string
  name: string
  emoji: string
  summary: string
  modificationCount: number
  lastModifiedAt: string
  childSaid?: string
  createdAt: string
  savedAt: string
}

interface SaveWorkInput {
  name?: unknown
  emoji?: unknown
  summary?: unknown
  modificationCount?: unknown
  lastModifiedAt?: unknown
  childSaid?: unknown
}

/** 校验作品 id：仅小写字母/数字/连字符（正则挡死所有穿越字符），并确认路径仍在 works/ 下 */
function assertSafeId(id: string): boolean {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return false
  const root = resolve(worksRoot)
  return resolve(worksRoot, id).startsWith(root)
}

/** 把作品名转成安全的目录名片段（中文/标点/空格 → -，全空兜底 work） */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'work'
  )
}

/** 扫描 works/ 下所有合法作品，按保存时间倒序返回 */
function listWorks(): WorkMeta[] {
  if (!existsSync(worksRoot)) return []
  let names: string[]
  try {
    names = readdirSync(worksRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch {
    return []
  }
  const list: WorkMeta[] = []
  for (const name of names) {
    if (!assertSafeId(name)) continue
    const metaPath = join(worksRoot, name, 'meta.json')
    if (!existsSync(metaPath)) continue
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as WorkMeta
      if (meta && typeof meta.id === 'string') list.push(meta)
    } catch {
      /* 单个 meta 损坏时跳过，不影响整张列表 */
    }
  }
  return list.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
