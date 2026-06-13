# Progressive Web App (PWA)

Bean Circle is installable as a native-feeling app on Android, iOS/iPadOS,
Windows, macOS and Linux, with offline support, an update flow, push
notifications and a dedicated install experience. This document explains the
architecture and the install flow on every platform.

---

## 1. Architecture at a glance

| Concern | Where |
| --- | --- |
| Web App Manifest | [`src/app/manifest.ts`](../src/app/manifest.ts) → served at `/manifest.webmanifest` |
| Icons / screenshots | [`public/icons/`](../public/icons), [`public/screenshots/`](../public/screenshots) (generated) |
| Asset generator | [`scripts/generate-pwa-assets.mjs`](../scripts/generate-pwa-assets.mjs) |
| Service worker | [`public/sw.js`](../public/sw.js) (caching + offline + update + **Web Push**) |
| Offline fallback page | [`public/offline.html`](../public/offline.html) |
| Viewport / Apple meta | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Security / SW headers | [`next.config.ts`](../next.config.ts) |
| Platform detection | [`src/lib/pwa/platform.ts`](../src/lib/pwa/platform.ts) |
| Install-prompt manager | [`src/lib/pwa/install.ts`](../src/lib/pwa/install.ts) |
| SW registration / update | [`src/lib/pwa/service-worker.ts`](../src/lib/pwa/service-worker.ts) |
| Analytics hooks | [`src/lib/pwa/analytics.ts`](../src/lib/pwa/analytics.ts) |
| State (zustand) | [`src/stores/pwa-store.ts`](../src/stores/pwa-store.ts) |
| React hooks | [`src/hooks/use-pwa.ts`](../src/hooks/use-pwa.ts) |
| Wiring (events, SW, UI) | [`src/providers/pwa-provider.tsx`](../src/providers/pwa-provider.tsx) (mounted in `[locale]/layout.tsx`) |
| UI components | [`src/components/pwa/`](../src/components/pwa) |
| Install page | [`src/app/[locale]/install/page.tsx`](../src/app/[locale]/install/page.tsx) → `/<locale>/install` |
| i18n strings | `pwa` + `install` namespaces in `messages/{en,fa}.json` |

### Design decisions

- **Single service worker.** `public/sw.js` already powered Web Push. Rather than
  add a second worker, it was extended with caching/offline/update logic so push
  and offline share one registration. The push event handlers are unchanged.
- **No `skipWaiting()` on install.** A new worker stays *waiting* so we can show a
  "New version available" prompt and let the user apply it. First installs (no
  controller) still activate immediately.
- **Static, pre-generated icons.** Real PNG/JPEG files are produced by a `sharp`
  script and committed under `public/`. Zero runtime cost and best for Lighthouse.
- **Locale-neutral manifest.** The manifest is fetched once at install time and
  cached, so it stays in the brand language. `start_url` is `/`, which the proxy +
  next-intl resolve to the user's locale, so the installed app opens localized.
- **`/install` is public.** Added to `PUBLIC_PATHS` in
  [`src/proxy.ts`](../src/proxy.ts) so users can read install instructions before
  signing in. Static PWA files (`/manifest.webmanifest`, `/sw.js`, `/offline.html`,
  `/icons/*`) bypass the proxy automatically (its matcher excludes dotted paths).

---

## 2. Manifest

`src/app/manifest.ts` returns a typed `MetadataRoute.Manifest` with:
`name`, `short_name`, `description`, `id`, `start_url`, `scope`, `display:
standalone`, `display_override` (`window-controls-overlay` → `standalone` →
`minimal-ui` → `browser`), `orientation`, `theme_color`, `background_color`,
`categories`, `lang`/`dir`, an icon set (8 "any" sizes + maskable 192/512 + SVG),
`screenshots` (narrow + wide form factors for the richer install UI), and
`shortcuts` (Passport / Messages / Discover).

