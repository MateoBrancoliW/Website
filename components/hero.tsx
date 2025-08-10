"use client"

import { ProjectLocatorsOverlay } from "./project-locators"
import { projects } from "@/content/projects"

export function Hero() {
  return (
    <section id="home" aria-label="Landing" className="relative h-[100svh]">
      {/* Fixed overlay: project markers and static landing text */}
      <div className="fixed inset-0 z-20">
        {/* Landing text aligned to Updates container paddings */}
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <div className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
            <div className="pt-4 md:pt-6 text-left">
              <h1 className="text-xl font-medium leading-tight md:text-2xl text-gray-900">
                {"Calm interfaces,"}
                <br className="hidden sm:block" />
                {"bold ideas."}
              </h1>
              <p className="mt-2 max-w-[36ch] text-xs text-gray-600 md:text-sm">
                {"Space-first layout engineered for motion and WebGL. The background is your stage."}
              </p>
            </div>
          </div>
        </div>

        {/* Project markers: unchanged */}
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
    </section>
  )
}
