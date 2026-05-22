"use client"

/**
 * Page chrome — corner UI pinned to the viewport.
 *   • Top-right:    word-tab nav (About Me / Projects / Publications / Contact)
 *   • Bottom-left:  "© <year>" copyright
 *   • Bottom-right: "MBW" initials
 *
 * Style notes:
 *   • Everything is bold + `mix-blend-mode: difference` + `color: white`
 *     (same trick as <HeroNameTag />) so text inverts dots/meshes behind it
 *     and stays readable on white. PageChrome MUST therefore be mounted
 *     inside the same isolation parent as <BackgroundCanvas /> (app/page.tsx).
 *   • Each item fades in on mount via the `chrome-fade` keyframe.
 *   • Nav magnify: all tabs share one font size; hovering one scales it up
 *     while the siblings shrink slightly. The fade-in lives on the <button>
 *     (translateY) and the hover scale lives on an INNER <span>, so the two
 *     transforms never fight.
 *   • Single-line classNames are intentional — styled-jsx below doesn't
 *     escape newlines spliced into className attributes.
 */

import { useState } from "react"
import { useOverlayNav } from "./use-overlay-nav"

export function PageChrome() {
  const { openAbout, openContact, openPublications, openProjects } = useOverlayNav()
  const [hovered, setHovered] = useState<number | null>(null)

  // Top-to-bottom order: About Me → Publications → Projects → Contact.
  const tabs = [
    { label: "About Me", onClick: openAbout },
    { label: "Publications", onClick: openPublications },
    { label: "Projects", onClick: openProjects },
    { label: "Contact", onClick: openContact },
  ]

  return (
    <div
      aria-hidden="false"
      className="pointer-events-none absolute inset-0"
      style={{ mixBlendMode: "difference", color: "white" }}
    >
      {/* Top-right nav — right-aligned column of equal-size word-tabs. */}
      <nav className="absolute right-6 top-5 flex flex-col items-end gap-1 md:right-10 md:top-6">
        {tabs.map((tab, i) => {
          // Magnify the hovered tab, shrink the rest. Neutral (1) when none
          // is hovered.
          const scale = hovered === null ? 1 : hovered === i ? 1.18 : 0.88
          return (
            <button
              key={tab.label}
              type="button"
              onClick={tab.onClick}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              className="pointer-events-auto chrome-fade text-base lg:text-lg font-bold uppercase tracking-[0.18em] focus:outline-none"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <span
                className="inline-block transition-transform duration-200 ease-out"
                style={{ transform: `scale(${scale})`, transformOrigin: "right center" }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom-left — copyright. */}
      <div
        className="chrome-fade absolute bottom-2 left-3 md:bottom-3 md:left-4 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ animationDelay: "360ms" }}
      >
        © {new Date().getFullYear()}
      </div>

      {/* Bottom-right — initials. */}
      <div
        className="chrome-fade absolute bottom-2 right-3 md:bottom-3 md:right-4 text-xs font-bold uppercase tracking-[0.18em]"
        style={{ animationDelay: "420ms" }}
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
