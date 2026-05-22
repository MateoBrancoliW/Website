"use client"

/**
 * NotebookViewer — fetches a Jupyter .ipynb (from /public) and renders it.
 *
 * Cells:
 *   • markdown → <Markdown>
 *   • code     → an In[n] prompt + code block, then its outputs
 *   • raw      → preformatted text
 *
 * Outputs:
 *   • stream (stdout/stderr)              → preformatted text
 *   • execute_result / display_data       → image/png|jpeg, else text/html
 *                                           (rendered raw — your own notebooks),
 *                                           else text/plain
 *   • error                               → traceback (ANSI codes stripped)
 *
 * Notebooks live in `public/notebooks/` and are fetched at runtime, so they
 * ship fine with the static export. Point a project at one via its
 * `notebook` field in content/projects.ts.
 */

import { useEffect, useState } from "react"
import { Markdown } from "./markdown"

type NbOutput = {
  output_type: string
  name?: string
  text?: string | string[]
  data?: Record<string, unknown>
  ename?: string
  evalue?: string
  traceback?: string[]
}

type NbCell = {
  cell_type: "markdown" | "code" | "raw"
  source: string | string[]
  outputs?: NbOutput[]
  execution_count?: number | null
}

type Notebook = { cells?: NbCell[] }

function joinSource(src: string | string[] | undefined): string {
  if (!src) return ""
  return Array.isArray(src) ? src.join("") : src
}

export function NotebookViewer({ path }: { path: string }) {
  const [nb, setNb] = useState<Notebook | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setNb(null)
    setError(null)
    fetch(path)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((json) => !cancelled && setNb(json))
      .catch((e) => !cancelled && setError(String(e)))
    return () => {
      cancelled = true
    }
  }, [path])

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load notebook (<code>{path}</code>): {error}. Make sure
        the file is in <code>public{path}</code>.
      </p>
    )
  }
  if (!nb) {
    return <p className="text-sm text-muted-foreground">Loading notebook…</p>
  }

  const cells = nb.cells ?? []
  return (
    <div className="space-y-5">
      {cells.map((cell, i) => (
        <NotebookCell key={i} cell={cell} />
      ))}
    </div>
  )
}

function NotebookCell({ cell }: { cell: NbCell }) {
  if (cell.cell_type === "markdown") {
    return <Markdown content={joinSource(cell.source)} />
  }

  if (cell.cell_type === "code") {
    const code = joinSource(cell.source)
    return (
      <div className="space-y-2">
        {code.trim() ? (
          <div className="flex gap-2">
            <span className="select-none pt-3 font-mono text-[10px] text-blue-500">
              In[{cell.execution_count ?? " "}]:
            </span>
            <pre className="flex-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
        ) : null}
        {cell.outputs?.map((out, j) => <NotebookOutput key={j} output={out} />)}
      </div>
    )
  }

  // raw cell
  return (
    <pre className="overflow-x-auto rounded bg-black/5 p-3 text-xs">
      {joinSource(cell.source)}
    </pre>
  )
}

function NotebookOutput({ output }: { output: NbOutput }) {
  if (output.output_type === "stream") {
    return (
      <pre className="overflow-x-auto rounded bg-black/[0.04] p-3 text-xs text-gray-700">
        {joinSource(output.text)}
      </pre>
    )
  }

  if (output.output_type === "error") {
    // Jupyter tracebacks embed ANSI color escapes — strip them.
    const tb = (output.traceback ?? [])
      .join("\n")
      // eslint-disable-next-line no-control-regex
      .replace(/\[[0-9;]*m/g, "")
    return (
      <pre className="overflow-x-auto rounded bg-red-50 p-3 text-xs text-red-700">
        {tb || `${output.ename}: ${output.evalue}`}
      </pre>
    )
  }

  if (output.output_type === "execute_result" || output.output_type === "display_data") {
    const data = output.data ?? {}

    const png = data["image/png"]
    if (typeof png === "string") {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={`data:image/png;base64,${png}`} alt="cell output" className="max-w-full rounded" />
    }

    const jpg = data["image/jpeg"]
    if (typeof jpg === "string") {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={`data:image/jpeg;base64,${jpg}`} alt="cell output" className="max-w-full rounded" />
    }

    const html = data["text/html"]
    if (html) {
      // Raw HTML from the user's own notebook (e.g. pandas tables). Scrollable
      // wrapper + light table styling.
      return (
        <div
          className="overflow-x-auto text-xs [&_table]:border-collapse [&_td]:border [&_td]:border-black/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black/10 [&_th]:px-2 [&_th]:py-1"
          dangerouslySetInnerHTML={{ __html: joinSource(html as string | string[]) }}
        />
      )
    }

    const plain = data["text/plain"]
    if (plain) {
      return (
        <pre className="overflow-x-auto rounded bg-black/[0.04] p-3 text-xs text-gray-700">
          {joinSource(plain as string | string[])}
        </pre>
      )
    }
  }

  return null
}
