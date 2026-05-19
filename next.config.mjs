/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint / type errors don't block the build — these are vestiges of the
  // v0.dev scaffold. Worth flipping back on once the codebase settles.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Next.js Image optimization is off so the site can ship as a pure
  // static bundle when needed. Vercel can re-enable optimization simply
  // by removing this line.
  images: {
    unoptimized: true,
  },

  // NOTE: `output: 'export'`, `basePath`, and `assetPrefix` were here for a
  // GitHub Pages static-export deployment to `<user>.github.io/Portfolio`.
  // They make localhost serve under `/Portfolio` (so `/` 404s) and they're
  // unnecessary on Vercel — Vercel deploys at the root of its own domain.
  // If you ever go back to GitHub Pages, re-add:
  //
  //   output: 'export',
  //   basePath: '/Portfolio',
  //   assetPrefix: '/Portfolio',

  // Park the dev-mode Next.js indicator in the top-LEFT so it doesn't
  // collide with the Contact text (top-right) or the MBW initials
  // (bottom-right).
  devIndicators: {
    position: "top-left",
  },
}

export default nextConfig
