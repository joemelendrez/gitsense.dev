/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Fix: Use output export instead of next export command
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

  // Remove the experimental.appDir - it's not needed and causes warnings
};

module.exports = nextConfig;
