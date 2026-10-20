# PLAN — 4 ruz, 2 nafar: Avaz va Abubakr

> Ruzi kor: **~10 soat** (09:00–20:00, bo tanaffus).
> **Avaz** — avval **backend** (Ruzi 1 → Ruzi 3 to 14:00), ba'd **frontend**.
> **Abubakr** — az ruzi avval **frontend** bo **ma'lumoti mock**, ba'd ulanish ba API-i voqe'i.
> Vazifahoi alohida bo ID — dar [TASKS.md](TASKS.md) va dar **GitHub Issues** (milestone: Ruzi 1–4).

## Chiro hamin xel taqsim kardem

```
Ruz:        1                 2                 3                 4
Avaz:    [Setup+Kontrakt][===== BACKEND =====][BE ▶ BFF][== FRONT: Direct, Realtime, Test ==]
Abubakr: [UI+Mock ======][== FRONT (mock) ==][Integratsiya][== FRONT: Create, Reels, Pardoz ==]
                    ▲                                ▲
       12:30 — kontrakt (Zod) push         Ruzi 3, 14:00 — mock xomush, API-i voqe'i
```

- **SDD** imkon medihad ki front va back **parallel** kor kunand: spec → Zod schema dar `packages/shared` → Avaz API-ro tibqi on menavisad, Abubakr mock-ro tibqi on mesozad. Ruzi 3 mock-ro xomush mekunem — hama boyad mos oyad.
- **Mock:** MSW (Mock Service Worker) dar `apps/web/src/mocks/` darxosthoi `/api/*`-ro dar brauzer dastgir mekunad. Xomush kardan — `NEXT_PUBLIC_API_MOCKING=off`. Kodi komponentho **tagyir nameyobad**.

## Qoidahoi kori duyona

| Qoida | Tafsilot |
|---|---|
| Kujo ki menavisad | **Avaz:** `apps/api`, `packages/shared`, `docker-compose.yml`, `.github/`, `apps/web/src/app/api/` (BFF, Ruzi 3). **Abubakr:** `apps/web` (gayr az `app/api/`) |
| `packages/shared` | Faqat **Avaz** tagyir medihad. Agar Abubakr maydoni nav lozim donad → comment dar Issue → Avaz ilova mekunad |
| Branch | `feat/be-auth`, `feat/fe-feed`... → PR ba `main` → digare review (5 daq.) → merge. Dar PR — **"Closes #<issue>"** |
| Sinxronizatsiya | Har ruz **09:00** va **19:30** — 15 daq.: chi tayyor, chi monda, masalaho |
| Agar spec galat ast | Avval spec islah → xabar ba hamroh → ba'd kod |
| Agar kor 2× ziyod kashad | Darhol xabar dihed → buridan (ruyxati poyon) yo yori |

---

## RUZI 1

| Vaqt | 🟦 Avaz (backend) | 🟩 Abubakr (frontend) |
|---|---|---|
| 09:00–09:15 | 🤝 Sinxronizatsiya, xondani TZ va PLAN | 🤝 |
| 09:15–10:30 | **BE-01** Monorepo: Turborepo + pnpm, kuchondani Next ba `apps/web`, `nest new apps/api`, `packages/shared`, TS strict, ESLint/Prettier → **push** | **FE-01** Nasbi pnpm, xondani `node_modules/next/dist/docs` (proxy, layouts, images, fonts), omuzishi Instagram-i veb |
| 10:30–12:30 | **BE-02** 📜 **Kontrakt:** Zod schema-hoi hamai request/response az spec 01–09 dar `packages/shared` + kodhoi xato → **push 12:30** | **FE-02** Tokenhoi rang + dark mode (Spec 10 §1), shriftho, `globals.css`, **shadcn/ui** init bo ranghoi Instagram |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–15:30 | **BE-03** Docker (Postgres + Redis + MinIO), `.env` + Zod, Prisma schema → migrate, infra (Prisma, Redis+Cache, Queue+worker, logger, filter-i xato, health, Swagger), **CI** | **FE-03** Komponenthoi UI: Button, Input, Avatar, StoryRing, Dialog, Dropdown, Sheet, Skeleton, Spinner, Toast, ikonkaho; `lib/format.ts` |
| 15:30–18:00 | **BE-04** **Auth** (Spec 01): register (username-i yakxela!), login, refresh, logout, ws-ticket, me, guard, throttler | **FE-04** **MSW mock**: setup, factory-hoi ma'lumot az schema-hoi `shared` (`@faker-js/faker`), handler-ho baroi auth, users, posts, feed |
| 18:00–19:30 | **BE-05** **Users + Follow** (Spec 02) | **FE-05** **Layout**: Sidebar 245/72, bottom nav + top bar-i mobil, panel-hoi lagzanda (holi) |
| 19:30–20:00 | 🤝 PR-ho → merge, PROGRESS | 🤝 |

**Natija:** monorepo + kontrakt dar `main`. Backend: auth va profil. Frontend: dizayn-sistema, layout, mock.

---

## RUZI 2

