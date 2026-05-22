"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

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

  // Event bridge from the 3D scene: which mesh (if any) is currently hovered.
  // The canvas dispatches `locators:hover` with { id: string | null }.
  useEffect(() => {
    function onHover(e: Event) {
      const ev = e as CustomEvent<{ id: string | null }>
      setHoverId(ev.detail?.id ?? null)
    }
    window.addEventListener("locators:hover", onHover as EventListener)
    return () => window.removeEventListener("locators:hover", onHover as EventListener)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none z-20", fixed ? "fixed inset-0" : "absolute inset-0", className)}
    >
      {/*
        Title buttons used to render here. They've been removed so they no longer
        intercept pointer events over the 3D meshes (which now own hover/click).
        The locator positions are still tracked in `resolved` so any future
        DOM-anchored UI (tooltips, magnetic hints) can latch onto them.
      */}
      {resolved.map((it) => {
        const isHover = hoverId === it.id
        if (!isHover) return null
        const { x, y } = it.position
        const left = `${x * 100}%`
        const top = `${y * 100}%`
        return (
          <div
            key={it.id}
            className={cn("absolute transition-opacity", it.visible ? "opacity-100" : "opacity-0")}
            style={{ left, top, transform: "translate(-50%, -50%)" }}
          >
            {/* Horizontal pill (circle thumb + text). Roomier than before —
                bigger thumb, larger type, wider container. Still translucent. */}
            <div className="pointer-events-none absolute left-1/2 top-[calc(100%+16px)] z-10 -translate-x-1/2 whitespace-normal">
              <div className="flex w-80 items-center gap-4 rounded-full border border-black/10 bg-white/35 px-4 py-3 shadow-md backdrop-blur-md">
                <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image
                    src={it.image ?? "/placeholder.svg?height=240&width=360&query=minimal%20project%20preview"}
                    alt={`${it.title} preview`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{it.title}</div>
                  <div className="line-clamp-2 text-xs leading-snug text-gray-700">{it.description}</div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
