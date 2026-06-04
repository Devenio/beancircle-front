# Settings Module Audit Report

**Date:** 2026-06-05  
**Scope:** `beancircle-front` settings UI + `beancircle-api` settings module  
**Goal:** 100% parity between visible settings, backend persistence, and automated tests.

---

## Executive summary

| Area | Status |
|------|--------|
| Database schema (`UserSettings` + `User.showLastSeen`) | Implemented |
| REST API (`/settings`, blocked, muted, sessions) | Implemented |
| Frontend API wiring (`useSettingsApi`) | Implemented for preference toggles |
| Settings applied in app runtime | **Partial** — only `showLastSeen` enforced server-side |
| Theme (light/dark/system) | **UI only** — `next-themes` local storage, not in API |
| Account profile fields | Separate `/users/me` PATCH |
| Automated API unit tests | Added (`settings.service.spec.ts`) |
| Automated API HTTP tests | Added (`settings.http-spec.ts`) |
| DB integration tests | Added (`settings.integration-spec.ts`, requires `DATABASE_URL`) |
| Playwright E2E | Added (`e2e/settings.spec.ts`, requires running API + front) |

**Parity score (API-backed UI fields):** 22/22 fields persisted — **100%**  
**Parity score (including UI-only / non-functional rows):** ~75% — see sections below.

---

## 1. Implemented settings (full stack)

These appear in the UI, are saved via `PATCH /settings`, stored in `UserSettings` (or `User.showLastSeen`), and are covered by tests.

| Setting | DB column / table | API | UI screen | Default |
|---------|-------------------|-----|-----------|---------|
| Last seen visibility | `UserSettings.lastSeenVisibility` + syncs `User.showLastSeen` | Yes | Privacy | `everyone` |
| Online status visibility | `UserSettings.onlineStatusVisibility` | Yes | Privacy | `everyone` |
| Profile visibility | `UserSettings.profileVisibility` | Yes | Privacy | `everyone` |
| Read receipts | `UserSettings.readReceipts` | Yes | Privacy, Chat | `true` |
| Push notifications | `UserSettings.pushNotifications` | Yes | Notifications | `true` |
| Message notifications | `UserSettings.messageNotifications` | Yes | Notifications | `true` |
| Mention notifications | `UserSettings.mentionNotifications` | Yes | Notifications | `true` |
| Group notifications | `UserSettings.groupNotifications` | Yes | Notifications | `true` |
| Marketing notifications | `UserSettings.marketingNotifications` | Yes | Notifications | `false` |
| Email notifications | `UserSettings.emailNotifications` | Yes | Notifications | `true` |
| Notification sound | `UserSettings.notificationSound` | Yes | Notifications | `true` |
| Notification vibration | `UserSettings.notificationVibration` | Yes | Notifications | `true` |
| Accent color | `UserSettings.accentColor` | Yes | Appearance | bean green |
| Font size | `UserSettings.fontSize` | Yes | Appearance | `medium` |
| Message density | `UserSettings.messageDensity` | Yes | Appearance | `comfortable` |
| Chat wallpaper | `UserSettings.chatWallpaper` | Yes | Appearance | `default` |
| Auto-download media | `UserSettings.autoDownloadMedia` | Yes | Chat | `wifi` |
| Media quality | `UserSettings.mediaQuality` | Yes | Chat | `high` |
| Save drafts | `UserSettings.saveDrafts` | Yes | Chat | `true` |
| Link previews | `UserSettings.linkPreviews` | Yes | Chat | `true` |
| Typing indicators | `UserSettings.typingIndicators` | Yes | Chat | `true` |
| Auto cleanup days | `UserSettings.autoCleanupDays` | Yes | Storage | `30` |

**Migration:** `prisma/migrations/20260605120000_user_settings_sessions/migration.sql`

**Validation:** `UpdateSettingsDto` — `@IsIn`, `@IsBoolean`, `@Min(7)` `@Max(365)` for cleanup days, `@MaxLength` on strings.

**Authorization:** All `/settings/*` routes require JWT (`JwtAuthGuard` global); user can only access own `userId` from token.

---

## 2. Partially implemented settings

| Feature | What works | What's missing |
|---------|------------|----------------|
| **Last seen** | `lastSeenVisibility` stored; `nobody` sets `User.showLastSeen=false`; `getPresence` respects `showLastSeen` | `contacts` visibility not enforced; `lastSeenVisibility` alone doesn't gate online status |
| **Online status visibility** | Persisted in DB | Not read by `getPresence` or realtime — always shows online if connected |
| **Profile visibility** | Persisted in DB | `getByUsername` does not filter by visibility level |
| **Read receipts** | Persisted in DB | Chat does not hide read state based on setting |
| **Typing indicators** | Persisted in DB | Realtime gateway does not check before emitting typing events |
| **Notification toggles** | Persisted in DB | Notification service does not filter by `pushNotifications` / per-type flags |
| **Appearance** | `accentColor` / `fontSize` applied to `document.documentElement` on load | `messageDensity`, `chatWallpaper` not used in chat UI |
| **Auto-download / media quality** | Persisted | Not used in media upload/download flows |
| **Storage** | Local cache estimate + `autoCleanupDays` in DB | Clear cache is client-only; no server storage metrics |
| **Blocked users** | `GET /settings/blocked`, unblock via `DELETE /users/:id/block` | Block only from chat/profile, not from settings list action |
| **Muted users** | `GET /settings/muted` | Mute only from chat; no unmute in settings |
| **Sessions** | `GET /settings/sessions`, `DELETE /settings/sessions/:id` | Password change, 2FA, login history — UI placeholders only |

---

## 3. Missing backend implementations (UI shows, no real backend)

