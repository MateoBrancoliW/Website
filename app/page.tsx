"use client"

import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { OverlayHost } from "@/components/overlay-host"
import { Updates } from "@/components/updates"
import { OverlayNavProvider } from "@/components/use-overlay-nav"
import { BackgroundCanvas } from "@/components/background-canvas"

export default function Page() {
  return (
    <OverlayNavProvider>
      {/* Immersive full-viewport background render */}
      <BackgroundCanvas />

      <div className="relative z-10 flex min-h-[100dvh] flex-col text-gray-900">
        <SiteHeader />

        <main className="flex-1">
          <Hero />
          <Updates />
        </main>

        <footer className="border-t/0 bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row">
            <div>© {new Date().getFullYear()} Your Name</div>
            <nav className="sm:ml-auto flex gap-4">
              <a href="#home" className="hover:underline underline-offset-4">
                Back to top
              </a>
            </nav>
          </div>
        </footer>

        <OverlayHost />
      </div>
    </OverlayNavProvider>
  )
}
