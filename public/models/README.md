# Featured 3D models

This folder holds STL files for the featured meshes shown in the homepage background.

## How it wires up

`components/background-canvas.tsx` renders 15 featured meshes. The 1:1 mapping
between a mesh and the project it represents lives in two files:

1. `lib/featured-models.ts` — geometry / STL path per slot
2. `content/projects.ts` — project metadata per slot

Index N in `featuredModels` corresponds to index N in `projects`. Keep both
lists the same length and in the same order.

## Adding an STL

1. Drop the file in this folder, e.g. `public/models/my-project.stl`.
2. Open `lib/featured-models.ts` and change the slot you want from:

   ```ts
   { kind: "geom", shape: "icosa", scale: 1.0, materialVariant: "solid" }
   ```

   to:

   ```ts
   { kind: "stl", path: "/models/my-project.stl", scale: 1.0, materialVariant: "solid" }
   ```

3. The slot will currently render as a placeholder sphere until STL loading is
   wired in `buildGeometry()` (see TODO in that function). To actually load the
   STL, swap in `useLoader(STLLoader, paths)` at the component layer and pass
   the loaded `BufferGeometry` down. (Ping Claude — it's a small change.)

## STL prep tips

- Decimate to 5–20k triangles per model. >100k starts to hurt on mobile.
- Center each model at the origin; scale so the longest dimension is ≈1.
- Binary STL preferred for anything over ~1 MB ASCII.
