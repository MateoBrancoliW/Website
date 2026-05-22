"use client"

/**
 * About dialog — now a CV-style page (no projects/publications; those have
 * their own dialogs). Markdown-driven, text-first: a small avatar sits beside
 * the opening lines rather than a full-width hero photo.
 *
 * Content lives in `content/site-content.ts` (the `aboutCv` markdown string).
 */

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditableMarkdown } from "@/components/editable-markdown"
import { aboutCv } from "@/content/site-content"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden w-[calc(100vw-2rem)] sm:max-w-[860px] bg-white border-black/10 shadow-2xl">
        <ScrollArea className="h-[92svh]">
          <div className="mx-auto max-w-none px-8 pb-14 pt-10 md:px-12">
            {/* Small avatar inline with the top of the CV — not a hero photo. */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                <Image src="/minimal-profile-portrait.png" alt="Portrait" fill className="object-cover" />
              </div>
              {/* Visually-hidden dialog title for accessibility; the markdown
                  H1 carries the on-screen heading. */}
              <DialogTitle className="sr-only">About Mateo</DialogTitle>
              <p className="text-sm text-muted-foreground">Curriculum vitae</p>
            </div>

            <EditableMarkdown storageKey="about" source={aboutCv} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
