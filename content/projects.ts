export type Project = {
  slug: string
  title: string
  excerpt: string
  previewImage?: string
  heroImage?: string
  /**
   * Optional fallback position (in screen percent or NDC) used by ProjectLocatorsOverlay
   * before the 3D layer has dispatched a `locators:update` event for this slug.
   * When BackgroundCanvas is active, positions are driven each frame from the 3D mesh,
   * so this field is only a fallback for SSR / pre-mount.
   */
  position?: {
    percent?: { x: number; y: number }
    ndc?: { x: number; y: number }
  }
  content: string[]
  /**
   * Optional markdown body for the project dialog. If set, it's rendered
   * (and dev-editable) instead of joining `content[]`.
   */
  body?: string
  /**
   * Optional path to a Jupyter notebook in /public (e.g.
   * "/notebooks/my-project.ipynb"). If set, the project dialog renders the
   * notebook instead of the markdown body. Drop the .ipynb into
   * `public/notebooks/` and point here.
   */
  notebook?: string
}

/**
 * Index in this array maps 1:1 to the corresponding entry in `lib/featured-models.ts`.
 * Keep both lists the same length. Reorder both together if you reorder one.
 *
 * A slug of "about-me" is treated specially by BackgroundCanvas: that mesh
 * opens the AboutDialog (not a ProjectDialog) when clicked. The hint pulse
 * pins to this slot and only dismisses when the user clicks it.
 */
export const projects: Project[] = [
  {
    slug: "about-me",
    title: "About Mateo",
    excerpt: "Click to learn about me.",
    previewImage: "/minimal-profile-portrait.png",
    content: [
      "This mesh opens an About Me page rather than a project.",
      "(If you're reading this you've found the source — the About content lives in components/overlays/about-dialog.tsx.)",
    ],
  },
  {
    slug: "project-one",
    title: "Project One",
    excerpt: "A study in sparse motion and subtle depth cues.",
    previewImage: "/project-one-preview.png",
    heroImage: "/project-one-hero.png",
    content: [
      "This project explores particle-driven transitions within a calm UI framework.",
      "Focus areas: frame pacing, perceptual smoothness, and interaction affordances.",
    ],
    // Demo: this project's dialog renders a Jupyter notebook. Replace with
    // your own .ipynb in public/notebooks/ (or remove `notebook` to fall
    // back to the markdown body / content[]).
    notebook: "/notebooks/sample.ipynb",
  },
  {
    slug: "project-two",
    title: "Project Two",
    excerpt: "Spatial navigation with progressive detail.",
    previewImage: "/project-two-preview.png",
    heroImage: "/project-two-hero.png",
    content: [
      "A modular system for scene composition and camera choreography.",
      "Tuned for clarity across devices while preserving responsiveness.",
    ],
  },
  {
    slug: "project-three",
    title: "Project Three",
    excerpt: "Motion systems designed for continuity.",
    previewImage: "/project-three-preview.png",
    heroImage: "/project-three-hero.png",
    content: [
      "Combines physics-inspired easing with UI-friendly constraints.",
      "Highlights: deterministic transitions and composable animation primitives.",
    ],
  },
  {
    slug: "project-four",
    title: "Project Four",
    excerpt: "Tactile interactions with low-latency feedback.",
    previewImage: "/project-four-preview.png",
    heroImage: "/project-four-hero.png",
    content: [
      "Focus on input latency, prediction, and compensation techniques.",
      "Careful balance of responsiveness and stability under load.",
    ],
  },
  {
    slug: "project-five",
    title: "Project Five",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-six",
    title: "Project Six",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-seven",
    title: "Project Seven",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-eight",
    title: "Project Eight",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-nine",
    title: "Project Nine",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-ten",
    title: "Project Ten",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-eleven",
    title: "Project Eleven",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
  {
    slug: "project-twelve",
    title: "Project Twelve",
    excerpt: "Placeholder — replace with a real project.",
    content: ["Describe the project here.", "Add highlights, tools, and outcomes."],
  },
]
