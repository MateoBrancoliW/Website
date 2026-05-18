"use client"

/**
 * Big bold name + typewriter role, anchored middle-left of the viewport.
 *
 * The name is DECORATIVE now: it does nothing on click. The About page is
 * opened by clicking the about-me mesh in the 3D scene — see
 * `components/background-canvas.tsx` and `ABOUT_MESH_SLUG`.
 *
 * Each word still scales individually on its own hover for a small tactile
 * feel — the breathing animation that used to run idly is gone (it was
 * advertising interactivity that's now elsewhere).
 *
 * Visual gimmick: text in `text-white` + `mix-blend-mode: difference` →
 * appears solid black on the white background, light on dark meshes that
 * pass behind it. For the blend to work, this component must share a
 * stacking context with <BackgroundCanvas /> (see app/page.tsx).
 */

import { Typewriter } from "./typewriter"

const DESCRIPTORS = [
  "electrical and computer engineer",
  "hardware developer",
  "WebGL tinkerer",
  "applied physics enthusiast",
]

export function HeroNameTag({ name = "Mateo Brancoli" }: { name?: string }) {
  const words = name.split(/\s+/).filter(Boolean)

  return (
    <div
      // Single-line className intentional: styled-jsx (used below for the
      // `hero-fade` keyframes) doesn't escape newlines when it splices its
      // scoped hash into the className attribute, which throws the build
      // error "Unterminated string constant". Keep classes one line in any
      // file that also uses <style jsx>.
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-6 md:pl-12 lg:pl-20 w-full max-w-lg md:max-w-2xl lg:max-w-3xl"
    >
      <div
        // Slow fade-in + slight rise on mount — this is the same entrance the
        // Contact button mirrors on the page chrome.
        className="hero-fade-in"
        style={{
          mixBlendMode: "difference",
          color: "white",
        }}
      >
        {/* Tight line-height between the two name lines — leading-[0.9] pulls
            "Brancoli" up close to "Mateo" without overlap. */}
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl leading-[0.9]">
          {words.map((word, i) => (
            <NameWord key={`${word}-${i}`} word={word} />
          ))}
        </h1>
        <p className="mt-1 font-bold text-lg md:mt-2 md:text-2xl lg:text-3xl">
          <Typewriter items={DESCRIPTORS} />
        </p>
      </div>

      <style jsx>{`
        .hero-fade-in {
          animation: hero-fade 900ms ease-out both;
        }
        @keyframes hero-fade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// ─── Individual word ────────────────────────────────────────────────────────
/**
 * Each word is its own `<span>` so we can hover-scale just that word.
 * No click handler — clicking the name does nothing now. Hover scale is a
 * small decorative touch; without it the name would feel a bit lifeless
 * given how prominently it's typeset.
 */
function NameWord({ word }: { word: string }) {
  return (
    <span
      className="pointer-events-auto mr-[0.25em] inline-block align-baseline transition-transform duration-200 ease-out hover:scale-[1.06]"
      style={{ transformOrigin: "left center" }}
    >
      {word}
    </span>
  )
}