| UI item | Recommendation |
|---------|----------------|
| **Theme (Light/Dark/System)** | Keep client-only (`next-themes`) OR add `theme` to `UserSettings` and sync on login |
| **Change password** | Implement `POST /auth/change-password` or remove row until ready |
| **Two-factor authentication** | Implement TOTP flow or hide behind feature flag |
| **Login history** | Aggregate `RefreshToken` / audit log endpoint |
| **Help / legal links** | External URLs — OK as-is |
| **Connected accounts (Google)** | OAuth exists; connect/disconnect endpoints missing |
| **Gift coffee / referral / admin links** | Navigation only — not settings |

---

## 4. Broken or unused integrations

| Issue | Severity |
|-------|----------|
| `settings-store.ts` (Zustand persist) still exists but **unused** by settings pages — dead code risk | Low |
| `onlineStatusVisibility` stored but never enforced | Medium |
| `profileVisibility` stored but never enforced | Medium |
| `readReceipts` / `typingIndicators` not wired to chat | Medium |
| Theme stored only in browser, not API — user expectation mismatch on new device | Medium |
| Old e2e `app.e2e-spec.ts` expects `Hello World` — unrelated broken test | Low |

---

## 5. Database schema review

### `UserSettings` (1:1 with `User`)

- Primary key: `userId`
- Enums: `VisibilityLevel`, `FontSizeLevel`, `MessageDensityLevel`, `AutoDownloadMode`, `MediaQualityLevel`
- Sensible defaults aligned with `SETTINGS_DEFAULTS` in `settings.constants.ts`

### `User.showLastSeen`

- Legacy boolean; synced when `lastSeenVisibility === 'nobody'` or `showLastSeen` PATCH
- Used by `UsersService.getPresence`

### `RefreshToken` session metadata

- `deviceName`, `browser`, `os`, `ipAddress`, `userAgent`, `lastUsedAt`
- Populated on token issue; used by `GET /settings/sessions`

### Related tables (not in UserSettings)

- `UserBlock` — block list
- `ConversationMember.muted` — mute list
- `User` profile — `PATCH /users/me` for name, username, bio

---

## 6. API endpoints

| Method | Path | Auth | Tests |
|--------|------|------|-------|
| GET | `/api/v1/settings` | JWT | unit, http, integration, e2e |
| PATCH | `/api/v1/settings` | JWT | unit, http, integration, e2e |
| GET | `/api/v1/settings/blocked` | JWT | http |
| GET | `/api/v1/settings/muted` | JWT | http |
| GET | `/api/v1/settings/sessions` | JWT | http, unit |
| DELETE | `/api/v1/settings/sessions/:id` | JWT | http, unit |

---

## 7. Test suites added (verified locally)

| Suite | Command | Result |
|-------|---------|--------|
| Unit | `pnpm test:settings:unit` | 7 passed |
| HTTP (mocked) | `pnpm test:settings:http` | 9 passed |
| Integration (DB) | `DATABASE_URL=... pnpm prisma migrate deploy && pnpm test:settings:integration` | Requires `UserSettings` table |
| E2E | `pnpm test:e2e:settings` | Requires Node ≥24.11, API + front running, seed user |

## 7b. Test suites — how to run

### API (`beancircle-api`)

```bash
pnpm test:settings:unit          # SettingsService mocks
pnpm test:settings               # HTTP + integration (integration needs DATABASE_URL)
DATABASE_URL=... pnpm test:settings  # includes DB persistence tests
```

### E2E (`beancircle-front`)

```bash
pnpm install
pnpm exec playwright install chromium
# Start API (mock SMS) + front, then:
pnpm test:e2e:settings
```

Env vars:

- `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`)
- `PLAYWRIGHT_API_URL` (default `http://localhost:3001/api/v1`)
- `PLAYWRIGHT_TEST_PHONE` (default `+989120000000` from seed)
- `PLAYWRIGHT_SKIP_WEBSERVER=1` if servers already running

---

## 8. Recommended missing settings (modern social apps)

### Privacy (high priority)

- Who can message me
- Who can tag / mention me
- Who can see my followers / following
- Hide story / activity status (if applicable)

### Notifications

- Mute all / quiet hours (Do Not Disturb schedule)
- Notification preview on lock screen
- Per-channel email digest frequency

### Security & account

- Two-factor authentication (TOTP)
- Login alerts (new device email/push)
- Download my data (GDPR export)
- Deactivate / delete account

### Personalization

- Reduce motion (accessibility) — sync with `prefers-reduced-motion` + setting
- Theme in API for cross-device sync

### Chat

- Archive all chats
- Enter to send vs newline

---

## 9. Action plan for 100% parity

1. **Enforce** `onlineStatusVisibility` and `profileVisibility` in `getPresence` / `getByUsername`.
2. **Wire** `readReceipts`, `typingIndicators`, `linkPreviews` in `chat.service` + realtime gateway.
3. **Wire** notification creation to respect `UserSettings` flags.
4. **Apply** `messageDensity`, `chatWallpaper` in chat components (CSS variables).
5. **Remove or implement** password, 2FA, login history rows.
6. **Decide** on theme: document as device-local OR add to `UserSettings`.
7. **Delete** unused `settings-store.ts` persist layer or use only for offline cache of API response.
8. **Run** integration + Playwright in CI with test DB and seeded user.

---

## 10. Verification checklist

- [x] Every `PATCH /settings` field has DB column and default
- [x] DTO validation for invalid enums and bounds
- [x] JWT required on all settings routes
- [x] Frontend uses API for toggles on privacy, notifications, appearance, chat, storage
- [ ] Every stored setting affects app behavior (partial — see §2)
- [x] Unit + HTTP tests committed
- [x] Integration tests (opt-in with `DATABASE_URL`)
- [x] Playwright E2E tests committed (require live stack)
