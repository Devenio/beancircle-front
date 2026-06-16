import { NextResponse } from 'next/server';

/**
 * Digital Asset Links — served at `/.well-known/assetlinks.json`.
 *
 * This file is what tells Chrome that `com.beancircle.app` (the Play Store TWA)
 * is allowed to render `https://beancircle.app` *without* the browser address
 * bar. If it is missing, malformed, or the SHA-256 fingerprint does not match
 * the cert that actually signed the installed APK, the TWA falls back to a
 * Custom Tab (URL bar visible) — the #1 cause of "my TWA shows the address bar".
 *
 * IMPORTANT — Play App Signing:
 *   When you enrol in Play App Signing (default for new apps), Google re-signs
 *   your app with *its own* key. The fingerprint that ends up on user devices
 *   is therefore Google's, NOT your upload key. You must list BOTH so the link
 *   verifies on Play installs and on locally `bundletool`-installed builds:
 *     - the "App signing key certificate" SHA-256 (from Play Console →
 *       Setup → App integrity → App signing)
 *     - your upload/release keystore SHA-256
 *
 * Fingerprints are public information (not secrets), so they are safe to commit.
 * They are read from env so you can add Google's signing cert after first
 * upload without a code change:
 *   ANDROID_ASSETLINKS_SHA256="AA:BB:..,CC:DD:.."   (comma-separated, optional spaces)
 *   ANDROID_PACKAGE_NAME="com.beancircle.app"
 */

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME ?? 'com.beancircle.app';

// Hard-coded fallbacks let the file work even before env is wired up. Replace
// these with your real fingerprints (or set the env vars on Vercel).
const FALLBACK_FINGERPRINTS: string[] = [
  // 'REPLACE_WITH_UPLOAD_KEY_SHA256',
  // 'REPLACE_WITH_PLAY_APP_SIGNING_SHA256',
];

function fingerprints(): string[] {
  const fromEnv = (process.env.ANDROID_ASSETLINKS_SHA256 ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : FALLBACK_FINGERPRINTS;
}

export function GET() {
  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints(),
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      // Statement list must be valid JSON; Chrome is lenient on type but this is
      // the spec'd content type. Cache hard — it changes maybe once a year.
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
