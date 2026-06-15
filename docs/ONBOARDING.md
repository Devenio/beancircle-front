# BeanCircle Onboarding — Design & Implementation

A premium, fully-skippable activation journey that turns first-run from "filling a
form" into "entering a café." This document is the single reference for the UX flow,
journey map, wireframes, UI + motion specs, frontend architecture, analytics, and the
database structure behind it.

> **North-star rules**
> - Every step has **Back / Skip / Continue**. Nothing is a dead end.
> - Once the username gate is cleared, an **"Enter BeanCircle"** escape hatch is always visible.
> - Progress **autosaves** server-side and resumes from **Settings → Finish setting up your circle**.
> - **Reduced-motion** and **RTL (en/fa)** are first-class.

---

## 1. UX flow

```
Login/OTP ─▶ needsOnboarding? ──no──▶ App (/feed)
                  │ yes
                  ▼
        /onboarding  (OnboardingShell state machine)
                  │
   ┌──────────────┴─────────────────────────────────────────────┐
   │ 1 Welcome (brand moment, GSAP)                               │  Skip ▶ Identity
   │ 2 Identity gate ★ username (mandatory; sets needsOnboarding=false)
   │ ── from here every step is skippable + "Enter BeanCircle" ──│
   │ 3 Interests     │ 4 Avatar  │ 5 Circle    │ 6 First Bean      │
   │ 7 Café (3D)     │ 8 First Sip badge │ 9 Profile │ 10 Invite   │
   └──────────────┬─────────────────────────────────────────────┘
                  ▼
         complete() → award FIRST_SIP → /feed
```

Exit paths from any post-gate step: **Continue** (mark completed), **Skip** (mark skipped),
**Back**, or **Enter BeanCircle** (mark abandoned → `/feed`). The last step's Continue/Skip
both call `complete()`.

## 2. User journey map

| Stage | User goal | Emotion target | Step | Friction removed |
|------|-----------|----------------|------|------------------|
| Arrive | "What is this?" | Delight, warmth | Welcome | 3–5 s cap, Skip always |
| Commit | "Claim my spot" | Low effort | Identity | one field (username) |
| Personalize | "Make it mine" | Agency | Interests, Avatar | 0-selection allowed |
| Connect | "Find my people" | Belonging | Circle | swipe/ignore, no obligation |
| Contribute | "Be seen" | Pride | First Bean | reuses real composer, draft/skip |
| Explore | "What's here?" | Curiosity | Café 3D | exploratory only |
| Reward | "I belong" | Celebration | First Sip | confetti + optional sound |
| Invest | "Be discoverable" | Progress | Profile | live completion %, all optional |
| Grow | "Bring a friend" | Generosity | Invite | QR + link + copy |

## 3. Wireframes (mobile, 430px shell)

```
┌───────────────────────────┐    Welcome              ┌───────────────────────────┐  Interests
│ ▰▱▱▱▱▱▱▱▱   [Enter ⇥]      │                         │ ▰▰▱▱▱▱▱▱▱   [Enter ⇥]      │
│        (cup + bean         │                         │  Help us personalize…     │
│         GSAP scene)        │                         │  ┌──┐┌──┐┌──┐  3×4 grid    │
│    Welcome to BeanCircle   │                         │  └──┘└──┘└──┘  glass cards │
│  Every coffee starts with… │                         │  ┌──┐┌──┐┌──┐  ✓ on select │
│      [Skip]   [Continue ▸] │                         │ [Back][Skip][Continue ▸]  │
└───────────────────────────┘                         └───────────────────────────┘

┌───────────────────────────┐  Avatar                 ┌───────────────────────────┐  Circle
│   (live BeanAvatar SVG)    │                         │   ◀ swipeable profile ▶    │
│   [⤨ Surprise me]          │                         │   avatar / name / @handle  │
│  ◀ Hair ▶   ◀ Glasses ▶    │                         │   • active now  • shared   │
│  ◀ Outfit ▶ ◀ Cup ▶ …      │                         │      ( ✕ )      ( ＋ )      │
│  [Save avatar]             │                         │ [Back][Skip][Continue ▸]   │
│  [Use default] [Skip]      │                         └───────────────────────────┘
└───────────────────────────┘

┌───────────────────────────┐  Café 3D                ┌───────────────────────────┐  First Sip
│   ╭─ R3F canvas ─╮         │                         │     ACHIEVEMENT UNLOCKED   │
│   │  tables+beans │ orbit  │                         │        (glowing badge)     │
│   │  tap → label  │        │                         │         First Sip          │
│   ╰───────────────╯        │                         │  You joined BeanCircle!    │
│ [Back][Skip][Explore ▸]    │                         │ [Back][Skip][ Nice! ▸]     │
└───────────────────────────┘                         └───────────────────────────┘

┌───────────────────────────┐  Profile                ┌───────────────────────────┐  Invite
│  ▰▰▰▱ 60% complete         │                         │      ▢▢ QR code ▢▢          │
│  [bio]                     │                         │   BEAN1234     [copy]       │
│  [favorite coffee]         │                         │   [ Share ]                 │
│  [city ▾][website][social] │                         │   +50 beans · badge · deco  │
│  ✓ benefit ✓ benefit       │                         │ [Back][Skip][ Done ▸]       │
│ [Back][Skip][Save ▸]       │                         └───────────────────────────┘
└───────────────────────────┘
```

