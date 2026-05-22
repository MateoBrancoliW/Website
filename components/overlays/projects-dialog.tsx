"use client"

/**
 * Projects dialog — a browsable list of the same projects floating in the 3D
 * scene. Clicking an entry swaps to that project's own dialog (text-first
 * markdown). Excludes the about-me slot.
 *
 * Intro copy is markdown (`projectsIntro` in content/site-content.ts); the
 * list itself is generated from `content/projects.ts`.
 */

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Markdown } from "@/components/markdown"
import { projects } from "@/content/projects"
import { projectsIntro } from "@/content/site-content"
import { ABOUT_MESH_SLUG } from "@/components/background-canvas"
import { useOverlayNav } from "@/components/use-overlay-nav"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectsDialog({ open, onOpenChange }: Props) {
  const { openProject } = useOverlayNav()
  const list = projects.filter((p) => p.slug !== ABOUT_MESH_SLUG)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden w-[calc(100vw-2rem)] sm:max-w-[860px] bg-white border-black/10 shadow-2xl">
        <ScrollArea className="h-[92svh]">
          <div className="mx-auto max-w-none px-8 pb-14 pt-10 md:px-12">
            <DialogTitle className="sr-only">Projects</DialogTitle>
            <Markdown content={projectsIntro} />
            <Separator className="my-6" />

            <ul className="divide-y divide-black/10">
              {list.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    // Switching overlay state from "projects" → "project"
                    // replaces this dialog with the project's dialog.
                    onClick={() => openProject(p.slug)}
                    className="group flex w-full items-baseline justify-between gap-4 py-4 text-left transition hover:bg-black/[0.02]"
                  >
                    <span className="text-base font-medium text-gray-900 group-hover:underline underline-offset-4">
                      {p.title}
                    </span>
                    <span className="hidden flex-1 truncate text-sm text-muted-foreground sm:block">
                      {p.excerpt}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
