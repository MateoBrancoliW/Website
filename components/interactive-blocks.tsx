"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

type Block = {
  title: string
  href: string
}

type InteractiveBlocksProps = {
  items?: Block[]
  className?: string
}

const defaultItems: Block[] = [
  { title: "Project One", href: "/projects/project-one" },
  { title: "Project Two", href: "/projects/project-two" },
  { title: "Project Three", href: "/projects/project-three" },
  { title: "Project Four", href: "/projects/project-four" },
]

export function InteractiveBlocks({ items = defaultItems, className }: InteractiveBlocksProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="false"
      aria-label="Interactive project blocks overlay"
    >
      <div className="pointer-events-none absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-auto">
        <div className="pointer-events-auto grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-xl border bg-white/70 px-4 py-6 text-sm shadow-sm backdrop-blur transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
            >
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">View</span>
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-0 transition group-hover:ring-1 group-hover:ring-neutral-400/80" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