## 4. UI design specifications

- **Surface**: espresso glassmorphism — `rounded-3xl border-white/10 bg-white/[0.06]
  backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]` over `AuthBackground`.
- **Palette** (from `globals.css`): crema `#f0b860`, crateau `#c8853c`, espresso `#1a0f0a`,
  mint `#7fcf9f`, rose `#e9a08a`. Primary CTA = `from-amber-400 to-orange-500`, text `#1a0f0a`.
- **Type**: Plus Jakarta Sans (latin) / Vazirmatn FD (fa). Titles `text-2xl font-bold`,
  hero `text-3xl font-black` + `.bc-gradient-text`.
- **Controls**: 48px primary button (pill), 44px tappable min, focus ring `amber-400/10`.
- **Components**: `OnboardingShell`, `StepFrame`, `OnboardingNav`, `OnboardingProgressBar`,
  `BeanAvatar`, `Confetti`, + 10 step components under `src/components/onboarding/`.
- **A11y**: `aria-live` step announcements, `aria-pressed` interest chips, `role="progressbar"`,
  logical properties + `rtl:rotate-180` icons, keyboard-operable controls.

## 5. Motion design specifications

| Step | Library | Motion | Timing / easing | Reduced-motion |
|------|---------|--------|-----------------|----------------|
| Shell transitions | Framer | x-slide + fade (directional) | 0.32 s `[0.22,1,0.36,1]` | crossfade, 0 s |
| Welcome | GSAP | bean fall→cup fill→steam→brand reveal | ~3.5 s; `bounce.out`, `back.out(1.7)` | jump to final frame |
| Progress bar | Framer | segment fill | 0.45 s ease-out | instant width |
| Interest select | Framer | `whileTap 0.92`, check pop-in | spring | no tap scale |
| Avatar | Framer | preview spring on change | `stiffness 300 / damping 20` | no scale |
| Circle | Framer | drag-to-decide, card fly-out | spring `280/26` | drag off, buttons only |
| First Bean | Canvas | confetti burst on publish | 130 frames | static scatter |
| First Sip | Framer | badge scale+rotate in, glow pulse | spring `200/12`, delay 0.15 | no rotate |
| Café | R3F | autoRotate + pointer parallax | `autoRotateSpeed 0.6` | (camera idle) |

## 6. Frontend implementation architecture

