"use client"

import { useOverlayNav } from "./use-overlay-nav"
import { ContactDialog } from "./overlays/contact-dialog"
import { ProjectDialog } from "./overlays/project-dialog"
import { AboutDialog } from "./overlays/about-dialog"

export function OverlayHost() {
  const { state, closeOverlay } = useOverlayNav()
  const close = (o: boolean) => (!o ? closeOverlay() : null)

  return (
    <>
      <ContactDialog open={state.type === "contact"} onOpenChange={close} />
      <AboutDialog open={state.type === "about"} onOpenChange={close} />
      {state.type === "project" ? (
        <ProjectDialog slug={state.slug} open={true} onOpenChange={close} />
      ) : null}
    </>
  )
}
