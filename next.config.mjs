/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Move the dev-mode Next.js indicator out of bottom-right (where MBW now
  // sits) over to top-right. `position` is the Next.js 15.2+ key; older
  // versions used `buildActivityPosition`, so we set both for safety —
  // unknown keys are ignored.
  devIndicators: {
    position: "top-right",
    buildActivityPosition: "top-right",
  },
}

export default nextConfig