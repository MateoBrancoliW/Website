"use client"

import { Hero } from "@/components/hero"
import { OverlayHost } from "@/components/overlay-host"
import { OverlayNavProvider } from "@/components/use-overlay-nav"
import { BackgroundCanvas } from "@/components/background-canvas"
import { HeroNameTag } from "@/components/hero-name-tag"
import { PageChrome } from "@/components/page-chrome"

export default function Page() {
  return (
    <OverlayNavProvider>
      {/*
        Isolation layer that holds the 3D canvas and the blend-mode hero text.
        Both children must live in the SAME stacking context for
        `mix-blend-mode: difference` on the text to read against the canvas;
        `isolation: isolate` on this fixed wrapper guarantees that. The canvas
        wrapper inside is `absolute` (not `fixed`) so it doesn't form its own
        isolated context — keeping it in this one.
      */}
      <div className="fixed inset-0 z-0" style={{ isolation: "isolate" }}>
        <BackgroundCanvas />
        <HeroNameTag />
        {/* Mounted inside the isolation parent on purpose: PageChrome uses
            mix-blend-mode against the canvas pixels for the same negative-
            window effect as the hero name. */}
        <PageChrome />
      </div>

      {/* Page chrome wrapper. Pointer-events flow as before: the wrapper +
          main + Hero pass through so cursor events reach the 3D canvas;
          interactive descendants (SidePanel, dialogs) opt back in. */}
      <div className="pointer-events-none relative z-10 flex min-h-[100dvh] flex-col text-gray-900">
        <main className="pointer-events-none flex-1">
          <Hero />
        </main>

        {/* No persistent UI on the right anymore — profile lives in the
            About dialog opened from the hero name. */}

        <OverlayHost />
      </div>
    </OverlayNavProvider>
  )
}
