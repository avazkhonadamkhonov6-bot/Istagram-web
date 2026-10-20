# PLAN — 4 ruz, 2 nafar

> Ruzi kor: **~10 soat** (09:00–20:00, bo tanaffus). Nafari **A** va nafari **B**.
> Tartib: **Ruzi 1–2 — Backend**, **Ruzi 3–4 — Frontend**.
> Har qadam = yak checkbox dar [PROGRESS.md](PROGRESS.md). Har subh va har shom — **sinxronizatsiya 15 daq.**

## Qoidahoi kori duyona

- **Git:** `main` — hamesha kor mekunad. Har kas dar branch: `feat/a-auth`, `feat/b-posts`... → Pull Request → digare review mekunad → merge.
- **Fayli umumi** (`schema.prisma`, `packages/shared`, `app.module.ts`) — **faqat yak nafar dar yak vaqt** tagyir medihad; pesh az tagyir — dar chat xabar dihed.
- **Spec — kontrakt:** agar A endpoint-ro tagyir dihad → avval spec, ba'd xabar ba B.
- Agar kor 2× az vaqti planshuda ziyod kashad → muhokima kuned: buridan ba P1 yo yori.

---

## RUZI 1 — Backend: poydevor, Auth, Users, Media, Posts

| Vaqt | A | B |
|---|---|---|
| 09:00–09:15 | 🤝 Sinxronizatsiya: plan va spec-horo yakjoya xondan | 🤝 |
| 09:15–11:00 | **Qadami 0:** `corepack enable`, monorepo (Turborepo + pnpm), kuchondani Next.js ba `apps/web`, `apps/api` (`nest new`, TS strict), `packages/shared` (Zod), ESLint/Prettier, **CI** (`.github/workflows/ci.yml`, Spec 11 §6) | **Qadami 0:** nasbi Docker Desktop, `docker-compose.yml` (PostgreSQL + **Redis** + MinIO + bucket, healthcheck-ho), `.env.example`, tekshirishi `.env` bo Zod (Spec 11 §2) |
| 11:00–12:30 | `schema.prisma` purra (Spec 00) → `prisma migrate dev` → `PrismaModule`, `ZodValidationPipe`, filter-i global-i xato (+ `requestId`), logger (pino), Swagger, `/health` | `infra/`: **RedisModule + `CacheService` (bo bypass)**, **QueueModule (BullMQ) + `worker.ts`**, `common/`: pagination, `@CurrentUser()`, kodhoi xato dar `shared` |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–16:00 | **Auth** (Spec 01): register, login (argon2, timing-safe), username-available, refresh (rotation + grace), logout, ws-ticket, me, `JwtAuthGuard` global + `@Public()`, throttler bo Redis | **Media** (Spec 03): S3 client, `POST /media/presign`, `assertOwnedKey`, `url()`; test bo curl ba MinIO |
| 16:00–18:30 | **Users** (Spec 02): profil, `PATCH /users/me` (bo yakxelagii username), password; **Follow**: follow/unfollow, followers/following | **Posts** (Spec 04): create (media + hashtag), get, patch, delete; **Like / Saved** idempotent (`skipDuplicates`), kesh-i post |
| 18:30–19:30 | e2e test: AC-hoi Auth (xususan AC2, AC3 — username-i takrori) | **Comment** + replies, delete |
| 19:30–20:00 | 🤝 Merge ba `main`, PROGRESS.md, chi monda → ruzi 2 | 🤝 |

**Natijai ruzi 1:** user ruyxat meshavad, vorid meshavad, profil, follow, post bo aks, like, comment, save — hama dar Swagger kor mekunand.

---

## RUZI 2 — Backend: Feed, Explore, Realtime, Stories, Reels, Direct, Notifications

| Vaqt | A | B |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–11:00 | **Feed** (Spec 05) + `isLiked/isSaved` bidun N+1; `GET /users/:u/posts`, `/saved`, `/reels` (grid) | **RealtimeGateway** (Socket.IO `/ws`, auth bo ws-ticket, **Redis adapter**, room `user:<id>`, `RealtimeService.emitToUser`); job `media.process-image` (sharp) |
| 11:00–12:30 | **Explore** + **Search** (users, hashtags, `/hashtags/:name/posts`) | **Stories** (Spec 06): create, tray, user stories, view, viewers, delete |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–15:30 | **Notifications** (Spec 09): event-ho → queue `notifications` → **worker** → DB + `notification:new`; REST; job-hoi `maintenance` (repeatable) | **Direct** (Spec 08): conversations, messages REST, read, unsend, unread-count |
| 15:30–17:00 | `GET /users/suggestions` (P1), **seed** (`db:seed`: 10 user, 50 post, story, chat) | Direct WebSocket: `message:new`, `typing`, `conversation:read`; **Reels** (Spec 07): `/reels`, view |
| 17:00–19:00 | e2e: feed, notifications; **testi bovarinoki** (Spec 11 AC3–AC5: Redis xomush, worker xomush, like-i parallel) | e2e: stories, direct (2 socket-client, `clientId`-i takrori) |
| 19:00–20:00 | 🤝 **Freeze-i API:** hamai endpoint-ho dar Swagger, tipho dar `packages/shared` purra. Az in lahza API faqat bo muhokima tagyir meyobad | 🤝 |

