"use client"

/**
 * Minimal, dependency-free Markdown → React renderer.
 *
 * Supports the subset needed for dialog content:
 *   • # / ## / ### … headings
 *   • paragraphs
 *   • - / * bullet lists, 1. numbered lists
 *   • > blockquotes
 *   • --- horizontal rules
 *   • ``` fenced code blocks
 *   • inline: **bold**, *italic*, `code`, [text](url)
 *
 * Why hand-rolled (no react-markdown): the project can't take a new npm
 * dependency from this environment, and the dialog content only needs the
 * common subset above. If you later add a real markdown lib, this component's
 * <Markdown content=… /> API can stay the same.
 */

import { Fragment, type ReactNode } from "react"

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "code"; text: string }

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = parseBlocks(content.trim())
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>
}

// ─── Block parsing ───────────────────────────────────────────────────────────
function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    line.trim().startsWith(">") ||
    line.trim().startsWith("```") ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())
  )
}

function parseBlocks(src: string): Block[] {
  const lines = src.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === "") {
      i++
      continue
    }

    // fenced code block
    if (line.trim().startsWith("```")) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i])
        i++
      }
      i++ // closing fence
      blocks.push({ type: "code", text: code.join("\n") })
      continue
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr" })
      i++
      continue
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2] })
      i++
      continue
    }

    // blockquote
    if (line.trim().startsWith(">")) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""))
        i++
      }
      blocks.push({ type: "quote", text: quote.join(" ") })
      continue
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      blocks.push({ type: "ul", items })
      continue
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""))
        i++
      }
      blocks.push({ type: "ol", items })
      continue
    }

    // paragraph — gather consecutive non-blank, non-block-start lines
    const para: string[] = []
    para.push(line)
    i++
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
      para.push(lines[i])
      i++
    }
    blocks.push({ type: "paragraph", text: para.join(" ") })
  }

  return blocks
}

// ─── Block rendering ──────────────────────────────────────────────────────────
function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const text = renderInline(block.text)
      if (block.level <= 1)
        return <h1 key={key} className="mt-6 mb-3 text-2xl font-semibold tracking-tight text-gray-900 first:mt-0">{text}</h1>
      if (block.level === 2)
        return <h2 key={key} className="mt-6 mb-2 text-xl font-semibold tracking-tight text-gray-900 first:mt-0">{text}</h2>
      return <h3 key={key} className="mt-4 mb-2 text-base font-medium text-gray-900 first:mt-0">{text}</h3>
    }
    case "paragraph":
      return <p key={key} className="my-3 text-sm leading-relaxed text-gray-700 first:mt-0">{renderInline(block.text)}</p>
    case "ul":
      return (
        <ul key={key} className="my-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {block.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ul>
      )
    case "ol":
      return (
        <ol key={key} className="my-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          {block.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ol>
      )
    case "quote":
      return <blockquote key={key} className="my-3 border-l-2 border-black/20 pl-4 text-sm italic text-gray-600">{renderInline(block.text)}</blockquote>
    case "hr":
      return <hr key={key} className="my-6 border-black/10" />
    case "code":
      return (
        <pre key={key} className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
          <code>{block.text}</code>
        </pre>
      )
  }
}

// ─── Inline rendering ─────────────────────────────────────────────────────────
// Single combined regex; capture groups identify which token matched.
const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0

  while (rest.length > 0) {
    const m = rest.match(INLINE)
    if (!m || m.index === undefined) {
      nodes.push(<Fragment key={key++}>{rest}</Fragment>)
      break
    }
    if (m.index > 0) nodes.push(<Fragment key={key++}>{rest.slice(0, m.index)}</Fragment>)

    if (m[2] !== undefined) {
      nodes.push(<strong key={key++} className="font-semibold text-gray-900">{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      nodes.push(<em key={key++}>{m[3]}</em>)
    } else if (m[4] !== undefined) {
      nodes.push(<code key={key++} className="rounded bg-black/5 px-1 py-0.5 text-[0.85em]">{m[4]}</code>)
    } else if (m[5] !== undefined && m[6] !== undefined) {
      nodes.push(
        <a key={key++} href={m[6]} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-gray-900">
          {m[5]}
        </a>,
      )
    }
    rest = rest.slice(m.index + m[0].length)
  }

  return nodes
}
