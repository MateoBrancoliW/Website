/**
 * Site copy authored as Markdown (rendered by components/markdown.tsx).
 *
 * Everything here is placeholder text — edit freely. Markdown supported:
 * headings (#/##/###), **bold**, *italic*, `code`, [links](url), - bullet
 * and 1. numbered lists, > blockquotes, --- rules, ``` code fences.
 *
 * Keep these as plain template-literal strings so they ship with the static
 * export (no file-loading at runtime).
 */

// ─── About / CV ───────────────────────────────────────────────────────────────
// CV-style: bio, experience, education, skills — NO projects or publications
// (those have their own dialogs). Lead with text, not a photo.
export const aboutCv = `
# Mateo Brancoli

Electrical & computer engineering student with a fervor for applied physics
and good design. I move between hardware tinkering, realtime graphics, and
quiet interface work — the kind of motion that informs rather than performs.

## Now

Currently exploring WebGL composition, signal processing, and the seam
between physical and screen-based interaction. Available for select
collaborations.

## Experience

### Research Assistant — *Placeholder Lab*
*2024 – present*

- Replace with a real role. One line on what you built or measured.
- A second bullet on impact, tooling, or outcome.

### Engineering Intern — *Placeholder Co.*
*Summer 2023*

- Replace with a real role and a couple of concrete bullets.

## Education

**B.S. Electrical & Computer Engineering** — *Your University*, expected 20XX

- Relevant coursework: signals & systems, embedded systems, applied physics.
- Activities, honors, or a line about your focus area.

## Skills

- **Hardware:** PCB design, embedded C, instrumentation
- **Graphics:** Three.js / WebGL, GLSL, React
- **Tools:** CAD (STL pipeline → this very site), Python, Git

> Tip: edit this whole section in \`content/site-content.ts\` (the \`aboutCv\`
> string). Projects and publications live in their own dialogs.
`

// ─── Publications ──────────────────────────────────────────────────────────────
export const publications = `
# Publications

A running list of papers, preprints, and write-ups. Replace these with the
real thing — title, venue, year, and a link.

## 2025

- **Placeholder Paper Title One.** *Co-author A, Co-author B.* Venue / Journal,
  2025. [PDF](#) · [DOI](#)

- **Placeholder Paper Title Two.** *Solo or with co-authors.* Conference, 2025.
  [arXiv](#)

## 2024

- **An Earlier Placeholder.** Workshop, 2024. [link](#)

---

*Nothing here is real yet — edit the \`publications\` string in
\`content/site-content.ts\`.*
`

// ─── Projects intro (header of the Projects list dialog) ────────────────────────
export const projectsIntro = `
# Projects

The same projects floating in the scene — listed here so you can browse them
without chasing the meshes. Click any entry to open it.
`
