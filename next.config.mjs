/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // X profile pictures, needed once the real OAuth flow returns avatar URLs.
    remotePatterns: [{ protocol: "https", hostname: "pbs.twimg.com" }],
  },
  reactStrictMode: true,
  // ESLint is not part of this scaffold; skip it during `next build` on Vercel.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
