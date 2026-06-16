# Bean Circle — Trusted Web Activity (TWA) for Google Play

This document is the production runbook for shipping the existing Next.js PWA
(`beancircle.app`) to the Google Play Store as a **Trusted Web Activity** using
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). No native rewrite,
no extra frameworks — the TWA is a thin Android shell that renders the live PWA
full-screen (no address bar) via Chrome.

> **Why TWA works here:** the app already ships `manifest.webmanifest`
> (`display: standalone`, maskable icons, theme color `#1a0f0a`), a service
> worker (`/sw.js`) with an `/offline.html` fallback, and HTTPS in production.
> Those are exactly the prerequisites Play's TWA path requires.

---

## 0. Prerequisites (one-time)

| Tool | Required | Notes |
|------|----------|-------|
| Node.js | ≥ 18 (use **24**) | Shell default is v14 and breaks tooling. Run `nvm use 24` first. |
| JDK | 17+ | JDK 21 is installed here; Bubblewrap can also download its own. |
| Android SDK | auto | Bubblewrap downloads it on first `init` if missing. |

```bash
nvm use 24
npm install -g @bubblewrap/cli
bubblewrap doctor            # verifies JDK + Android SDK; offer to auto-install
```

If `doctor` complains about JDK/SDK paths, let Bubblewrap manage them:

```bash
bubblewrap updateConfig --jdkPath /path/to/jdk --androidSdkPath /path/to/sdk
```

---

## 1. Real project values (already extracted from this repo)

| Field | Value | Source |
|-------|-------|--------|
| App name | `Bean Circle — Coffee Social` | `src/app/manifest.ts` |
| Launcher name | `Bean Circle` | shortened for the home-screen label |
| Package name | `com.beancircle.app` | configurable; reverse-DNS of the domain |
| Domain / host | `beancircle.app` | hard-coded links in settings pages |
| Start URL | `https://beancircle.app/?source=twa` | `start_url: '/'` redirects to locale |
| Display | `standalone` | manifest |
| Orientation | `portrait` | manifest |
| Theme color | `#1a0f0a` | manifest `theme_color` |
| Background | `#ffffff` | manifest `background_color` |
| Icon (any) | `/icons/icon-512.png` | manifest |
| Icon (maskable) | `/icons/maskable-512.png` | used for the adaptive splash |
| Web Push | **yes** → `enableNotifications: true` | `public/sw.js` handles push |

These are baked into [`twa/twa-manifest.json`](../twa/twa-manifest.json) so you
can init **non-interactively** (next section).

---

## 2. Initialize the TWA project

A ready-made `twa-manifest.json` lives in [`twa/`](../twa/). Use it instead of
answering the interactive wizard:

```bash
cd twa
bubblewrap init --manifest=./twa-manifest.json
```

If you prefer the interactive wizard (`bubblewrap init --manifest=https://beancircle.app/manifest.webmanifest`),
answer the prompts like this:

| Prompt | Answer |
|--------|--------|
| Domain | `beancircle.app` |
| URL path | `/` |
| Application name | `Bean Circle — Coffee Social` |
| Short name | `Bean Circle` |
| Application ID (package) | `com.beancircle.app` |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Status bar color | `#1a0f0a` |
| Splash screen color | `#ffffff` |
| Icon URL | `https://beancircle.app/icons/icon-512.png` |
| Maskable icon URL | `https://beancircle.app/icons/maskable-512.png` |
| Include support for push? | **Yes** (the app uses Web Push) |
| Request geolocation? | No (web layer already prompts) |
| Signing key — create new? | **Yes** (first time) |
| Key store location | `./android.keystore` |
| Key alias | `beancircle` |

When it asks to create a keystore, it generates `android.keystore`. **Record the
keystore password and key password in your password manager.** Losing them means
you can never update the app on Play again.

### Create the keystore manually (recommended for control)

```bash
keytool -genkeypair -v \
  -keystore twa/android.keystore \
  -alias beancircle \
  -keyalg RSA -keysize 2048 -validity 9125 \
  -dname "CN=Bean Circle, O=Bean Circle, C=US"
# validity 9125 days = 25 years (Play requires the key valid past Oct 2033)
```