Next.js auto-injects `<link rel="manifest" href="/manifest.webmanifest">`.

---

## 3. Icons & assets

Generated from brand-accurate master SVGs (the BeanCircle coffee mark) by
`scripts/generate-pwa-assets.mjs`:

```bash
nvm use 24            # the repo's Node version (sharp needs a modern Node)
node scripts/generate-pwa-assets.mjs
```

Produces in `public/`:

- `icons/icon-{72,96,128,144,152,192,384,512}.png` — standard ("any") icons
- `icons/maskable-{192,512}.png` — maskable (full-bleed, 80% safe zone)
- `icons/apple-touch-icon.png` — 180×180, opaque (iOS applies its own mask)
- `icons/favicon-{16,32,96}.png` + `favicon.svg` — favicon variants
- `icons/shortcut-{passport,messages}.png` — manifest shortcut icons
- `screenshots/{mobile-1,mobile-2,wide-1}.jpg` — manifest screenshots

`apple-touch-icon`, the favicon variants and standalone web-app meta are wired in
`src/app/layout.tsx` (`metadata.icons` + `metadata.appleWebApp`).

---

## 4. Service worker & caching

`public/sw.js` is **versioned** by `CACHE_VERSION`. On `activate` it deletes any
`bc-*` cache that isn't part of the current version. Strategies:

| Request | Strategy |
| --- | --- |
| Navigations (`mode: navigate`) | **Network-first**, falls back to `/offline.html`. HTML is never cached, so authed/locale pages stay fresh. |
| `/_next/static/*`, `/font/*`, `/icons/*`, manifest, `favicon.svg` | **Cache-first** (immutable, hashed). |
| `/_next/image*` and `*.png/jpg/webp/avif/gif/svg` | **Stale-while-revalidate** (bounded cache). |
| Other same-origin GETs (RSC payloads, public files) | **Stale-while-revalidate** (bounded cache). |
| Cross-origin (API, map tiles, object storage) | **Network only** — not cached (auth/opaque responses are unsafe to cache by default). |

Only `GET` over `http(s)` is intercepted; mutations and non-http schemes pass
through untouched. Image/runtime caches are trimmed to a max entry count.

### Update flow

