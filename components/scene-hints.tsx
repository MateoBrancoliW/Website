"use client"

/**
 * First-discovery affordances for the landing scene:
 *   • <ScrollHint>  — bouncing chevron at the bottom, fades on first scroll.
 *   • <MeshHint>    — pulse + label pinned to one featured mesh, fades on first hover.
 *
 * Both hints listen to events that already exist:
 *   - `locators:update` carries live screen-space positions for every mesh.
 *   - `locators:hover`  fires with { id: string | null } whenever a mesh is hovered.
 *
 * Once dismissed (scrolled / hovered) they stay gone for the rest of the session;
 * we don't want them re-popping in mid-interaction.
 */

import { useEffect, useRef, useState } from "react"

type LocatorUpdate = CustomEvent<{
  id: string
  percent?: { x: number; y: number }
  ndc?: { x: number; y: number; z?: number }
}>
type HoverEvent = CustomEvent<{ id: string | null }>

// Convert NDC → viewport-percent the same way project-locators does
function ndcToPercent(ndc?: { x: number; y: number; z?: number }) {
  if (!ndc) return null
  const insideClip = ndc.z === undefined ? true : ndc.z >= -1 && ndc.z <= 1
  const x = (ndc.x + 1) / 2
  const y = (1 - ndc.y) / 2
  const insideViewport = x >= 0 && x <= 1 && y >= 0 && y <= 1
  return insideClip && insideViewport ? { x, y } : null
}

// Same as ndcToPercent but does NOT clamp to the viewport — returns the
// percent even when the point is outside [0,1]. Used by the mesh hint so it
// can follow the mesh OFF-screen instead of getting stuck at the last
// visible position. We still return null when the point is behind the
// camera (z outside the clip range), since projection wraps around in that
// case and the result is meaningless.
function ndcToRawPercent(ndc?: { x: number; y: number; z?: number }) {
  if (!ndc) return null
  if (ndc.z !== undefined && (ndc.z < -1 || ndc.z > 1)) return null
  return { x: (ndc.x + 1) / 2, y: (1 - ndc.y) / 2 }
}

// ──────────────────────────────────────────────────────────────────────────────
// Scroll hint — bouncing arrow at viewport bottom-LEFT
//
// The page itself no longer scrolls (the SidePanel on the right is fixed and
// scrolls internally). This hint listens to a `panel:scroll` custom event
// dispatched by SidePanel, and fades as the panel is scrolled. It lives on
// the LEFT side of the viewport — same side as the 3D scene — to nudge the
// user toward the content rail on the opposite edge.
//
// If the panel has no overflow (everything fits on one screen) the hint
// stays hidden, since there's nothing to scroll to.
// ──────────────────────────────────────────────────────────────────────────────
function ScrollHint() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    function onPanelScroll(e: Event) {
      const ev = e as CustomEvent<{
        scrollTop: number
        scrollHeight: number
        clientHeight: number
      }>
      const d = ev.detail
      if (!d) return
      const overflow = d.scrollHeight - d.clientHeight
      if (overflow <= 4) {
        // Nothing to scroll — hide the hint, it would be misleading.
        setOpacity(0)
        return
      }
      const fadeOver = Math.min(160, overflow * 0.6)
      setOpacity(Math.max(0, 1 - d.scrollTop / fadeOver))
    }
    window.addEventListener("panel:scroll", onPanelScroll as EventListener)
    return () =>
      window.removeEventListener("panel:scroll", onPanelScroll as EventListener)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-6 left-6 z-30 md:bottom-8 md:left-8"
      style={{
        opacity,
        // Slight downward sink as it fades for a touch of motion
        transform: `translateY(${(1 - opacity) * 8}px)`,
        transition: "opacity 200ms linear, transform 200ms linear",
      }}
    >
      <div className="flex flex-col items-start gap-1 text-gray-500">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
          Scroll
        </span>
        <BouncingChevron />
      </div>
    </div>
  )
}

