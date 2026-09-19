import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const DEFAULT_API_ORIGIN = 'https://beancircle-api.vercel.app';
const DEFAULT_WS_ORIGIN = 'wss://beancircle-api.vercel.app';

function originFromEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function withSocketOrigin(origin: string): string[] {
  if (origin.startsWith('https://')) {
    return [origin, `wss://${origin.slice('https://'.length)}`];
  }
  if (origin.startsWith('http://')) {
    return [origin, `ws://${origin.slice('http://'.length)}`];
  }
  return [origin];
}

const connectSrcOrigins = [
  ...new Set([
    ...withSocketOrigin(
      originFromEnv(process.env.NEXT_PUBLIC_API_URL) ?? DEFAULT_API_ORIGIN,
    ),
    ...withSocketOrigin(
      originFromEnv(process.env.NEXT_PUBLIC_WS_URL) ?? DEFAULT_API_ORIGIN,
    ),
    DEFAULT_API_ORIGIN,
    DEFAULT_WS_ORIGIN,
  ]),
].join(' ');

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.neshan.org",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://flagcdn.com https://*.tile.openstreetmap.org data: blob:",
              `connect-src 'self' ws: wss: https://api.mapbox.com https://www.neshan.org ${connectSrcOrigins}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
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
