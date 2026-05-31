# Bean Circle Front

Next.js 16 mobile-first client for Cafe Community.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS
- next-intl (fa/en, RTL for Persian)
- TanStack Query, Zustand, Socket.IO client

## Quick start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000/fa` (default locale) or `/en`.

Ensure [beancircle-api](../beancircle-api) is running on port 3001.

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