---

## 3. Build the signed AAB

```bash
cd twa
bubblewrap build
```

This produces:

- **`app-release-bundle.aab`** → upload this to Play (the requested deliverable)
- `app-release-signed.apk` → for local testing on a device
- `app-release-unsigned-aligned.apk` + `*.idsig`

Test the APK on a real device before uploading:

```bash
adb install -r app-release-signed.apk
```

When you change the web manifest or bump the version, edit
`twa/twa-manifest.json` (`appVersionCode` +1, `appVersionName`), then:

```bash
bubblewrap update      # re-syncs from twa-manifest.json
bubblewrap build
```

---

## 4. Digital Asset Links (the part that removes the URL bar)

The TWA only renders full-screen (no address bar) if `beancircle.app` publishes
a statement vouching for the app's signing certificate. This repo serves it
dynamically at **`/.well-known/assetlinks.json`** via
[`src/app/.well-known/assetlinks.json/route.ts`](../src/app/.well-known/assetlinks.json/route.ts).

### 4a. Get the SHA-256 fingerprint(s)

```bash
# Your upload/release keystore:
keytool -list -v -keystore twa/android.keystore -alias beancircle \
  | grep "SHA256:"
```

Bubblewrap also writes the upload fingerprint to `assetlinks.json` in the `twa/`
folder after build — you can copy it from there.

> **CRITICAL — Play App Signing.** New Play apps enrol in Play App Signing by
> default, meaning **Google re-signs your AAB with its own key**. The cert that
> ends up on user devices is Google's, *not* your upload key. After your first
> upload, copy the **"App signing key certificate" SHA-256** from
> **Play Console → your app → Setup → App integrity → App signing**, and add it
> alongside your upload fingerprint. List **both**.

### 4b. Publish the fingerprints

Set on Vercel (Project → Settings → Environment Variables), then redeploy:

```
ANDROID_PACKAGE_NAME=com.beancircle.app
ANDROID_ASSETLINKS_SHA256=AA:BB:...:upload,CC:DD:...:playsigning
```

(comma-separated, spaces tolerated). No code change needed to add Google's cert
later. Verify:

```bash
curl -s https://beancircle.app/.well-known/assetlinks.json | jq
```

Expected shape:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.beancircle.app",
      "sha256_cert_fingerprints": ["AA:BB:...", "CC:DD:..."]
    }
  }
]
```

Validate with Google's tester:
`https://developers.google.com/digital-asset-links/tools/generator`

---

## 5. Production rules — how each is satisfied

| Rule | How |
|------|-----|
| HTTPS only | Vercel serves `beancircle.app` over HTTPS; TWA refuses non-HTTPS origins. |
| Offline fallback | Existing `public/sw.js` precaches `/offline.html`; works inside the TWA's Chrome engine unchanged. |
| Don't break SPA / deep links | TWA loads the live site; Next.js App Router + next-intl handle routing. `assetlinks` covers the whole origin (`handle_all_urls`), so deep links open in-app. |
| All URLs open in-app | `scope: '/'` in the manifest + verified asset links keep same-origin navigation inside the TWA. Off-origin links open a Custom Tab (correct behavior). |
| Back button | Bubblewrap wires Android back → browser history `back()` automatically; at history root it exits the activity. No extra work. |

> **Note on the i18n middleware:** the matcher in `src/proxy.ts`
> (`/((?!_next|_vercel|.*\\..*).*)`) excludes any path containing a dot, so
> `/.well-known/assetlinks.json` bypasses locale rewriting and is served raw.

---

