"use client"

import { useOverlayNav } from "./use-overlay-nav"
import { ContactDialog } from "./overlays/contact-dialog"
import { ProjectDialog } from "./overlays/project-dialog"

export function OverlayHost() {
  const { state, closeOverlay } = useOverlayNav()

  return (
    <>
      <ContactDialog open={state.type === "contact"} onOpenChange={(o) => (!o ? closeOverlay() : null)} />
      {state.type === "project" ? (
        <ProjectDialog slug={state.slug} open={true} onOpenChange={(o) => (!o ? closeOverlay() : null)} />
      ) : null}
    </>
  )
}
