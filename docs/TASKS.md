# TASKS — Vazifaho baroi Avaz va Abubakr

> Har vazifa dar GitHub **Issue**-i alohida ast (milestone = ruz, label = `backend` / `frontend` / `qa` va nomi odam).
> **Holat (2026-10-21):** hamai vazifahoi Avaz tayyor — `[x]` tayyor va sanjida shud, `[-]` buridashud (sabab navishta shud). Tafsilot: [PROGRESS.md](PROGRESS.md), [qa/QA-01.md](qa/QA-01.md).
> **Kontrakti API (az 2026-10-21):** [specs/12-api-kontrakt.md](specs/12-api-kontrakt.md) — URL va DTO-ho az onjo, ne az spec-hoi 01–09.
> Tartib va vaqt — dar [PLAN.md](PLAN.md). Pas az tamom: PR bo `Closes #<issue>` → Issue xud baste meshavad.

| ID | Kas | Ruz | Vazifa | Holat |
|---|---|---|---|---|
| BE-01 | Avaz | 1 | Monorepo setup | tayyor |
| BE-02 | Avaz | 1 | Kontrakt: Zod schema-ho dar `packages/shared` | tayyor |
| BE-03 | Avaz | 1 | Docker, Prisma, infra, CI | tayyor |
| BE-04 | Avaz | 1 | Auth API | tayyor |
| BE-05 | Avaz | 1 | Users + Follow API | tayyor |
| BE-06 | Avaz | 2 | Media API (S3) | tayyor |
| BE-07 | Avaz | 2 | Posts, Like, Comment, Saved API | tayyor |
| BE-08 | Avaz | 2 | Feed, Explore, Search API | tayyor |
| BE-09 | Avaz | 2 | Realtime + Notifications API | tayyor |
| BE-10 | Avaz | 2 | Stories API | tayyor |
| BE-11 | Avaz | 3 | Direct + Reels API | tayyor |
| BE-12 | Avaz | 3 | Seed, e2e, API freeze | tayyor |
| FE-01 | Abubakr | 1 | Tayyori va omuzishi Next.js 16 |  |
| FE-02 | Abubakr | 1 | Rangho, dark mode, shadcn/ui |  |
| FE-03 | Abubakr | 1 | Komponenthoi UI |  |
| FE-04 | Abubakr | 1 | MSW mock |  |
| FE-05 | Abubakr | 1 | Layout (sidebar, bottom nav) |  |
| FE-06 | Abubakr | 2 | Login / Signup |  |
| FE-07 | Abubakr | 2 | Feed + PostCard |  |
| FE-08 | Abubakr | 2 | Post modal + comment-ho |  |
| FE-09 | Abubakr | 2 | Profil |  |
| FE-10 | Abubakr | 2 | Edit profile + parol |  |
| FE-11 | Abubakr | 3 | Explore, Hashtag, Search |  |
| FE-12 | Abubakr | 3 | Notifications panel (UI) |  |
| FE-13 | Avaz | 3 | BFF + proxy.ts + CSP | tayyor |
| FE-14 | Abubakr | 3 | Xomush kardani mock, integratsiya |  |
| FE-15 | Avaz | 3 | Socket client + notifications realtime | tayyor |
| FE-16 | Abubakr | 3 | Stories tray + viewer |  |
| FE-17 | Avaz | 4 | Direct (front) | tayyor |
| FE-18 | Abubakr | 4 | Create modal |  |
| FE-19 | Avaz | 4 | Bovarinokii front | tayyor |
| FE-20 | Abubakr | 4 | Reels (front) |  |
| FE-21 | Avaz | 4 | Playwright e2e | tayyor |
| FE-22 | Abubakr | 4 | Pardoz va responsive |  |
| QA-01 | Avaz | 4 | QA: spec 01, 05, 08, 09, 11 | tayyor |
| QA-02 | Abubakr | 4 | QA: spec 02, 03, 04, 06, 07, 10 |  |

---

### BE-01 · Monorepo setup
<!-- who:avaz day:1 type:backend -->
**Vaqt:** Ruzi 1, 09:15–10:30 · **Spec:** TZ §5.2

