import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // Chat media is uploaded to object storage (S3/R2/MinIO) and referenced by
    // URL. The public bucket host is environment-configured, so allow any
    // https/http host. Tighten to your bucket hostname in production if desired.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    // Same-origin proxy: the browser only ever talks to the host that served
    // the page (localhost, a LAN IP, or a tunnel), and Next forwards API +
    // realtime traffic to the backend. This is what makes the app work on a
    // phone over a tunnel with no hardcoded localhost, no mixed-content
    // blocking, and no CORS — the phone sees everything as one origin.
    const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3002';
    return [
      { source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` },
      { source: '/socket.io/:path*', destination: `${target}/socket.io/:path*` },
    ];
  },
  async headers() {
    return [
      {
        // Baseline security headers for every route.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The service worker must never be cached by the browser/CDN so updates
        // ship instantly, and it needs root scope to control the whole app.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
