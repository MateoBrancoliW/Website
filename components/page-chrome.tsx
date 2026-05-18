"use client"

/**
 * Page chrome — the four small pieces of UI pinned to the viewport corners.
 *   • Top-right:    "Contact" (bold text, opens ContactDialog)
 *   • Bottom-left:  "© 2027" copyright
 *   • Bottom-right: "MBW" initials
 *
 * Style notes:
 *   • Every text is bold and rendered with `mix-blend-mode: difference` +
 *     `color: white` — same trick as <HeroNameTag /> — so the text inverts
 *     dots/meshes passing behind it, and stays readable on white backgrounds.
 *     This means PageChrome MUST be mounted inside the same isolation parent
 *     as the BackgroundCanvas (see app/page.tsx).
 *   • Each item fades in on mount with the same `hero-fade` keyframe used by
 *     the name header, so the page lands as a coordinated whole.
 *   • Only Contact has `pointer-events-auto` — the corner texts are static.
 */

import { useOverlayNav } from "./use-overlay-nav"

export function PageChrome() {
  const { openContact } = useOverlayNav()

  return (
    <div
      aria-hidden="false"
      className="pointer-events-none absolute inset-0"
      style={{
        mixBlendMode: "difference",
        color: "white",
      }}
    >
      {/* Top-right — Contact (the only interactive piece).
          Note: single-line classNames are intentional in this file because
          <style jsx> below doesn't escape newlines in className attributes. */}
      <button
        type="button"
        onClick={openContact}
        className="pointer-events-auto chrome-fade absolute right-6 top-5 md:right-10 md:top-6 text-sm font-bold uppercase tracking-[0.18em] transition-transform duration-200 ease-out hover:scale-[1.06] focus:outline-none"
        style={{ animationDelay: "120ms" }}
      >
        Contact
      </button>

      {/* Bottom-left — copyright */}
      <div
        className="chrome-fade absolute bottom-5 left-6 md:bottom-6 md:left-10 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ animationDelay: "260ms" }}
      >
        © {new Date().getFullYear()}
      </div>

      {/* Bottom-right — initials */}
      <div
        className="chrome-fade absolute bottom-5 right-6 md:bottom-6 md:right-10 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ animationDelay: "320ms" }}
      >
        MBW
      </div>

      <style jsx>{`
        .chrome-fade {
          animation: chrome-fade 900ms ease-out both;
        }
        @keyframes chrome-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
