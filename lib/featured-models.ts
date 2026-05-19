/**
 * Registry of "featured" 3D objects rendered inside the BackgroundCanvas.
 *
 * Each entry corresponds 1:1 with a project in `content/projects.ts` (matched
 * by index). Index 0 is the about-me mesh — it opens the AboutDialog instead
 * of a ProjectDialog when clicked.
 *
 * To swap any slot for a real STL:
 *
 *   { kind: "stl", path: "/models/my-thing.stl", scale: 1.0, materialVariant: "solid" }
 *
 * Drop the `.stl` file into `public/models/` and update the entry below.
 *
 * Color + blend mode:
 *   • `color` is any CSS-style hex string (e.g. "#ff3366"). Default is dark
 *     gray. With the "negative" blend mode, the mesh visually appears as the
 *     INVERSE of this color against a white background — so use vivid input
 *     colors (red / green / blue / etc.) to get clear, vivid output (cyan /
 *     magenta / yellow / etc.).
 *   • `blendMode` is one of:
 *       - "normal"   → opaque, default Three.js blending. Mesh shows as `color`.
 *       - "additive" → THREE.AdditiveBlending. Overlapping meshes LIGHTEN.
 *       - "negative" → THREE.CustomBlending with REVERSE_SUBTRACT. Mesh shows
 *                      as (background − color); overlapping meshes subtract
 *                      again, producing "negative-of-negative" colors. This
 *                      is what makes overlapping meshes feel inverted against
 *                      each other.
 */

export type FeaturedShape =
  | "icosa"
  | "octa"
  | "dodeca"
  | "tetra"
  | "knot"
  | "torus"

export type FeaturedBlendMode = "normal" | "additive" | "negative"

type FeaturedModelCommon = {
  scale: number
  materialVariant?: "solid" | "wire"
  color?: string
  blendMode?: FeaturedBlendMode
}

export type FeaturedModel =
  | ({ kind: "geom"; shape: FeaturedShape } & FeaturedModelCommon)
  | ({ kind: "stl"; path: string } & FeaturedModelCommon)

/**
 * Entries map 1:1 with `projects` (by index). Index 0 is the "about-me"
 * mesh. Below is an experiment: every mesh uses the "negative" blend mode
 * so overlapping meshes invert each other against the white background.
 * Colors are spread around the wheel so the resulting on-screen colors are
 * vivid and distinct.
 */
export const featuredModels: FeaturedModel[] = [
  // index 0 — about-me mesh. Larger + vivid pure-cyan input → on white this
  // shows as RED. Stands out as the headline shape.
  { kind: "geom", shape: "icosa", scale: 1.4, materialVariant: "solid", color: "#00ffff", blendMode: "negative" },
  // indexes 1–10 — project meshes. Each gets a different input color so on
  // a white background they show as different inverse colors.
  { kind: "geom", shape: "octa",   scale: 1.0, materialVariant: "solid", color: "#ff00ff", blendMode: "negative" }, // → green
  { kind: "geom", shape: "dodeca", scale: 1.0, materialVariant: "solid", color: "#ffff00", blendMode: "negative" }, // → blue
  { kind: "geom", shape: "knot",   scale: 1.0, materialVariant: "solid", color: "#ff8800", blendMode: "negative" }, // → cyan-blue
  { kind: "geom", shape: "torus",  scale: 1.0, materialVariant: "solid", color: "#00ff88", blendMode: "negative" }, // → pink
  { kind: "geom", shape: "tetra",  scale: 1.0, materialVariant: "wire",  color: "#8800ff", blendMode: "negative" }, // → green-yellow
  { kind: "geom", shape: "icosa",  scale: 1.0, materialVariant: "wire",  color: "#ff0044", blendMode: "negative" }, // → cyan-green
  { kind: "geom", shape: "octa",   scale: 1.0, materialVariant: "solid", color: "#00ff00", blendMode: "negative" }, // → magenta
  { kind: "geom", shape: "dodeca", scale: 1.0, materialVariant: "wire",  color: "#ff0000", blendMode: "negative" }, // → cyan
  { kind: "geom", shape: "knot",   scale: 1.0, materialVariant: "solid", color: "#0000ff", blendMode: "negative" }, // → yellow
  { kind: "geom", shape: "icosa",  scale: 1.0, materialVariant: "solid", color: "#ffaa00", blendMode: "negative" }, // → blue
  // indexes 11–12 — extra meshes.
  { kind: "geom", shape: "torus",  scale: 1.0, materialVariant: "wire",  color: "#00aaff", blendMode: "negative" }, // → orange
  { kind: "geom", shape: "tetra",  scale: 1.0, materialVariant: "solid", color: "#aa00ff", blendMode: "negative" }, // → yellow-green
]
