"use client"

import { useOverlayNav } from "@/components/use-overlay-nav"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { openContact } = useOverlayNav()

  return (
    <header className="pointer-events-none sticky top-0 z-50 w-full bg-transparent">
      <div className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        {/* Button aligned to container right padding and landing heading top */}
        <div className="pointer-events-auto absolute right-4 md:right-6 lg:right-8 top-4 md:top-6">
          <Button
            size="sm"
            variant="outline"
            onClick={openContact}
            className="bg-white/70 backdrop-blur border-black/10 hover:bg-white"
          >
            Contact
          </Button>
        </div>
      </div>
    </header>
  )
}