```
src/app/[locale]/(auth)/onboarding/page.tsx     → <OnboardingShell/>
src/components/onboarding/
  onboarding-shell.tsx      state machine: index, transitions, autosave, analytics, escape hatch
  step-frame.tsx            glass card + header
  onboarding-nav.tsx        Back / Skip / Continue (RTL-safe)
  onboarding-progress-bar.tsx
  bean-avatar.tsx           parametric SVG character + AVATAR_OPTIONS
  confetti.tsx              dependency-free canvas burst
  onboarding-resume-row.tsx Settings entry (renders if incomplete)
  steps/                    welcome, identity, interests, avatar, circle,
                            first-post, cafe(+cafe-scene), achievement, profile, invite
src/stores/onboarding-store.ts   zustand+persist draft (interests, avatar, follows, lastStep)
src/lib/api/onboarding.ts        typed client (+ mock handlers in lib/api/mock-handler.ts)
src/lib/onboarding/analytics.ts  event bus (dataLayer + CustomEvent + server mirror)
messages/{en,fa}.json            `onboarding` namespace (100 keys each)
```

Reuse: `BeanComposer` (first post), `GET /discover/suggestions` + `ProfileAvatar` (circle),
`GET /growth/referrals/me` (invite), `BeanLogo`, `AuthBackground`, R3F/drei conventions from
`radar-sphere-scene`. Heavy parts (`cafe-scene`) are `next/dynamic({ ssr:false })`.

## 7. Analytics events

Bus: `window.dataLayer.push(...)` + `CustomEvent('pwa:analytics')`; lifecycle events also
`POST /onboarding/events` for the server funnel table.

| Event | Props | Fired when |
|-------|-------|-----------|
| `onboarding_started` | — | shell mounts |
| `onboarding_step_viewed` | `step, index` | each step shown |
| `onboarding_step_completed` | `step, index, time_spent_ms` | Continue |
| `onboarding_step_skipped` | `step, index, time_spent_ms` | Skip |
| `onboarding_completed` | — | last step finished |
| `onboarding_abandoned` | `step, index` | "Enter BeanCircle" |

Derived metrics: **conversion** = completed / started; **per-step drop-off** from viewed vs
completed+skipped; **time spent** from `OnboardingProgress.stepTimings` + event `timeSpentMs`;
**profile completion %** from `GET /onboarding/me → completion.percent`.

## 8. Database structure (Prisma — `beancircle-api`)

```prisma
model OnboardingProgress {            // 1:1 User
  userId String @id
  currentStep String @default("welcome")
  completedSteps String[] @default([])
  skippedSteps   String[] @default([])
  stepTimings    Json     @default("{}")   // { stepKey: ms }
  startedAt DateTime @default(now())
  lastActiveAt DateTime @default(now())
  completedAt DateTime?
}

model BeanAvatar {                    // 1:1 User — discrete option keys, client renders SVG
  userId String @id
  bg skin hair glasses beard outfit accessory coffeeCup  // String defaults
  isDefault Boolean @default(true)
}

model OnboardingEvent {               // append-only funnel
  id String @id; userId String; step String; type String   // viewed|skipped|completed
  timeSpentMs Int?; createdAt DateTime @default(now())
  @@index([userId, step]) @@index([step, type]) @@index([createdAt])
}

// Extended: enum InterestSlug += PROGRAMMING DESIGN BOOKS CRYPTO TRADING PHOTOGRAPHY TRAVEL
// Extended: enum BadgeCode    += FIRST_SIP (seeded BadgeDefinition)
// Added to User: favoriteCoffee String?, website String?, socialLinks Json?
```

Endpoints (`OnboardingController`, JWT-guarded): `GET/PATCH /onboarding/me`,
`POST /onboarding/complete`, `PUT /onboarding/interests`, `GET/PUT /onboarding/avatar`,
`POST /onboarding/events`. Interests reuse `UserInterest`; invite reuses `Referral`/growth;
first post reuses `Bean`; the badge reuses `BadgeDefinition`/`UserBadge`.

## 9. Responsive layouts

- **Mobile (default)**: single glass card, `max-w-md`, 430px app shell, safe-area padding,
  3-column interest grid, full-width CTAs, 64px 3D viewport height.
- **Tablet/Desktop**: same centered card (caps at `max-w-md`) on the full-bleed
  `AuthBackground`; pointer hover states on cards/nav; café gains pointer-parallax. Progress
  bar + escape hatch pinned to a top bar. No layout breaks 320 → 1440px.
- **RTL**: `dir=rtl` mirrors progress fill, nav arrows (`rtl:rotate-180`), and the escape
  hatch; Vazirmatn FD renders Persian.
```