## 6. Common errors & fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| **Address bar still visible** in the installed app | assetlinks missing/mismatched fingerprint | Ensure `/.well-known/assetlinks.json` is reachable, returns `200 application/json`, and contains the **device** cert SHA-256. After Play App Signing, that's Google's cert — add it. |
| Works on sideloaded APK, URL bar on Play install | Only listed upload key, not Play signing key | Add the Play App Signing SHA-256 (step 4a). |
| `assetlinks` returns 404 | Route not deployed, or middleware rewrote it | Confirm the file deployed; confirm the dot-path is excluded by the middleware matcher; `curl` it. |
| `assetlinks` returns HTML / wrong content-type | Served by a catch-all/redirect | The provided route handler sets `application/json`; make sure no rewrite shadows `/.well-known/*`. |
| Chrome verification cached as failed | Asset links are cached aggressively | Reinstall the app, or `adb shell pm clear com.android.chrome`; wait a few minutes after fixing the file. |
| Redirect loop / wrong locale on launch | `start_url` redirects | Keep `startUrl` at `/?source=twa`; root redirects once to `/en` or `/fa`. Avoid pointing TWA at a locale that may 404. |
| `bubblewrap build` fails: JDK/SDK not found | Env not configured | `bubblewrap doctor`, then `bubblewrap updateConfig`. |
| Play rejects AAB: "key expires too early" | Keystore validity < 2033 | Recreate with `-validity 9125`. |
| Notifications don't arrive in the app | TWA notification delegation off | `enableNotifications: true` is set; also grant POST_NOTIFICATIONS at runtime (Android 13+) — the web push permission prompt drives this. |

---

## 7. Play Store deployment checklist

- [ ] `nvm use 24`, `npm i -g @bubblewrap/cli`, `bubblewrap doctor` green
- [ ] `android.keystore` created, **passwords stored in password manager + backed up**
- [ ] `bubblewrap build` produced `app-release-bundle.aab`
- [ ] APK tested on a physical device (`adb install`)
- [ ] Play Console app created, package `com.beancircle.app`
- [ ] AAB uploaded to **Internal testing** track first
- [ ] Play App Signing enrolled; **App signing SHA-256 copied** → added to env → redeployed
- [ ] `curl https://beancircle.app/.well-known/assetlinks.json` shows both fingerprints
- [ ] Installed the internal-testing build → **no address bar**, splash shows, offline page works
- [ ] Store listing: title, short/full description, screenshots (reuse `public/screenshots/*`), feature graphic, app icon (512×512 — use `icon-512.png`)
- [ ] Privacy Policy URL: `https://beancircle.app/privacy`
- [ ] Data safety form completed (account, location, messages, push)
- [ ] Content rating questionnaire submitted
- [ ] Target audience / ads / app category (Social) set
- [ ] Promote to Production after internal testing passes

---

## 8. Security checklist — asset links & signing

- [ ] Keystore is **git-ignored** (see `twa/.gitignore`) and backed up offline
- [ ] Keystore + key passwords stored only in a password manager (never in repo/CI logs)
- [ ] `assetlinks.json` lists **only** cert fingerprints you control (upload + Play signing) — no stray test keys
- [ ] `package_name` in `assetlinks.json` exactly equals `com.beancircle.app`
- [ ] `relation` is exactly `delegate_permission/common.handle_all_urls`
- [ ] Served over HTTPS with a valid cert, `200`, `application/json`, no redirect
- [ ] CI/secrets store holds Play upload credentials, not the repo
- [ ] Consider Play App Signing (Google holds the real signing key — safer than self-managing)

---

## 9. Debugging checklist for TWA failures

1. **Reproduce on device**, then connect Chrome DevTools:
   `chrome://inspect` → inspect the TWA's WebView/Chrome tab → check console/network.
2. **Asset links live check:**
   `curl -sI https://beancircle.app/.well-known/assetlinks.json` → expect `200` + `content-type: application/json`.
3. **Fingerprint match:** compare `keytool -list -v` output against what the
   device actually runs. On Play installs that's the **Play App Signing** cert.
4. **Statement list validator:**
   `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://beancircle.app&relation=delegate_permission/common.handle_all_urls`
5. **Clear Chrome state** if you fixed asset links but the URL bar persists:
   `adb shell pm clear com.android.chrome`, then relaunch.
6. **Manifest sanity:** `curl https://beancircle.app/manifest.webmanifest` →
   `start_url`, `scope`, icons all resolve `200`.
7. **Service worker / offline:** DevTools → Application → Service Workers; toggle
   offline, confirm `/offline.html` renders inside the TWA.
8. **Version bump issues:** every Play upload needs a higher `appVersionCode`;
   bump it in `twa/twa-manifest.json` → `bubblewrap update && bubblewrap build`.
```
