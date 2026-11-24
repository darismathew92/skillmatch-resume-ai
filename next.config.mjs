/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Everything now lives in the Job Hub; the old resume tailor page sends people there
  async redirects() {
    return [{ source: "/app", destination: "/jobs", permanent: false }]
  },
}

export default nextConfig