1. A new SW installs and stays **waiting** (we don't auto-`skipWaiting`).
2. `service-worker.ts` detects this (`updatefound` → `statechange === installed`
   while a controller exists) and `PwaProvider` sets `updateReady`.
3. `PwaToaster` shows **"New version available"** with **Update / Later**.
4. **Update** → `activateUpdate()` posts `SKIP_WAITING`; the SW activates and the
   page reloads on `controllerchange` (guarded so first installs don't flash-reload).

`reg.update()` is also called on tab focus to pick up new deploys.

---

## 5. Offline experience

- **Offline page:** `public/offline.html` — a self-contained, branded, en/fa page
  served by the SW when a navigation fails. It auto-reloads when connectivity
  returns and has a manual **Retry** button.
- **Offline toast:** `PwaToaster` shows a persistent "You're offline" toast while
  `navigator.onLine` is false, and a brief "Back online" confirmation when it
  returns (driven by `online`/`offline` events in `PwaProvider`).
- Cached static assets and the last-loaded shell keep the UI functional offline.

---

## 6. Install experience per platform

The install page (`/<locale>/install`) auto-detects the platform and shows the
right instructions; a tab switcher lets users read any platform's steps.
Detection lives in `src/lib/pwa/platform.ts`.

### Android — Chrome / Edge / Samsung Internet (Chromium)
`beforeinstallprompt` fires and is captured by `install.ts`. The **Install**
button (banner, install page, settings) calls the native prompt. Outcome
(`accepted`/`dismissed`) is tracked.
Fallback (e.g. Firefox): menu → **Install app / Add to Home screen**.

### iPhone & iPad — Safari
No `beforeinstallprompt` on iOS. `IosInstallGuide` shows an animated 3-step
walkthrough: **Share → Add to Home Screen → Add**. In non-Safari iOS browsers we
prompt the user to reopen the page in Safari (only WebKit can install).

### Windows / macOS / Linux — Chrome / Edge
If the native prompt is available it's used. Otherwise the page shows
browser-specific steps:
- **Chrome:** install icon in the address bar (or ⋮ menu) → **Install Bean Circle**.
- **Edge:** ⋯ menu → **Apps** → **Install this site as an app**.
macOS Safari install (where supported) and other browsers fall back to the same
instructional guidance.

### Install detection
`isStandalone()` / `getDisplayMode()` detect installed/standalone launches (incl.
iOS's legacy `navigator.standalone`). All install prompts and the banner hide once
installed; a `standalone_launch` analytics event fires on standalone launches.

---

## 7. Smart install banner & CTA locations

`<InstallBanner />` (rendered by `PwaProvider`) is a floating, dismissible prompt
that appears only when: mounted · online · installable · **not** installed/
standalone · not recently dismissed · not on `/install`, `/login`, `/onboarding`
or `/auth`. Dismissal is persisted (`bc-pwa` localStorage) with a 7-day cooldown
(`BANNER_COOLDOWN_MS`).

Other CTAs:
- **Settings** → `<InstallCtaRow source="settings" />` (hidden once installed).
- **Install page** → primary hero CTA + per-platform instructions.
- Reusable `<InstallButton />` for anywhere else.

---

## 8. Analytics

`trackPwaEvent(event, props)` pushes to `window.dataLayer` (GTM/GA4) and dispatches
a `pwa:analytics` `CustomEvent` — no vendor lock-in, safe no-op until wired.
Every event carries platform context (`platform`, `browser`, `display_mode`,
`install_method`). Events:

`install_page_view`, `install_button_click`, `install_prompt_shown`,
`install_accepted`, `install_dismissed`, `install_completed`, `banner_shown`,
`banner_dismissed`, `standalone_launch`, `sw_registered`, `update_prompt_shown`,
`update_accepted`, `update_dismissed`, `online`, `offline`.

---

## 9. Accessibility

- Banner/toasts use `role="dialog"`/`role="status"` with `aria-live`, labelled
  controls, and visible focus states (the shared `Button` has focus rings).
- The iOS guide and platform switcher use `role="tab"`/`tablist` with
  `aria-selected` and are keyboard operable.
- All animations honour `prefers-reduced-motion`.
- Zoom is **not** disabled (no `maximum-scale` lock) per WCAG.
- Full RTL support: copy is translated in `messages/fa.json` and the app sets
  `dir="rtl"` for `fa`.

---

## 10. Testing & verification

```bash
nvm use 24
pnpm dev --experimental-https   # PWA install/SW require a secure context
```

- **Lighthouse** (Chrome DevTools → Lighthouse → *Installable* + PWA category).
- **Application tab** → Manifest (icons/screenshots), Service Workers
  (update/skip-waiting), Cache Storage (`bc-*-v…`).
- **Offline:** DevTools → Network → *Offline*, reload → `offline.html`; the offline
  toast appears in-app.
- **Update:** bump `CACHE_VERSION` in `public/sw.js`, deploy/reload → the update
  toast should appear; **Update** reloads into the new version.
- Quick endpoint smoke test: `GET /manifest.webmanifest`, `/sw.js` (note
  `Cache-Control: no-store` + `Service-Worker-Allowed: /`), `/offline.html`,
  `/<locale>/install`.

## 11. Maintenance

- **Rebrand / resize icons:** edit the master SVGs in
  `scripts/generate-pwa-assets.mjs` and re-run it.
- **Ship a SW change:** bump `CACHE_VERSION` so old caches are purged and the
  update prompt triggers.
- **New protected-but-shareable route:** add it to `PUBLIC_PATHS` in `src/proxy.ts`
  (as done for `/install`).
