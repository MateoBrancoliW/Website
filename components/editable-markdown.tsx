"use client"

/**
 * EditableMarkdown — renders markdown, and IN DEV adds an inline editor.
 *
 * Dev mode (NODE_ENV === "development"):
 *   • A small toolbar (Edit / Preview · Copy MD · Reset) sits at the top.
 *   • "Edit" swaps the rendered markdown for a textarea; typing updates the
 *     content live. Toggle back to "Preview" to see it rendered.
 *   • Edits persist to localStorage (keyed by `storageKey`) so they survive
 *     reloads while you iterate. "Copy MD" copies the current text so you can
 *     paste it back into the content file. "Reset" drops the override and
 *     returns to the code `source`.
 *
 * Production: localStorage and the editor are ignored entirely — it renders
 * `source` (the committed content) as plain markdown. So the website ships
 * exactly what's in code; the editor is a dev scratchpad for drafting copy.
 *
 * Workflow: draft in the live editor → Copy MD → paste into
 * `content/site-content.ts` (or a project's `body`) → commit.
 */

import { useEffect, useRef, useState } from "react"
import { Markdown } from "./markdown"

const STORAGE_PREFIX = "md-draft:"
const IS_DEV = process.env.NODE_ENV === "development"

export function EditableMarkdown({
  storageKey,
  source,
  className,
}: {
  storageKey: string
  source: string
  className?: string
}) {
  // Production (and SSR): no editor, no localStorage — just the source.
  if (!IS_DEV) {
    return <Markdown content={source} className={className} />
  }
  return <DevEditable storageKey={storageKey} source={source} className={className} />
}

function DevEditable({
  storageKey,
  source,
  className,
}: {
  storageKey: string
  source: string
  className?: string
}) {
  const key = STORAGE_PREFIX + storageKey
  const [content, setContent] = useState(source)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const loadedRef = useRef(false)

  // Load any saved draft for this key on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key)
      if (saved != null) setContent(saved)
    } catch {
      // ignore
    }
    loadedRef.current = true
  }, [key])

  // Persist edits (after the initial load so we don't clobber a saved draft).
  useEffect(() => {
    if (!loadedRef.current) return
    try {
      window.localStorage.setItem(key, content)
    } catch {
      // ignore
    }
  }, [key, content])

  function copy() {
    navigator.clipboard?.writeText(content).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    })
  }

  function reset() {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
    setContent(source)
  }

  return (
    <div className="relative">
      {/* Dev toolbar */}
      <div className="mb-4 flex items-center gap-2 rounded-md border border-dashed border-black/15 bg-amber-50/70 px-2 py-1 text-[11px]">
        <span className="font-mono text-amber-700">dev · {storageKey}</span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="rounded border border-black/15 bg-white px-2 py-0.5 hover:bg-gray-50"
        >
          {editing ? "Preview" : "✎ Edit"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-black/15 bg-white px-2 py-0.5 hover:bg-gray-50"
        >
          {copied ? "Copied!" : "Copy MD"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-black/15 bg-white px-2 py-0.5 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="h-[60svh] w-full resize-y rounded-md border border-black/15 bg-white p-3 font-mono text-xs leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      ) : (
        <Markdown content={content} className={className} />
      )}
    </div>
  )
}
