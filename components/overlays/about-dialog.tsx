"use client"

/**
 * About Me dialog.
 *
 * Opens when the user clicks the hero name (or its hover preview). Contains:
 *   1. About header: title, photo, one-line description
 *   2. About body: paragraph + Focus / Links grid
 *   3. Activity blog: scrollable list of recent work / posts
 *
 * Future hook: replace the static `activities` array with a fetch from a
 * LinkedIn (or Read.cv / GitHub / Mastodon) feed. The shape below — id,
 * title, excerpt, date — already matches a typical feed item, so the swap
 * is a one-liner once you wire the API call.
 */

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Activity = {
  id: string
  title: string
  excerpt: string
  date: string
}

const activities: Activity[] = [
  {
    id: "u1",
    title: "Website launch",
    excerpt:
      "Designed with v0.dev, featuring immersive WebGL backgrounds. Looking to implement them soon!",
    date: "2025-07-15",
  },
  // Add more entries here as the blog grows. When wiring up LinkedIn, replace
  // this array with the result of a server-side fetch.
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 overflow-hidden
          w-[calc(100vw-2rem)] sm:max-w-[1100px]
          bg-white border-black/10 shadow-2xl
        "
      >
        <ScrollArea className="h-[92svh]">
          <div className="mx-auto max-w-none px-8 pb-14 pt-10 md:px-12">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <header className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
              <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                <Image
                  src="/minimal-profile-portrait.png"
                  alt="Portrait"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
                  About me
                </DialogTitle>
                <p className="mt-3 text-lg text-muted-foreground">
                  {"Building calm, high-performance experiences. Available for select collaborations."}
                </p>
              </div>
            </header>

            <Separator className="my-8" />

            {/* ─── Body ───────────────────────────────────────────────── */}
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-base leading-relaxed text-gray-800">
                  {"Electrical and computer engineering student with a fervor for applied physics and good design. I move between hardware tinkering, realtime graphics, and quiet interface work — the kind of motion that informs rather than performs."}
                </p>
                <p className="mt-4 text-base leading-relaxed text-gray-800">
                  {"Currently exploring WebGL composition, signal processing, and the seam between physical and screen-based interaction."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-2 font-medium">{"Focus"}</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>{"Realtime WebGL"}</li>
                    <li>{"UI Motion"}</li>
                    <li>{"Hardware Prototyping"}</li>
                    <li>{"Applied Physics"}</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-medium">{"Links"}</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>{"GitHub"}</li>
                    <li>{"LinkedIn"}</li>
                    <li>{"Dribbble"}</li>
                    <li>{"Twitter"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* ─── Activity blog ──────────────────────────────────────── */}
            <section aria-label="Recent activity">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                  {"Recent activity"}
                </h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {"blog · LinkedIn (soon)"}
                </span>
              </div>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {"Nothing here yet — check back soon."}
                  </p>
                ) : (
                  activities.map((a) => (
                    <Card key={a.id} className="bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-baseline justify-between text-base">
                          <span>{a.title}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {a.date}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {a.excerpt}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
