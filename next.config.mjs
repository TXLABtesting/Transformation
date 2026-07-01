/** @type {import('next').NextConfig} */

// When BUILD_STATIC=1 we produce a fully static export (for GitHub Pages / any
// static host). In that mode the app runs entirely client-side against
// localStorage — no Node server, no Postgres required. The optional API routes
// and Prisma/Postgres layer are only used in the full Docker/server deployment.
const isStatic = process.env.BUILD_STATIC === '1';

// For project pages on GitHub Pages the site is served from /<repo>. Set
// NEXT_PUBLIC_BASE_PATH=/Transformation for that case.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  ...(isStatic
    ? {
        output: 'export',
        images: { unoptimized: true },
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
