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
      <DialogContent className="p-0 sm:max-w-[900px] w-[calc(100vw-2rem)]">
        <ScrollArea className="h-[85svh]">
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
            <div className="px-6 pb-10 pt-6">
              <h1 className="mb-2 text-2xl font-semibold tracking-tight">{project.title}</h1>
              <p className="mb-6 text-muted-foreground">{project.excerpt}</p>
              <Separator className="my-6" />
              {project.content.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
