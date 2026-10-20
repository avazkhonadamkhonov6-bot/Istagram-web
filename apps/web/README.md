# apps/web — Next.js 16

**Ma'sul:** Abubakr (hama, gayr az `src/app/api/`) · Avaz (`src/app/api/` — BFF, az Ruzi 3) · **Port:** 3000

> Next.js 16 tagyirothoi kalon dorad. Pesh az kod: `node_modules/next/dist/docs/` (FE-01). Fayli `AGENTS.md` dar hamin papka.

## Struktura

```
apps/web/
├─ public/
├─ e2e/                          Playwright (FE-21)
└─ src/
   ├─ app/
   │  ├─ (auth)/login, signup                    FE-06
   │  ├─ (main)/layout.tsx                       FE-05 — sidebar, bottom nav
   │  ├─ (main)/page.tsx                         FE-07 — feed
   │  ├─ (main)/explore, explore/tags/[tag]      FE-11
   │  ├─ (main)/reels                            FE-20
   │  ├─ (main)/direct/inbox, direct/t/[id]      FE-17
   │  ├─ (main)/p/[id], @modal/(.)p/[id]         FE-08
   │  ├─ (main)/[username], accounts/*           FE-09, FE-10
   │  ├─ stories/[username]                      FE-16
   │  └─ api/                                    BFF — Avaz (FE-13)
   ├─ components/ui/             shadcn/ui + komponenthoi umumi (FE-02, FE-03)
   ├─ features/                  har funksiya: api.ts, hooks.ts, components/
   │  ├─ auth/  feed/  posts/  profile/  explore/  search/
   │  ├─ stories/  reels/  direct/  notifications/  create/
   ├─ lib/                       format, query-client, api-client, socket
   ├─ mocks/                     MSW (FE-04), handlers/ — xomush: NEXT_PUBLIC_API_MOCKING=off
   └─ store/                     Zustand — faqat holati UI
```

Import: `@/…` = `src/…` (`tsconfig.json`).

## Qoidaho
- Rangho faqat az tokenho (Spec 10 §1), rangi hardcode nest.
- Ikonkaho — faqat SVG (`lucide-react`), **emoji istifoda nabared**.
- Ma'lumot faqat tavassuti `/api/*` (BFF yo mock). Tipho — az `@repo/shared`.
