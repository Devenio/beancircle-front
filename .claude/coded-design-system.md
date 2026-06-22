# Coded design system (menu & welcome) — frontend side

Hand-coded React designs for the public **menu** and **welcome** screen,
selectable per cafe. The API owns access control + the metadata registry; this
side owns the actual components. See
`beancircle-api/.claude/coded-design-system.md` for the backend half.

## How it renders

- API `GET /menus/public/:slug` returns the data PLUS resolved
  `menuDesignKey` / `welcomeDesignKey` (already access-checked, with default
  fallback applied server-side).
- `src/app/[locale]/m/[slug]/page.tsx` renders
  `<PublicDesignedView>` (`src/components/designs/public-designed-view.tsx`),
  which composes the selected **welcome** design (top) + **menu** design (body),
  sharing one theme background and a scroll-to-menu handler.

## Key files

- `src/components/designs/registry.tsx` — maps each `key` →
  React component (`MENU_DESIGNS`, `WELCOME_DESIGNS`) and resolves with a
  default fallback (`resolveMenuDesign` / `resolveWelcomeDesign`). Keys MUST
  match the API registry.
- `src/components/designs/slots/` — the design components:
  - menu: `classic-menu.tsx` (default), `editorial-menu.tsx`
  - welcome: `classic-welcome.tsx` (default), `spotlight-welcome.tsx`
  - `shared.ts` — `formatPrice`, `discountPercent`, `heroImageFor`.
- `src/components/designs/public-designed-view.tsx` — composition host.
- `src/lib/api/designs.ts` — typed API client (admin + cafe endpoints).
- Admin UI: `src/app/[locale]/admin/designs/page.tsx` (also in admin nav).
- Cafe owner UI: `src/components/cafe-os/menu/cafe-design-picker.tsx`, mounted
  in the "design" tab of `.../cafe-os/[cafeId]/menu/page.tsx`.

## Component contracts

- Menu design: `({ menu, locale, labels, onItemView }: MenuDesignProps)` —
  renders the menu body only (no hero; the welcome design owns the hero).
- Welcome design: `({ menu, locale, labels, onViewMenu }: WelcomeDesignProps)` —
  renders the welcome/landing splash; call `onViewMenu()` to scroll to the menu.

Reuse `resolveTheme()` + `FONT_STACKS` from `@/components/cafe-menu/themes` so a
design honors the cafe's theme/accent.

## How to add a new design (frontend side)

1. Create the component in `src/components/designs/slots/<your-design>.tsx`
   following the contract above.
2. Register it in `registry.tsx` under its `key` in `MENU_DESIGNS` or
   `WELCOME_DESIGNS`.
3. Add the matching entry in the API's `design-registry.ts` (same `key`).

The resolver always falls back to the default, so an unmapped/unknown key can
never break the page. The legacy `public-menu-view.tsx` (combined splash+body)
still exists and is used by the cafe-os designer preview — leave it in place.

## Cafe picker behavior

`CafeDesignPicker` shows ONLY designs the admin whitelisted (plus the default).
It highlights the **resolved** key (what actually renders), so after an admin
revokes a pick the owner sees the fallback state with a notice, while their
stored choice is preserved server-side.
