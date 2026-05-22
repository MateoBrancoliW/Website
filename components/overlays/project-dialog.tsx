"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { EditableMarkdown } from "@/components/editable-markdown"
import { NotebookViewer } from "@/components/notebook-viewer"
import { projects } from "@/content/projects"

type Props = {
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Project dialog — text-first. Leads with the title + excerpt, then the body.
 * No full-width hero photo at the top anymore.
 *
 * Body source: if a project has a `body` markdown string we render that;
 * otherwise we fall back to joining the legacy `content: string[]` paragraphs
 * into markdown. Either way it goes through the shared <Markdown> renderer.
 */
export function ProjectDialog({ slug, open, onOpenChange }: Props) {
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug])

  // Markdown body fallback (used when there's no notebook).
  const body = useMemo(() => {
    if (!project) return ""
    if (project.body) return project.body
    return project.content.join("\n\n")
  }, [project])

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wider than the other dialogs — notebooks carry code, tables, and
          plots that want the horizontal room. */}
      <DialogContent className="p-0 overflow-hidden w-[calc(100vw-2rem)] sm:max-w-[1100px] bg-white border-black/10 shadow-2xl">
        <ScrollArea className="h-[92svh]">
          <div className="mx-auto max-w-none px-8 pb-14 pt-10 md:px-12">
            <DialogTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
              {project.title}
            </DialogTitle>
            <p className="mt-3 text-lg text-muted-foreground">{project.excerpt}</p>
            <Separator className="my-6" />
            {/* Notebook if one is configured, else the (dev-editable) markdown. */}
            {project.notebook ? (
              <NotebookViewer path={project.notebook} />
            ) : (
              <EditableMarkdown storageKey={`project:${project.slug}`} source={body} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
