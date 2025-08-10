export type Project = {
  slug: string
  title: string
  excerpt: string
  previewImage?: string
  heroImage?: string
  position?: {
    percent?: { x: number; y: number }
    ndc?: { x: number; y: number }
  }
  content: string[]
}

export const projects: Project[] = [
  {
    slug: "project-one",
    title: "Project One",
    excerpt: "A study in sparse motion and subtle depth cues.",
    previewImage: "/project-one-preview.png",
    heroImage: "/project-one-hero.png",
    position: { percent: { x: 0.22, y: 0.32 } },
    content: [
      "This project explores particle-driven transitions within a calm UI framework.",
      "Focus areas: frame pacing, perceptual smoothness, and interaction affordances.",
    ],
  },
  {
    slug: "project-two",
    title: "Project Two",
    excerpt: "Spatial navigation with progressive detail.",
    previewImage: "/project-two-preview.png",
    heroImage: "/project-two-hero.png",
    position: { percent: { x: 0.68, y: 0.28 } },
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
    position: { percent: { x: 0.36, y: 0.68 } },
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
    position: { percent: { x: 0.74, y: 0.62 } },
    content: [
      "Focus on input latency, prediction, and compensation techniques.",
      "Careful balance of responsiveness and stability under load.",
    ],
  },
]
