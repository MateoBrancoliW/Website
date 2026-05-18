"use client"

import { ProjectLocatorsOverlay } from "./project-locators"
import { SceneHints } from "./scene-hints"
import { projects } from "@/content/projects"

export function Hero() {
  return (
    <section
      id="home"
      aria-label="Landing"
      // pointer-events-none: this section sits over the 3D canvas during the
      // landing view; we want hover/click on the meshes to work, so the section
      // (and everything inside that doesn't explicitly opt in) must pass through.
      className="pointer-events-none relative h-[100svh]"
    >
      {/* Fixed overlay: project hover previews + onboarding hint.
          pointer-events-none is critical — without it this transparent layer
          eats every hover and the 3D meshes underneath never see the cursor.
          The hero name + page chrome are mounted up in app/page.tsx inside
          the isolation parent so they can mix-blend with the canvas. */}
      <div className="pointer-events-none fixed inset-0 z-20">
        {/* Project hover previews. Title buttons are NOT rendered — they
            only show as a preview card on mesh hover (the canvas dispatches
            `locators:hover`, this overlay reacts). */}
        <ProjectLocatorsOverlay
          items={projects.map((p) => ({
            id: p.slug,
            title: p.title,
            slug: p.slug,
            percent: p.position?.percent,
            ndc: p.position?.ndc,
            image: p.previewImage,
            description: p.excerpt,
          }))}
          fixed
        />
      </div>

      {/* Onboarding cue: pulsing hint pinned to the about-me mesh. Stays
          visible until the user clicks that specific mesh (which opens the
          About dialog). `projects[0]` is the about-me slot by convention. */}
      <SceneHints pinHintTo={projects[0]?.slug ?? ""} />
    </section>
  )
}
