# Featured 3D models (optimized)

Files in this folder are **generated** — don't edit them by hand.

- Source CAD exports (`.stl`) live in `/models-src/` and are NOT deployed.
- `pnpm models` converts every `models-src/*.stl` into a small `public/models/*.glb`
  (welded, decimated to ≤30k triangles, quantized, meshopt-compressed —
  typically 5–25 MB → ~100 KB). `pnpm models kart` converts just one.
- Wire a model to a slot in `lib/featured-models.ts`:

  ```ts
  { kind: "glb", path: "/models/my-project.glb", scale: 2.5, materialVariant: "solid" }
  ```

Index N in `featuredModels` corresponds to index N in `content/projects.ts`.

If a simplified model loses detail you care about, raise its triangle budget in
`OVERRIDES` at the top of `scripts/optimize-models.mjs` and re-run.
