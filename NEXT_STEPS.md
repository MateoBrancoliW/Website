# Next steps

A short hand-off doc for keeping this site moving without my help. Sections:
1. [Filling out projects](#1-filling-out-projects)
2. [Adding the About content + activity blog](#2-adding-the-about-content--activity-blog)
3. [Editing the hero text](#3-editing-the-hero-text)
4. [Running locally](#4-running-locally)
5. [Deploying to Vercel](#5-deploying-to-vercel)
6. [Going back to GitHub Pages](#6-going-back-to-github-pages-optional)
7. [Where things live (quick map)](#7-where-things-live-quick-map)
8. [Follow-up ideas](#8-follow-up-ideas)

---

## 1. Filling out projects

The 13 meshes in the 3D scene are driven by **two arrays that must stay the same length and in the same order**:

- `content/projects.ts` — title / excerpt / hero image / write-up
- `lib/featured-models.ts` — which 3D shape that slot uses

Index `0` is reserved for the **about-me** entry (its slug is `"about-me"` — that magic string is `ABOUT_MESH_SLUG` in `components/background-canvas.tsx`, and it's the only thing that distinguishes the about mesh from the project meshes). Indexes `1` through `12` are projects.

**To fill out a project, edit `content/projects.ts`:**

```ts
{
  slug: "calm-particles",                           // URL-safe, unique
  title: "Calm Particles",                          // shown in hover preview + dialog
  excerpt: "A study in sparse motion.",             // hover preview subtitle
  previewImage: "/calm-particles-preview.png",      // small image in hover card
  heroImage: "/calm-particles-hero.png",            // big banner inside the dialog
  content: [
    "First paragraph...",
    "Second paragraph...",
  ],
}
```

Drop the matching images into `public/` (e.g. `public/calm-particles-preview.png`). Reference them with leading `/`. If you skip `previewImage` and `heroImage`, the site falls back to placeholder SVGs.

**To change a slot's shape, edit `lib/featured-models.ts`** at the same index:

```ts
{ kind: "geom", shape: "knot", scale: 1.0, materialVariant: "wire" }
```

Available shapes: `icosa`, `octa`, `dodeca`, `tetra`, `knot`, `torus`. `materialVariant` is `"solid"` or `"wire"`. `scale` multiplies the base size (~0.24 units) — useful if one mesh should be bigger.

**To swap a placeholder for a real CAD model:**
1. Save the STL as `public/models/my-thing.stl`.
2. In `lib/featured-models.ts`, replace the row with:
   ```ts
   { kind: "stl", path: "/models/my-thing.stl", scale: 1.0, materialVariant: "solid" }
   ```
3. STL loading isn't wired yet — see the comment in `buildGeometry()` inside `components/background-canvas.tsx`. The simplest path is `useLoader(STLLoader, model.path)` from `three-stdlib`, called via a small wrapper component so React-Three-Fiber can suspend on the load.

**To add or remove a slot**, edit BOTH arrays together AND update `FEATURED_COUNT` in `components/background-canvas.tsx`. They must match in length.

---

## 2. Adding the About content + activity blog

`components/overlays/about-dialog.tsx` has three editable blocks:

- **Description paragraphs** — the body text right under the header
- **Focus / Links lists** — two columns of bullet points
- **Recent activity** — `const activities = [...]` at the top of the file

The activity items match a simple shape:
```ts
{ id: "...", title: "...", excerpt: "...", date: "YYYY-MM-DD" }
```

**LinkedIn auto-sync (future):** replace the static array with a `useEffect` that fetches your activity feed (LinkedIn's API requires an OAuth flow and approval; a simpler middle ground is a server route that scrapes your public Read.cv / GitHub feed and returns the same shape).

---

## 3. Editing the hero text

- **Name**: `components/hero-name-tag.tsx`, `name = "Mateo Brancoli"` (default prop). Pass a different `name` from `app/page.tsx` to override.
- **Descriptor cycle**: `DESCRIPTORS` array at the top of the same file. Add, remove, reorder freely.

---

## 4. Running locally

```bash
pnpm install   # or: npm install
pnpm dev       # or: npm run dev
```

Open `http://localhost:3000` (or whatever port it lands on). If you get a 404, double-check `next.config.mjs` doesn't have a `basePath` set — that's what was causing the 404 you just hit. The file is now clean.

---

## 5. Deploying to Vercel

The easiest path:

1. Push the repo to GitHub (or GitLab / Bitbucket — Vercel supports all three).
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Next.js. The default settings are correct for this project:
   - Framework: **Next.js**
   - Build command: `next build` (default)
   - Output directory: leave blank (default)
   - Install command: `pnpm install` (or whatever you use)
4. Hit **Deploy**. First build takes 1–2 minutes.
5. You get a `*.vercel.app` URL right away. Wire up a custom domain in Project Settings → Domains.

**Vercel-specific notes:**
- The `output: 'export'` line is intentionally removed from `next.config.mjs` so Vercel can deploy as a full Next.js app (SSR, ISR, API routes are all available if you ever need them).
- The `images: { unoptimized: true }` setting is also intentional — it skips Next.js's image optimizer. Vercel can do that work for you; once you have real project images, flip it back to `false` to get automatic WebP/AVIF and responsive sizing.
- Every push to your main branch triggers a new production deploy. PRs get preview deployments automatically.

**Environment variables** (if you add e.g. a LinkedIn API key):
- Add them in Project Settings → Environment Variables.
- Prefix any var that the browser needs to see with `NEXT_PUBLIC_` (e.g. `NEXT_PUBLIC_ANALYTICS_KEY`). Anything *without* that prefix is server-only — safer for tokens.

---

## 6. Going back to GitHub Pages (optional)

If you'd rather host a static export on `mateobrancoli.github.io/Portfolio` (free, no Vercel account needed), re-add to `next.config.mjs`:

```js
output: 'export',
basePath: '/Portfolio',
assetPrefix: '/Portfolio',
```

Then run `pnpm build` and push the contents of `out/` to your `gh-pages` branch (or use the [next-on-pages](https://github.com/cloudflare/next-on-pages) action). Heads up: any Next.js feature that needs a server (API routes, ISR, server actions) won't work on GitHub Pages.

---

## 7. Where things live (quick map)

| What | File |
|---|---|
| Page composition (layers, isolation parent) | `app/page.tsx` |
| 3D scene (dots + meshes + click routing) | `components/background-canvas.tsx` |
| Hero name + typewriter | `components/hero-name-tag.tsx` |
| Typewriter component | `components/typewriter.tsx` |
| Corner chrome (Contact / © / MBW) | `components/page-chrome.tsx` |
| Project dialog | `components/overlays/project-dialog.tsx` |
| About dialog (the popup) | `components/overlays/about-dialog.tsx` |
| Contact dialog | `components/overlays/contact-dialog.tsx` |
| Dialog primitive (backdrop, animations) | `components/ui/dialog.tsx` |
| Project list / hero image / write-up | `content/projects.ts` |
| 3D shape per slot | `lib/featured-models.ts` |
| Locator bridge (DOM ↔ 3D) | `lib/locator-bridge.ts` |
| Mesh hover preview overlay | `components/project-locators.tsx` |
| "Hover me" onboarding pulse | `components/scene-hints.tsx` |
| Overlay state (which dialog is open) | `components/use-overlay-nav.tsx`, `components/overlay-host.tsx` |
| Build / dev / image settings | `next.config.mjs` |

---

## 8. Follow-up ideas

Things I'd reach for next, in order of impact:

- **Real project content.** The biggest win — swap the placeholder titles / excerpts / write-ups for actual work.
- **Real project images.** Two per project (`previewImage` and `heroImage`). Even a single representative screenshot per slot transforms the feel.
- **STL hookup.** Wire `kind: "stl"` so the placeholder geometries can be replaced with actual CAD output. The seam is `buildGeometry()` in `background-canvas.tsx`.
- **`Mateo` typography pass.** The name is currently the default system font. Pulling in a display font (e.g. via `next/font/google`) and applying it just to `<h1>` in `hero-name-tag.tsx` would meaningfully personalize the page.
- **Per-mesh tinting.** Right now every mesh is the same `#171717`. A subtle color shift per slot (e.g., driven by a hash of the slug) would help the meshes feel like distinct artefacts.
- **Reduced-motion mode.** Wrap the world rotation, drift, and typewriter in a `useReducedMotion()` check so users with the OS-level preference get a static page.
- **Analytics.** Vercel has built-in analytics (free tier, no cookies). One toggle in Project Settings.
- **OG image.** Add an `app/opengraph-image.tsx` so links to your site preview nicely in Slack / iMessage / Twitter.

That's the lot. Happy shipping.
