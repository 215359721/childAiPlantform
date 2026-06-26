import type { Plugin } from 'vite'
import { spawn } from 'node:child_process'

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
