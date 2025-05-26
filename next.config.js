/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Required for static export
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },

  // Disable API routes for static export
  experimental: {
    appDir: false,
  },
};

module.exports = nextConfig;