**Natijai ruzi 2:** backend-i purra. Frontend metavonad faqat bo spec va Swagger kor kunad.

---

## RUZI 3 — Frontend: poydevor, Auth, Feed, Post, Profil, Explore

| Vaqt | A | B |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–10:00 | Xondani `node_modules/next/dist/docs` (proxy, layouts, images) | hamon |
| 10:00–12:30 | Tokenhoi rang + dark mode (Spec 10 §1), **BFF**: `app/api/auth/*`, `app/api/[...path]` (cookie → header, refresh-i avtomati, timeout), `lib/api-client.ts` (Zod), TanStack Query, `proxy.ts` (+ CSP), Sentry | **shadcn/ui** init + tema bo ranghoi Instagram: Button, Input, Dialog, Dropdown, Sheet, Skeleton, Sonner; Avatar, StoryRing, Spinner; `error.tsx`/`loading.tsx` umumi; `lib/format.ts` |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–15:30 | **Layout**: Sidebar (245/72), bottom nav, top bar mobil; panel-hoi lagzanda (holi) | **Login / Signup** (Spec 01 + §4): ✓/✗ username, xatoho |
| 15:30–18:00 | **Feed**: `PostCard` (carousel, double-tap ❤, like/save optimistic, comment-i tez), infinite scroll, sutuni Suggested | **Profil**: header, counter-ho, Follow/Following, tab-ho, grid 3:4, followers/following modal; `/accounts/edit` (avatar upload), password |
| 18:00–19:30 | **Post modal** `/p/[id]` (intercepting route) + comment-ho, replies | **Explore** grid, hashtag page, **Search panel** (+ recent searches) |
| 19:30–20:00 | 🤝 Merge, tekshirish dar 3 andoza (1440 / 1000 / 390) | 🤝 |

---

## RUZI 4 — Frontend: Create, Stories, Reels, Direct, Notifications + yakun

| Vaqt | A | B |
|---|---|---|
| 09:00–09:15 | 🤝 | 🤝 |
| 09:15–11:30 | **Create modal**: intixob → crop → caption → upload (presign → PUT → POST /posts); reel va story-ro ham hamin modal | **Socket client** (`lib/socket.ts`, reconnect, ulash ba Query kesh) + **Notifications panel** (guruhbandi, Follow back, badge, toast) |
| 11:30–12:30 | **Stories tray** dar feed | **Direct inbox** |
| 12:30–13:30 | 🍽 | 🍽 |
| 13:30–15:30 | **Story viewer** (progress, tap, hold, useri badi, viewers baroi xud) | **Direct chat**: paymho, optimistic, typing, Seen, share post ba Direct, modali "New message" |
| 15:30–17:00 | **Reels** (scroll-snap, autoplay/pause, mute, like/comment/save) | Pardoz: Dark mode toggle, 404, holati xoli ("No posts yet"), Skeleton dar hama jo |
| 17:00–19:00 | 🧪 **Testi umumi**: AC-hoi spec 01–05 + Playwright (register, post, like) + Lighthouse | 🧪 AC-hoi spec 06–11 + Playwright (follow, direct) + testi qat'shavi (Redis, worker, internet) |
| 19:00–20:00 | README (chi guna ba kor andoxtan), PROGRESS.md-i yakuni, demo | 🤝 |

---

## Agar vaqt namerasad — chi buridan (tartibi qurboni)

1. Suggestions (P1) → ruyxati oddii populyarho
2. Versiyahoi WebP dar worker → originalro nishon dihem (job baroi tekshirishi tip memonad)
3. Playwright → tekshirishi dasti az ruyi AC
4. Virtualizatsiyai feed → infinite scroll-i oddi (limit 10)
5. Algoritmi populyari Reels → `createdAt DESC`
6. Typing va presence dar Direct
7. Crop dar Create → faqat 1:1 `object-cover`
8. Guruhbandii vaqt dar Notifications

**Hech vaqt nameburem:** yakxelagii username, tokenho dar httpOnly cookie, argon2, validatsiyai Zod, idempotentnost (like/follow/paym), transaction-hoi counter, filter-i xato, CI, kontrakti spec.

## Xavfho (risks)

| Xavf | Hal |
|---|---|
| Docker nasb nest / kor namekunad | Ruzi 1 subh avvalin kor; zaxira — PostgreSQL lokali + AWS S3 |
| Next.js 16 API-hoi nav | Ruzi 3 subh — xondani docs (dar plan hast) |
| Konflikt-i Git dar `schema.prisma` | Schema-ro ruzi 1 A yakbora purra menavisad |
| Redis + BullMQ + BFF vaqtro ziyod mekunand | Infra ruzi 1 subh yakbora sohta meshavad (B), modulho ba'd faqat `CacheService` va `queue.add()`-ro istifoda mebarand |
| Realtime dar production (CDN, proxy) | Lokali tekshirem; deploy — berun az 4 ruz |