- Struktura alla'kay sohta shud: `apps/web` (Next.js kuchonida shud, import `@/` = `src/`), `apps/api` (papkaho), `packages/shared`, `packages/tsconfig`, `pnpm-workspace.yaml`, `turbo.json`, `.gitattributes`, `CODEOWNERS`
- `corepack enable` → `corepack use pnpm@latest` (maydoni `packageManager` dar `package.json`)
- `nest new` ba `apps/api` (`--skip-git --package-manager pnpm`), papkahoi mavjudaro nigoh doshtan
- `packages/tsconfig`: `base.json`, `nestjs.json`, `nextjs.json` (strict); ESLint + Prettier umumi
- Dar `CODEOWNERS` username-i GitHub-i Abubakr

**Tayyor, agar:**
- [x] `pnpm install && pnpm dev` → web :3000 va api :4000 kor mekunand (sanjida shud)
- [x] `pnpm typecheck` va `pnpm lint` sabz
- [x] Push ba `main` (PR #1)
- [ ] Dar `CODEOWNERS` username-i GitHub-i Abubakr — username ma'lum nest (faqat e-mail dar commit)

### BE-02 · Kontrakt: Zod schema-ho dar packages/shared
<!-- who:avaz day:1 type:backend -->
**Vaqt:** Ruzi 1, 10:30–12:30 · **Spec:** 00–09

- Schema-hoi request va response baroi **hamai** endpoint-hoi spec 01–09 (`UserPreview`, `PostDto`, `CommentDto`, `StoryDto`, `ConversationDto`, `MessageDto`, `NotificationDto`, pagination...)
- `error-codes.ts`, tipho bo `z.infer`

**Tayyor, agar:**
- [x] Har DTO az spec dar `shared` hast — kontrakt ivaz shud ba [Spec 12](specs/12-api-kontrakt.md) (Swagger-i "Web Api")
- [x] Push — Abubakr metavonad mock-ro az inho sozad

### BE-03 · Docker, Prisma, infra, CI
<!-- who:avaz day:1 type:backend -->
**Vaqt:** Ruzi 1, 13:30–15:30 · **Spec:** 00, 11

- `docker-compose.yml`: Postgres + Redis + MinIO + bucket (healthcheck)
- `.env.example` + tekshirishi Zod dar start
- `schema.prisma` purra → `prisma migrate dev`
- `infra/`: Prisma, Redis + `CacheService` (bypass), BullMQ + `worker.ts`, pino, filter-i global, `/health`, Swagger
- `.github/workflows/ci.yml`

**Tayyor, agar:**
- [ ] Spec 11 AC1 — Docker dar kompyuter nest; `docker-compose.yml` (Postgres) navishta shud, PostgreSQL-i lokali istifoda meshavad
- [x] Spec 11 AC2 (bidun `JWT_SECRET` → xatoi fahmo dar start)
- [x] `/health` → `ok` (prefiks-i `/api/v1` dar Spec 12 nest)
- [x] CI dar PR sabz (PR #2)

### BE-04 · Auth API
<!-- who:avaz day:1 type:backend -->
**Vaqt:** Ruzi 1, 15:30–18:00 · **Spec:** 01

- register, login, username-available, refresh (rotation + grace), logout, ws-ticket, me
- argon2id, `JwtAuthGuard` global + `@Public()`, throttler bo Redis

**Tayyor, agar:**
- [x] Spec 01 AC1–AC4, AC7, AC8, AC10 (e2e); AC5–AC6 (refresh token) — buridashud, dar kontrakt yak JWT
- [x] `ali` va `ALI` → 409

### BE-05 · Users + Follow API
<!-- who:avaz day:1 type:backend -->
**Vaqt:** Ruzi 1, 18:00–19:30 · **Spec:** 02

**Tayyor, agar:**
- [x] Spec 02 AC1–AC4, AC6 (`/UserProfile`, `/FollowingRelationShip`, `get-post-favorites`)

### BE-06 · Media API (S3)
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 09:15–11:00 · **Spec:** 03

**Tayyor, agar:**
- [x] Spec 03 AC2–AC4 ekvivalent: upload-i multipart (Spec 12), tip/andoza → 400; presign S3 — buridashud
- [-] Job `process-image` (WebP) — buridashud (PLAN, buridan #2)

### BE-07 · Posts, Like, Comment, Saved API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 11:00–13:00 · **Spec:** 04

**Tayyor, agar:**
- [x] Spec 04 AC1–AC6 (like/favorite — toggle, Spec 12)
- [x] Like-i parallel → `likeCount` durust

### BE-08 · Feed, Explore, Search API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 14:00–16:00 · **Spec:** 05

**Tayyor, agar:**
- [x] Spec 05 AC1, AC2, AC4, AC5 (`get-following-post`, `get-posts`, `get-users`); AC3 Explore — dar Spec 12 nest

### BE-09 · Realtime + Notifications API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 16:00–18:00 · **Spec:** 09, 11

- `RealtimeGateway` `/ws` + Redis adapter, `RealtimeService.emitToUser`
- event → queue `notifications` → worker → DB + `notification:new`

**Tayyor, agar:**
- [x] `RealtimeGateway` `/ws` + `emitToUser` (ticket-i 60 s)
- [-] Notifications, Redis adapter, queue/worker — buridashud: dar kontrakti Spec 12 nest (P1)

### BE-10 · Stories API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 18:00–19:30 · **Spec:** 06

**Tayyor, agar:**
- [x] Spec 06 AC1–AC4 (`/Story/*`)

### BE-11 · Direct + Reels API
<!-- who:avaz day:3 type:backend -->
**Vaqt:** Ruzi 3, 09:15–11:30 · **Spec:** 07, 08

**Tayyor, agar:**
- [x] Spec 08 AC1–AC4 (2 socket-client dar test); AC5 (unread/Seen) — dar kontrakt nest
- [x] Spec 07: `get-reels` faqat reel; reel = aniq 1 video (2 video yo aks → posti oddi, ne reel)

### BE-12 · Seed, e2e, API freeze
<!-- who:avaz day:3 type:backend -->
**Vaqt:** Ruzi 3, 11:30–13:00 · **Spec:** 00 §6, 11

**Tayyor, agar:**
- [x] `pnpm --filter api db:seed` — 10 user, 50 post, story, chat
- [x] Spec 11 AC6 (dar log parol/token nest); AC3 (Redis) — buridashud
- [x] Hamai e2e sabz (18/18) → **API freeze**

### FE-01 · Tayyori va omuzishi Next.js 16
<!-- who:abubakr day:1 type:frontend -->
**Vaqt:** Ruzi 1, 09:15–10:30 · **Spec:** 10

- Nasbi Node 22+, `corepack enable` (pnpm)
- Xondani `node_modules/next/dist/docs/01-app/01-getting-started/` (proxy, layouts, images, fonts)
- Screenshot-hoi Instagram-i veb (feed, profil, post, direct) dar desktop va mobil

**Tayyor, agar:**
- [ ] Pas az push-i BE-01: `pnpm install && pnpm --filter web dev` kor mekunad

### FE-02 · Rangho, dark mode, shadcn/ui
<!-- who:abubakr day:1 type:frontend -->
**Vaqt:** Ruzi 1, 10:30–12:30 · **Spec:** 10 §1–2

- Ranghoi aslii Instagram: **hamai** tokenhoi Spec 10 §1.1–§1.11 bo **hamon nom** (`--ig-*`) va **hamon qimat** dar `globals.css` (light + dark)
- shadcn/ui init; ranghoi shadcn (`--primary`, `--background`, `--border`...) ba tokenhoi `--ig-*` baste meshavand (masalan `--primary: rgb(var(--ig-primary-button))`)

**Tayyor, agar:**
- [ ] Har token az jadvalhoi Spec 10 §1 dar `globals.css` hast, qimatho yak ba yak mos (Spec 10 AC9)
- [ ] Tugmai asosi `#4A5DF9`, ne `#0095F6`
- [ ] Spec 10 AC2, AC3
- [ ] Sahifai `/dev/colors`: hamai tokenho dar light va dark kanori ham

### FE-03 · Komponenthoi UI
<!-- who:abubakr day:1 type:frontend -->
**Vaqt:** Ruzi 1, 13:30–15:30 · **Spec:** 10 §5

- Button (primary/secondary/link), Input, Avatar (24/32/44/56/77/150), StoryRing (gradient / didashuda), Dialog, Dropdown, Sheet, Skeleton, Spinner-i Instagram, Toast, ikonkaho
- `lib/format.ts`: `2m, 3h, 5d, 2w`, `1,234 / 12.5K / 1.2M`

**Tayyor, agar:**
- [ ] Sahifai `/dev/ui` bo hamai komponentho (light + dark)
- [ ] Spec 10 AC2 (rangi hardcode nest)

### FE-04 · MSW mock
<!-- who:abubakr day:1 type:frontend -->
**Vaqt:** Ruzi 1, 15:30–18:00 · **Spec:** 00–09 (schema-hoi `@repo/shared`)

- `apps/web/src/mocks/`: `browser.ts`, `handlers/*.ts`, `factories.ts` (`@faker-js/faker`)
- Handler-ho baroi auth, users, follow, posts, feed (ba'd — har modul vaqte ki sahifaash sohta meshavad)
- `NEXT_PUBLIC_API_MOCKING=on|off`
- Mock javobho bo **hamon Zod schema** tekshirida meshavand

**Tayyor, agar:**
- [ ] `fetch('/api/v1/feed')` dar brauzer posthoi mock medihad
- [ ] Bo `off` darxostho ba server meravand

### FE-05 · Layout (sidebar, bottom nav)
<!-- who:abubakr day:1 type:frontend -->
**Vaqt:** Ruzi 1, 18:00–19:30 · **Spec:** 10 §3

**Tayyor, agar:**
- [ ] Spec 10 AC1 (1440 / 1000 / 390)
- [ ] Panel-hoi Search va Notifications mekushoyand (sidebar → 72px)

### FE-06 · Login / Signup
<!-- who:abubakr day:2 type:frontend -->
**Vaqt:** Ruzi 2, 09:15–11:00 · **Spec:** 01, 10 §4

**Tayyor, agar:**
- [ ] ozod/band username bo debounce 400ms
- [ ] Xatoi `USERNAME_TAKEN` zeri maydon
- [ ] Tugma to forma durust nest — disabled

### FE-07 · Feed + PostCard
<!-- who:abubakr day:2 type:frontend -->
**Vaqt:** Ruzi 2, 11:00–13:00 · **Spec:** 04, 05, 10 §5

**Tayyor, agar:**
- [ ] Carousel, double-tap like, like/save optimistic + rollback
- [ ] Infinite scroll, Skeleton, sutuni Suggested (≥1160px)

### FE-08 · Post modal + comment-ho
<!-- who:abubakr day:2 type:frontend -->
**Vaqt:** Ruzi 2, 14:00–16:00 · **Spec:** 04, 10 §4

**Tayyor, agar:**
- [ ] Az feed — modal, mustaqim `/p/[id]` — sahifai purra
- [ ] Comment, reply, "View replies", hazf

### FE-09 · Profil
<!-- who:abubakr day:2 type:frontend -->
**Vaqt:** Ruzi 2, 16:00–18:00 · **Spec:** 02, 10 §4

**Tayyor, agar:**
- [ ] Header, counter-ho, Follow/Following/Edit profile
- [ ] Tab-ho POSTS / REELS / SAVED, grid 3:4
- [ ] Modali followers/following bo search

### FE-10 · Edit profile + parol
<!-- who:abubakr day:2 type:frontend -->
**Vaqt:** Ruzi 2, 18:00–19:30 · **Spec:** 02, 03

**Tayyor, agar:**
- [ ] Avatar upload (presign → PUT), bio 0/150, ivazi username bo ozod/band
- [ ] Ivazi parol

### FE-11 · Explore, Hashtag, Search
<!-- who:abubakr day:3 type:frontend -->
**Vaqt:** Ruzi 3, 09:15–11:30 · **Spec:** 05

**Tayyor, agar:**
- [ ] Grid-i Explore (har 5 — kalon), `/explore/tags/[tag]`
- [ ] Search panel: user-ho va `#hashtag`, recent searches

### FE-12 · Notifications panel (UI)
<!-- who:abubakr day:3 type:frontend -->
**Vaqt:** Ruzi 3, 11:30–13:00 · **Spec:** 09

**Tayyor, agar:**
- [ ] Guruhbandi Today / This week / This month / Earlier
- [ ] Follow back, thumbnail-i post, `read-all` hangomi kushodan

### FE-13 · BFF + proxy.ts + CSP
<!-- who:avaz day:3 type:frontend -->
**Vaqt:** Ruzi 3, 14:00–16:00 · **Spec:** TZ §5.3, 01, 10 §6–7

**Tayyor, agar:**
- [x] `app/api/auth/*` cookie-hoi httpOnly meguzorand
- [x] `app/api/[...path]` + timeout 10 s (refresh — dar kontrakt nest)
- [x] Spec 01 AC9 (token dar JS nest) — Playwright

### FE-14 · Xomush kardani mock, integratsiya
<!-- who:abubakr day:3 type:frontend -->
**Vaqt:** Ruzi 3, 14:00–17:00 · **Spec:** hama

**Tayyor, agar:**
- [ ] `NEXT_PUBLIC_API_MOCKING=off` → hamai sahifahoi FE-05…FE-12 bo API-i voqe'i kor mekunand
- [ ] Har farq → Issue bo label `bug`, islohshuda

### FE-15 · Socket client + notifications realtime
<!-- who:avaz day:3 type:frontend -->
**Vaqt:** Ruzi 3, 17:00–19:30 · **Spec:** 08, 09

**Tayyor, agar:**
- [x] `lib/socket.ts`: ticket, reconnect, refetch pas az reconnect
- [-] Badge/toast hangomi `notification:new` — notifications dar kontrakt nest; toast hangomi `message:new` hast

### FE-16 · Stories tray + viewer
<!-- who:abubakr day:3 type:frontend -->
**Vaqt:** Ruzi 3, 17:00–19:30 · **Spec:** 06

**Tayyor, agar:**
- [ ] Tray dar feed (gradient / didashuda)
- [ ] Viewer: progress, tap chap/rost, hold, useri badi, Esc, viewers baroi xud

### FE-17 · Direct (front)
<!-- who:avaz day:4 type:frontend -->
**Vaqt:** Ruzi 4, 09:15–12:30 · **Spec:** 08

**Tayyor, agar:**
- [x] Inbox, chat, optimistic, unsend, fayl; typing/Seen — dar kontrakt nest (PLAN, buridan #6)
- [x] "New message"; share post — dar kontrakt nest
- [x] Spec 08 AC1 dar du brauzer — Playwright

### FE-18 · Create modal
<!-- who:abubakr day:4 type:frontend -->
**Vaqt:** Ruzi 4, 09:15–12:30 · **Spec:** 03, 04, 06, 07

**Tayyor, agar:**
- [ ] Intixob / drag & drop → crop → caption → Share
- [ ] Post (1–10 media), Reel (1 video), Story

### FE-19 · Bovarinokii front
<!-- who:avaz day:4 type:frontend -->
**Vaqt:** Ruzi 4, 13:30–15:30 · **Spec:** 10 §7.1

**Tayyor, agar:**
- [x] Spec 10 AC6, AC7 — Playwright; AC8 (virtualizatsiyai feed) — feed (FE-07) hanuz nest

### FE-20 · Reels (front)
<!-- who:abubakr day:4 type:frontend -->
**Vaqt:** Ruzi 4, 13:30–15:30 · **Spec:** 07

**Tayyor, agar:**
- [ ] Scroll-snap, autoplay/pause bo IntersectionObserver, mute
- [ ] Like / comment / save, double-tap

### FE-21 · Playwright e2e
<!-- who:avaz day:4 type:qa -->
**Vaqt:** Ruzi 4, 15:30–17:00 · **Spec:** TZ §6.4

**Tayyor, agar:**
- [x] 5 senariya sabz: register, post, like, follow, direct (7 test)

### FE-22 · Pardoz va responsive
<!-- who:abubakr day:4 type:frontend -->
**Vaqt:** Ruzi 4, 15:30–17:00 · **Spec:** 10

**Tayyor, agar:**
- [ ] Dark toggle, 404, holati xoli, skeleton dar hama jo
- [ ] Hamai sahifaho dar 1440 / 1000 / 390

### QA-01 · QA: spec 01, 05, 08, 09, 11
<!-- who:avaz day:4 type:qa -->
**Vaqt:** Ruzi 4, 17:00–19:00

**Tayyor, agar:**
- [x] Hamai AC-hoi in spec-ho tekshirida shudand — [qa/QA-01.md](qa/QA-01.md)
- [x] TZ §9 band 8 (cookie); band 9–10 (Redis, worker) — buridashud

### QA-02 · QA: spec 02, 03, 04, 06, 07, 10
<!-- who:abubakr day:4 type:qa -->
**Vaqt:** Ruzi 4, 17:00–19:00

**Tayyor, agar:**
- [ ] Hamai AC-hoi in spec-ho tekshirida shudand
- [ ] Lighthouse: TZ §9 band 11
