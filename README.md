# Bean Circle Front

Next.js 16 mobile-first client for Cafe Community.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS
- next-intl (fa/en, RTL for Persian)
- TanStack Query, Zustand, Socket.IO client

## Quick start

From the API repo (starts Docker, API, and this app together):

```bash
cd ../beancircle-api
nvm use
npm run dev:local:setup   # first time
npm run dev:local         # later runs
```

Or front only (API must already be running on port 3001):

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

## Routes

| Path | Screen |
|------|--------|
| `/login` | Phone OTP + Google |
| `/onboarding` | Username, city |
| `/` | Home feed |
| `/explore` | Search |
| `/create` | New post |
| `/messages` | Inbox |
| `/profile` | Your profile |
| `/cafe/[id]` | Cafe detail |
| `/gift` | Gift coffee |
| `/settings` | Language, logout |
| `/admin` | Admin panel (ADMIN role) |