| Vaqt | 🟦 Avaz (backend) | 🟩 Abubakr (frontend, mock) |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–11:00 | **BE-06** **Media** (Spec 03): presign, `assertOwnedKey`, job `process-image` | **FE-06** **Login / Signup** (✓/✗ username, xatoho, holati disabled) |
| 11:00–13:00 | **BE-07** **Posts + Like + Comment + Saved** (Spec 04), idempotent, kesh | **FE-07** **Feed + PostCard**: carousel, double-tap ❤, like/save optimistic + rollback, comment-i tez, infinite scroll, Suggested |
| 13:00–14:00 | 🍽 | 🍽 |
| 14:00–16:00 | **BE-08** **Feed, Explore, Search, Hashtag** (Spec 05) | **FE-08** **Post modal** `/p/[id]` (intercepting route) + comment-ho, replies |
| 16:00–18:00 | **BE-09** **RealtimeGateway** (Redis adapter) + **Notifications** (event → queue → worker → socket) | **FE-09** **Profil**: header, counter-ho, Follow, tab-ho, grid 3:4, followers/following modal |
| 18:00–19:30 | **BE-10** **Stories** (Spec 06) | **FE-10** `/accounts/edit` (avatar), `/accounts/password` |
| 19:30–20:00 | 🤝 | 🤝 |

---

## RUZI 3 — Ruzi ulanish

| Vaqt | 🟦 Avaz | 🟩 Abubakr |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–11:30 | **BE-11** **Direct** REST + WebSocket (Spec 08) + **Reels** (Spec 07) | **FE-11** **Explore** grid, hashtag page, **Search panel** + recent |
| 11:30–13:00 | **BE-12** **Seed** + e2e + testi bovarinoki (Spec 11) → 🔒 **API freeze** | **FE-12** **Notifications panel** (UI bo mock: guruhbandi, Follow back) |
| 13:00–14:00 | 🍽 | 🍽 |
| 14:00–16:00 | **FE-13** **BFF**: `app/api/auth/*`, `app/api/[...path]`, `realtime/ticket`, `proxy.ts` + CSP, Sentry | **FE-14** **Mock xomush** → har sahifaro bo API-i voqe'i tekshirad, har farq → Issue |
| 16:00–17:00 | 🔧 Islohi farqhoi API ↔ front (yakjoya) | 🔧 |
| 17:00–19:30 | **FE-15** **Socket client** (reconnect + refetch) + notifications realtime (badge, toast) | **FE-16** **Stories tray + viewer** (progress, tap, hold, viewers) |
| 19:30–20:00 | 🤝 | 🤝 |

**Muhim:** az 14:00 Avaz **dar frontend** ast. Agar backend hanuz tamom nashuda boshad — Avaz to 16:00 backend-ro tamom mekunad, Abubakr bo mock idoma medihad.

---

## RUZI 4 — Har du dar frontend

| Vaqt | 🟦 Avaz | 🟩 Abubakr |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–12:30 | **FE-17** **Direct**: inbox, chat, optimistic + `clientId`, typing, Seen, "New message", share post | **FE-18** **Create modal**: intixob → crop → caption → upload (presign → PUT → POST); post, reel, story |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–15:30 | **FE-19** Error boundaries, `error.tsx`, offline banner, virtualizatsiyai feed | **FE-20** **Reels** (scroll-snap, autoplay/pause, mute, like/comment/save) |
| 15:30–17:00 | **FE-21** Playwright: register, post, like, follow, direct | **FE-22** Pardoz: dark toggle, 404, holati xoli, skeleton-ho, tekshirish dar 1440 / 1000 / 390 |
| 17:00–19:00 | 🧪 **QA-01** AC-hoi spec 01, 05, 08, 09, 11 + testi qat'shavi (Redis, worker, internet) | 🧪 **QA-02** AC-hoi spec 02, 03, 04, 06, 07, 10 + Lighthouse |
| 19:00–20:00 | README, `git tag v0.2`, demo 🎯 | PROGRESS / ROADMAP-i yakuni |

---

## Agar vaqt namerasad — chi buridan (tartib)

1. Suggestions (P1) → ruyxati oddii populyarho
2. Versiyahoi WebP dar worker → original (tekshirishi tip memonad)
3. Playwright → tekshirishi dasti az ruyi AC
4. Virtualizatsiyai feed → infinite scroll-i oddi
5. Algoritmi populyari Reels → `createdAt DESC`
6. Typing va presence dar Direct
7. Crop dar Create → faqat 1:1 `object-cover`
8. Guruhbandii vaqt dar Notifications

**Hech vaqt nameburem:** yakxelagii username, tokenho dar httpOnly cookie, argon2, validatsiyai Zod, idempotentnost, transaction-hoi counter, filter-i xato, CI, kontrakti spec.

## Xavfho

| Xavf | Hal |
|---|---|
| Avaz backend-ro tanho to Ruzi 3 tamom nakunad | Kontrakt Ruzi 1 tayyor ast → Abubakr hech vaqt intizor nest. Buridan az ruyxati bolo. Dar holati zarur Abubakr Reels-i backend-ro megirad (sodatarin modul) |
| Mock va API-i voqe'i farq kunand | Har du az yak Zod schema (`shared`) sohta meshavand; Ruzi 3 14:00–17:00 baroi islohi farqho |
| Docker kor namekunad | Ruzi 1 13:30 avvalin kor; zaxira — Postgres + Memurai lokali |
| Konflikti Git | Papkahoi alohida (jadvali bolo); `shared` — faqat Avaz |
| Next.js 16 API-hoi nav | FE-01 — xondani docs |
