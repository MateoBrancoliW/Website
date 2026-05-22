"use client"

/**
 * Publications dialog — markdown list of papers. Content lives in
 * `content/site-content.ts` (the `publications` string).
 */

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditableMarkdown } from "@/components/editable-markdown"
import { publications } from "@/content/site-content"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublicationsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden w-[calc(100vw-2rem)] sm:max-w-[860px] bg-white border-black/10 shadow-2xl">
        <ScrollArea className="h-[92svh]">
          <div className="mx-auto max-w-none px-8 pb-14 pt-10 md:px-12">
            <DialogTitle className="sr-only">Publications</DialogTitle>
            <EditableMarkdown storageKey="publications" source={publications} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
