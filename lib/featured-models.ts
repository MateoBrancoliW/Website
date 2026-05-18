/**
 * Registry of "featured" 3D objects rendered inside the BackgroundCanvas.
 *
 * Each entry corresponds 1:1 with a project in `content/projects.ts` (matched by index).
 * Today each slot is a placeholder geometry. To swap any slot for a real STL:
 *
 *   { kind: "stl", path: "/models/my-thing.stl", scale: 1.0, materialVariant: "solid" }
 *
 * Drop the `.stl` file into `public/models/` and update the entry below — that's it.
 * The BackgroundCanvas component reads this list as the single source of truth.
 */

export type FeaturedShape =
  | "icosa"
  | "octa"
  | "dodeca"
  | "tetra"
  | "knot"
  | "torus"

export type FeaturedModel =
  | { kind: "geom"; shape: FeaturedShape; scale: number; materialVariant?: "solid" | "wire" }
  | { kind: "stl"; path: string; scale: number; materialVariant?: "solid" | "wire" }

/**
 * Entries map 1:1 with `projects` (by index). Index 0 is the "about-me"
 * mesh — a slightly bigger sphere so it reads as the headline object.
 * Replace any `kind: "geom"` row with `kind: "stl"` as CAD files arrive.
 */
export const featuredModels: FeaturedModel[] = [
  // index 0 — about-me mesh. Slightly upscaled to stand out.
  { kind: "geom", shape: "icosa", scale: 1.4, materialVariant: "solid" },
  // indexes 1–10 — project meshes (originals).
  { kind: "geom", shape: "octa", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "dodeca", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "knot", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "torus", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "tetra", scale: 1.0, materialVariant: "wire" },
  { kind: "geom", shape: "icosa", scale: 1.0, materialVariant: "wire" },
  { kind: "geom", shape: "octa", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "dodeca", scale: 1.0, materialVariant: "wire" },
  { kind: "geom", shape: "knot", scale: 1.0, materialVariant: "solid" },
  { kind: "geom", shape: "icosa", scale: 1.0, materialVariant: "solid" },
  // indexes 11–12 — two additional project meshes.
  { kind: "geom", shape: "torus", scale: 1.0, materialVariant: "wire" },
  { kind: "geom", shape: "tetra", scale: 1.0, materialVariant: "solid" },
]
