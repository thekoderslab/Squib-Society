/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint is not part of this scaffold; skip it during `next build` on Vercel.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
