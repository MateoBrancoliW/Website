"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useOverlayNav } from "./use-overlay-nav"

type Percent = { x: number; y: number }
type NDC = { x: number; y: number; z?: number }

export type Locator = {
  id: string
  title: string
  slug?: string
  href?: string
  percent?: Percent
  ndc?: NDC
  image?: string
  description?: string
  anchor?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

type UpdateEventDetail = { id: string; percent?: Percent; ndc?: NDC }
type UpdateEvent = CustomEvent<UpdateEventDetail>

type Props = {
  items: Locator[]
  className?: string
  fixed?: boolean // when true, overlay is fixed to viewport (for full-bleed background)
}

function toPercent(pos?: { percent?: Percent; ndc?: NDC }): { p?: Percent; visible: boolean } {
  if (!pos) return { p: undefined, visible: true }
  if (pos.percent) return { p: pos.percent, visible: true }
  if (pos.ndc) {
    const { x: nx, y: ny, z } = pos.ndc
    // Visibility heuristic: within clip range and inside viewport
    const insideClip = z === undefined ? true : z >= -1 && z <= 1
    const px = (nx + 1) / 2
    const py = (1 - ny) / 2
    const insideViewport = px >= 0 && px <= 1 && py >= 0 && py <= 1
    return { p: { x: px, y: py }, visible: insideClip && insideViewport }
  }
  return { p: undefined, visible: false }
}

export function ProjectLocatorsOverlay({ items, className, fixed = false }: Props) {
  const { openProject } = useOverlayNav()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number; visible: boolean }>>({})

  // Resolve positions (initial + overrides)
  const resolved = useMemo(() => {
    return items.map((it) => {
      const base = toPercent({ percent: it.percent, ndc: it.ndc })
      const o = overrides[it.id]
      const p = o?.x !== undefined ? { x: o.x, y: o.y } : (base.p ?? { x: 0.5, y: 0.5 })
      const visible = o?.visible ?? base.visible
      return { ...it, position: p, visible }
    })
  }, [items, overrides])

  // Event bridge to update locator positions live
  useEffect(() => {
    function onUpdate(e: Event) {
      const ev = e as UpdateEvent
      const id = ev.detail?.id
      if (!id) return
      const { p, visible } = toPercent({ percent: ev.detail.percent, ndc: ev.detail.ndc })
      if (!p) return
      setOverrides((prev) => ({ ...prev, [id]: { x: p.x, y: p.y, visible } }))
    }
    window.addEventListener("locators:update", onUpdate as EventListener)
    return () => window.removeEventListener("locators:update", onUpdate as EventListener)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none z-20", fixed ? "fixed inset-0" : "absolute inset-0", className)}
    >
      {resolved.map((it) => {
        const { x, y } = it.position
        const left = `${x * 100}%`
        const top = `${y * 100}%`
        const anchor = it.anchor ?? "center"
        let translate = "-50% -50%"
        if (anchor === "top-left") translate = "0% 0%"
        if (anchor === "top-right") translate = "-100% 0%"
        if (anchor === "bottom-left") translate = "0% -100%"
        if (anchor === "bottom-right") translate = "-100% -100%"

        const isHover = hoverId === it.id

        return (
          <div
            key={it.id}
            className={cn("absolute transition-opacity", it.visible ? "opacity-100" : "opacity-0")}
            style={{ left, top, transform: `translate(${translate})` }}
          >
            {/* Marker */}
            <button
              type="button"
              onClick={() => (it.slug ? openProject(it.slug!) : it.href ? (location.href = it.href) : null)}
              onMouseEnter={() => setHoverId(it.id)}
              onMouseLeave={() => setHoverId((id) => (id === it.id ? null : id))}
              className="pointer-events-auto grid place-items-center rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
              aria-label={it.title}
            >
              {it.title}
            </button>

            {/* Hover preview */}
            {isHover ? (
              <div className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-10 -translate-x-1/2 whitespace-normal">
                <div className="w-56 overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-lg backdrop-blur">
                  <div className="relative aspect-[3/2] w-full bg-gray-100">
                    <Image
                      src={it.image ?? "/placeholder.svg?height=240&width=360&query=minimal%20project%20preview"}
                      alt={`${it.title} preview`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-900">{it.title}</div>
                    <div className="mt-1 line-clamp-3 text-[11px] text-gray-600">{it.description}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
