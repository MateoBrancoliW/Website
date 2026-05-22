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
  { kind: "geom", shape: "dodeca", scale: 1.4, materialVariant: "solid", color: "#93e39d", blendMode: "negative" },

  //NEW
  { kind: "stl", path: "/models/bonsai.stl", scale: 2.5, materialVariant: "solid", color: "#c90280", blendMode: "negative" },
  { kind: "stl", path: "/models/kart.stl", scale: 2.5, materialVariant: "solid", color: "#024bc9", blendMode: "negative" },
  { kind: "stl", path: "/models/dron.stl", scale: 2.5, materialVariant: "solid", color: "#dabe6a", blendMode: "negative" },
  { kind: "stl", path: "/models/grating.stl", scale: 2.5, materialVariant: "solid", color: "#dae5d9", blendMode: "negative" },
  { kind: "stl", path: "/models/spectrometer.stl", scale: 2.2, materialVariant: "solid", color: "#ade1f4", blendMode: "negative" },
  { kind: "stl", path: "/models/rocky.stl", scale: 2.5, materialVariant: "solid", color: "#00ffff", blendMode: "negative" },
  { kind: "stl", path: "/models/dogbone.stl", scale: 2.5, materialVariant: "solid", color: "#636a6a", blendMode: "negative" },
  { kind: "stl", path: "/models/si-ph.stl", scale: 2.5, materialVariant: "solid", color: "#8800ff", blendMode: "negative" },
  { kind: "stl", path: "/models/board.stl", scale: 2.5, materialVariant: "solid", color: "#d3708a", blendMode: "negative" },
  { kind: "stl", path: "/models/wheelchair.stl", scale: 2.2, materialVariant: "solid", color: "#00ff00", blendMode: "negative" },
  { kind: "stl", path: "/models/blinknano.stl", scale: 2.5, materialVariant: "solid", color: "#7f7f00", blendMode: "negative" },

]
