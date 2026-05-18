"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type OverlayState =
  | { type: "none" }
  | { type: "contact" }
  | { type: "about" }
  | { type: "project"; slug: string }

type OverlayContext = {
  state: OverlayState
  openContact: () => void
  openAbout: () => void
  openProject: (slug: string) => void
  closeOverlay: () => void
}

const Ctx = createContext<OverlayContext | null>(null)

export function OverlayNavProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>({ type: "none" })

  const openContact = useCallback(() => setState({ type: "contact" }), [])
  const openAbout = useCallback(() => setState({ type: "about" }), [])
  const openProject = useCallback((slug: string) => setState({ type: "project", slug }), [])
  const closeOverlay = useCallback(() => setState({ type: "none" }), [])

  const value = useMemo(
    () => ({ state, openContact, openAbout, openProject, closeOverlay }),
    [state, openContact, openAbout, openProject, closeOverlay],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOverlayNav() {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error("useOverlayNav must be used within OverlayNavProvider")
  }
  return ctx
}
