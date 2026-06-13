import type { MetadataRoute } from 'next';

/**
 * Web App Manifest, served by Next.js at `/manifest.webmanifest`.
 *
 * The manifest is locale-neutral on purpose: it is fetched once by the browser
 * at install time and cached, so it stays in the brand language ("Bean Circle"
 * reads the same in every locale). `start_url` points at `/`, which the root
 * page redirects to the visitor's locale, so the installed app always opens in
 * the right language. See docs/PWA.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Bean Circle — Coffee Social',
    short_name: 'Bean Circle',
    description:
      'A social network for café lovers. Collect stamps, discover cafés, and connect with your coffee community.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    // Ordered most→least preferred. WCO gives a native title-bar feel on
    // desktop; browsers fall back down the list when a mode is unavailable.
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    theme_color: '#1a0f0a',
    background_color: '#ffffff',
    categories: ['social', 'lifestyle', 'food'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile-1.jpg',
        sizes: '1080x1920',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'Your coffee passport',
      },
      {
        src: '/screenshots/mobile-2.jpg',
        sizes: '1080x1920',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'Discover cafés near you',
      },
      {
        src: '/screenshots/wide-1.jpg',
        sizes: '1920x1080',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'A social network for café lovers',
      },
    ],
    shortcuts: [
      {
        name: 'Passport',
        short_name: 'Passport',
        description: 'Open your coffee passport',
        url: '/en/passport?source=pwa-shortcut',
        icons: [{ src: '/icons/shortcut-passport.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Jump into your conversations',
        url: '/en/messages?source=pwa-shortcut',
        icons: [{ src: '/icons/shortcut-messages.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Discover',
        short_name: 'Discover',
        description: 'Explore cafés and people',
        url: '/en/discover?source=pwa-shortcut',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
    prefer_related_applications: false,
  };
}
