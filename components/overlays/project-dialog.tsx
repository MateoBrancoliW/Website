"use client"

import Image from "next/image"
import { useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { projects } from "@/content/projects"

type Props = {
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDialog({ slug, open, onOpenChange }: Props) {
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug])

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Wider + taller + fully opaque. The previous size (900px) felt cramped;
        bumping to ~1200px and 92svh makes the dialog the dominant focus
        surface. `bg-white` overrides the theme variable so there's zero
        transparency against the WebGL scene behind the backdrop.
      */}
      <DialogContent
        className="
          p-0 overflow-hidden
          w-[calc(100vw-2rem)] sm:max-w-[1200px]
          bg-white border-black/10 shadow-2xl
        "
      >
        <ScrollArea className="h-[92svh]">
          <article className="prose prose-neutral mx-auto max-w-none">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src={project.heroImage ?? "/placeholder.svg?height=720&width=1280&query=hero%20image%20for%20project"}
                alt={`${project.title} hero`}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="px-8 pb-14 pt-8 md:px-12">
              <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">{project.title}</h1>
              <p className="mb-6 text-lg text-muted-foreground">{project.excerpt}</p>
              <Separator className="my-6" />
              {project.content.map((para, idx) => (
                <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
