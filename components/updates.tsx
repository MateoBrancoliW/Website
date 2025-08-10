"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"

const updates = [
  {
    id: "u1",
    title: "July update",
    excerpt: "Prototyping physics-based transitions and optimizing shaders.",
    date: "2025-07-15",
  },
  {
    id: "u2",
    title: "June update",
    excerpt: "Explored signed distance fields for crisp UI edges.",
    date: "2025-06-10",
  },
  {
    id: "u3",
    title: "May update",
    excerpt: "Refined WebGL scene orchestration and asset streaming.",
    date: "2025-05-08",
  },
]

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function smootherstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 1, 3) / 2
}

export function Updates() {
  const sectionRef = useRef<HTMLElement>(null)

  // Scroll-distance driven progress (raw and smoothed)
  const anchorYRef = useRef<number | null>(null)
  const wasIntersectingRef = useRef(false)
  const [rawProgress, setRawProgress] = useState(0)
  const [entrance, setEntrance] = useState(0)

  // Auxiliary positional signals (kept for compatibility with other layers)
  const [topProgress, setTopProgress] = useState(0)
  const [fullProgress, setFullProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const height = Math.max(1, rect.height)

      // Intersection check for establishing the anchor point
      const isIntersecting = rect.bottom > 0 && rect.top < vh

      // Establish/reset anchor when crossing intersection boundary
      if (isIntersecting && !wasIntersectingRef.current) {
        anchorYRef.current = window.scrollY
      } else if (!isIntersecting && wasIntersectingRef.current) {
        anchorYRef.current = null
        setRawProgress(0) // reset when leaving viewport
      }
      wasIntersectingRef.current = isIntersecting

      // Drive rawProgress strictly by scroll distance from the anchor
      if (isIntersecting && anchorYRef.current != null) {
        const fadeDistancePx = Math.max(240, Math.round(vh * 0.85)) // slow, progressive span
        const distance = window.scrollY - anchorYRef.current
        const p = clamp01(distance / fadeDistancePx)
        setRawProgress(p)
      }

      // Still emit positional signals for other consumers (e.g., layout coordination)
      const rawTop = clamp01(1 - rect.top / vh)
      const rawFull = clamp01((vh - rect.top) / (vh + height))
      // Keep these directly mapped to avoid desync, but they are not driving opacity anymore
      setTopProgress(rawTop)
      setFullProgress(rawFull)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  // Smooth the scroll-driven progress without making it position-based
  useEffect(() => {
    let raf = 0
    function tick() {
      setEntrance((prev) => {
        const target = rawProgress
        const next = prev + (target - prev) * 0.08 // gentle damping for smoothness
        if (Math.abs(next - target) < 0.002) {
          return target
        } else {
          raf = requestAnimationFrame(tick)
          return next
        }
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rawProgress])

  // Broadcast scroll-driven "entrance" progress so the Hero can sync its fade-out
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("updates:progress", {
        detail: { top: topProgress, full: fullProgress, entrance },
      }),
    )
  }, [topProgress, fullProgress, entrance])

  const sectionOpacity = useMemo(() => {
    // Unified fade for title/header and masked subsections
    return easeInOutCubic(smootherstep(0.22, 1.02, entrance))
  }, [entrance])

  return (
    <section
      id="updates"
      aria-label="Updates"
      ref={sectionRef}
      className="relative z-30 pt-20 md:pt-28 pb-6"
      style={{ background: "transparent" }}
    >
      <div
        className="mx-auto max-w-6xl relative z-30 px-4 md:px-6 lg:px-8"
        style={{
          opacity: sectionOpacity,
          pointerEvents: sectionOpacity < 0.02 ? "none" : undefined,
          transition: "opacity 360ms linear",
          willChange: "opacity",
        }}
      >
        {/* Sliding content wrapper: progressive opacity entrance from 0 + smooth top mask */}
        <div>
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            {/* Boxed, scrollable Updates list */}
            <div className="rounded-2xl border border-black/10 bg-white/60">
              <div className="px-4 py-3 border-b border-black/10">
                <p className="text-sm font-medium">{"Recent updates"}</p>
              </div>
              <ScrollArea className="h-[45svh]">
                <div className="p-4 md:p-5 space-y-4">
                  {updates.map((u) => (
                    <Card key={u.id} className="group bg-white/80">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-baseline justify-between text-base">
                          <span>{u.title}</span>
                          <span className="text-xs font-normal text-muted-foreground">{u.date}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">{u.excerpt}</CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Profile column */}
            <HoverCard openDelay={60} closeDelay={120}>
              <HoverCardTrigger asChild>
                <div className="rounded-2xl border bg-white/70 p-6 transition hover:bg-white cursor-default md:sticky md:top-24">
                  <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-full ring-1 ring-black/5">
                    <Image src="/minimal-profile-portrait.png" alt="Profile portrait" fill className="object-cover" />
                  </div>
                  <div className="mt-4">
                    <div className="text-lg font-medium">{"Your Name"}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {"Building calm, high-performance experiences. Available for select collaborations."}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{"Hover for more"}</p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{"About"}</p>
                  <p className="text-muted-foreground">
                    {"I design motion systems and realtime UI. Focused on clarity, pacing, and performance."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium mb-1">{"Focus"}</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>{"Realtime WebGL"}</li>
                        <li>{"UI Motion"}</li>
                        <li>{"Prototyping"}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">{"Links"}</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>{"GitHub"}</li>
                        <li>{"Dribbble"}</li>
                        <li>{"Twitter"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
    </section>
  )
}