// One chevron that bobs up-down forever. Single element so there's no
// "both fading" gap that could read as the hint vanishing mid-cycle.
function BouncingChevron() {
  return (
    <div
      className="h-3 w-5"
      style={{ animation: "scrollBounce 1.4s ease-in-out infinite" }}
    >
      <svg viewBox="0 0 20 12" className="h-full w-full">
        <path
          d="M2 2 L10 9 L18 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style jsx>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(-2px); }
          50%      { transform: translateY(4px); }
        }
      `}</style>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Mesh hint — pulse pinned to ONE specific mesh (the about-me mesh).
//
// Behaviour:
//   • Hint position tracks the about-me mesh as it rotates with the sphere
//     (driven by `locators:update` events filtered to its id).
//   • Hint persists indefinitely UNTIL the user clicks the about-me mesh
//     (BackgroundCanvas dispatches `about:hint-dismissed` on that click).
//     Hovering other meshes, or hovering this mesh without clicking, does
//     NOT dismiss it — the affordance is specifically "go click that one".
//
// `pinTo` defaults to the canonical about-me slug; pass a different one
// only for testing / preview.
// ──────────────────────────────────────────────────────────────────────────────
const DEFAULT_PIN_SLUG = "about-me"

function MeshHint({ pinTo = DEFAULT_PIN_SLUG }: { pinTo?: string }) {
  // `pos` may be outside [0, 1] — the hint slides off-screen with the mesh.
  // It's only `null` when the mesh is behind the camera (no valid projection).
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function onUpdate(e: Event) {
      const ev = e as LocatorUpdate
      if (ev.detail?.id !== pinTo) return
      // Use the raw (un-clamped) percent so the hint can travel off-screen
      // with the mesh; null only when the mesh is behind the camera.
      const p = ndcToRawPercent(ev.detail.ndc) ?? ev.detail.percent ?? null
      setPos(p)
    }
    function onAboutDismiss() {
      setDismissed(true)
    }
    window.addEventListener("locators:update", onUpdate as EventListener)
    window.addEventListener("about:hint-dismissed", onAboutDismiss as EventListener)
    return () => {
      window.removeEventListener("locators:update", onUpdate as EventListener)
      window.removeEventListener("about:hint-dismissed", onAboutDismiss as EventListener)
    }
  }, [pinTo])

  if (!pos) return null

  return (
    <div
      aria-hidden="true"
      // overflow-hidden clips the inner div when the hint slides past the
      // viewport edge — keeps it from causing horizontal scroll.
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      style={{
        opacity: dismissed ? 0 : 1,
        transition: "opacity 520ms ease",
      }}
    >
      <div
        className="absolute"
        style={{
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Pulsing ring — sits AROUND the mesh, doesn't cover it */}
        <span className="relative grid h-16 w-16 place-items-center">
          <span
            className="absolute inset-0 rounded-full border border-gray-400/70"
            style={{ animation: "hintPulse 1.8s ease-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-full border border-gray-400/40"
            style={{ animation: "hintPulse 1.8s ease-out infinite", animationDelay: "600ms" }}
          />
        </span>
        {/* Label tucked just below — the affordance is click (not hover);
            hovering shows the project preview, clicking is what dismisses
            the hint and opens the About dialog. */}
        <div className="absolute left-1/2 top-[calc(100%+4px)] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600 shadow-sm backdrop-blur">
          Click me
        </div>
      </div>
      <style jsx>{`
        @keyframes hintPulse {
          0%   { transform: scale(0.6); opacity: 0.9; }
          80%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Combined export
//
// • ScrollHint is not rendered — bottom-of-page chrome was removed per
//   design.
// • MeshHint pins to the about-me mesh by default. Hero's call site passes
//   `pinHintTo` for backwards-compat; if it's omitted or empty, MeshHint
//   uses its own DEFAULT_PIN_SLUG fallback.
// ──────────────────────────────────────────────────────────────────────────────
export function SceneHints({ pinHintTo }: { pinHintTo?: string } = {}) {
  return <MeshHint pinTo={pinHintTo || undefined} />
}

// Suppress "unused" warning while we keep ScrollHint around for later.
void ScrollHint
