# TASKS — Vazifaho baroi Avaz va Abubakr

> Har vazifa dar GitHub **Issue**-i alohida ast (milestone = ruz, label = `backend` / `frontend` / `qa` va nomi odam).
> **Holat (2026-10-21):** hamai vazifahoi Avaz tayyor — `[x]` tayyor va sanjida shud, `[-]` buridashud (sabab navishta shud). Tafsilot: [PROGRESS.md](PROGRESS.md), [qa/QA-01.md](qa/QA-01.md).
> **Kontrakti API (az 2026-10-21):** [specs/12-api-kontrakt.md](specs/12-api-kontrakt.md) — URL va DTO-ho az onjo, ne az spec-hoi 01–09. Ilovaho (Notifications, Explore, Hashtag, replies, Seen/typing/unread, share post, Suggestions) — [specs/13-ilovaho-tz.md](specs/13-ilovaho-tz.md).
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
| FE-23 | Avaz | 4 | Direct-i Spec 14: group chat, dil-i paym, reply, paymi ovozi, javob ba story | tayyor |
| FE-24 | Avaz | 4 | `/accounts/*`: Privacy + follow requests, Blocked, Muted, Restricted, Close friends, Archive | tayyor |
| FE-25 | Avaz | 4 | `/explore/locations/[name]`, `features/social/api.ts` (hamai endpoint-hoi Spec 14), ShareDialog, ReportDialog | tayyor |
| FE-26 | Abubakr | 4 | UI-i Spec 14 dar sahifahoi xud (Stories, Reels, Create, Notifications, Profil, Post menu, comment) |  |
| BE-13 | Avaz | 4 | Backend-i [Spec 15](specs/15-funksiyahoi-ilovagi.md): remove follower, favorites + feed, pin-i comment, liked posts, user reels, tahriri paym, notes, "Active now"; seed (40 user, 35 reel, ~100 story) | tayyor |
| FE-27 | Avaz | 4 | Direct-i Spec 15: Notes tray, tahriri paym ("Edited"), "Active now" | tayyor |
| FE-28 | Avaz | 4 | `/accounts/favorites`, `/accounts/activity` (liked posts) | tayyor |
| FE-29 | Abubakr | 4 | UI-i Spec 15 dar sahifahoi xud (remove follower, tab-i REELS, pin-i comment, feed-i Favorites, linkho dar More) + tokenhoi rangi Spec 10 §1.11.1 |  |

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
- [x] Spec 05 AC1–AC5 (`get-following-post`, `get-posts`, `get-users`; Explore va Hashtag — Spec 13 §2)

### BE-09 · Realtime + Notifications API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 16:00–18:00 · **Spec:** 09, 11

- `RealtimeGateway` `/ws` + Redis adapter, `RealtimeService.emitToUser`
- event → queue `notifications` → worker → DB + `notification:new`

**Tayyor, agar:**
- [x] `RealtimeGateway` `/ws` + `emitToUser` (ticket-i 60 s)
- [x] Notifications (Spec 13 §1): like/comment/reply/follow → DB + `notification:new`; Redis adapter va queue/worker — nest (Redis dar loyiha nest)

### BE-10 · Stories API
<!-- who:avaz day:2 type:backend -->
**Vaqt:** Ruzi 2, 18:00–19:30 · **Spec:** 06

**Tayyor, agar:**
- [x] Spec 06 AC1–AC4 (`/Story/*`)

### BE-11 · Direct + Reels API
<!-- who:avaz day:3 type:backend -->
**Vaqt:** Ruzi 3, 09:15–11:30 · **Spec:** 07, 08

**Tayyor, agar:**
- [x] Spec 08 AC1–AC5 (2 socket-client dar test; unread/Seen — Spec 13 §4)
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
- [x] Badge/toast hangomi `notification:new` — `lib/notifications.ts` (`useNotificationsUnread`, `useNotificationsRealtime`); badge dar sidebar — Abubakr

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
- [x] Inbox, chat, optimistic, unsend, fayl, typing, Seen, nuqtai naxonda (Spec 13 §4)
- [x] "New message"; share post — API va namoish dar chat (Spec 13 §4), tugmai Share dar PostCard — Abubakr
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

### FE-23 · Direct-i Spec 14
<!-- who:avaz day:4 type:frontend -->
**Spec:** 14 §4, §7

**Tayyor, agar:**
- [x] "New message": 2+ user → group chat (`/Chat/create-group`), nomi guruh; header "N members", "Leave group"
- [x] Dil-i paym: double-tap / tugma, optimistic + rollback, realtime `message:updated`; rangi dil `--ig-badge` (#FF3040)
- [x] Reply ba paym (`ReplyToMessageId`), namoishi "You replied to ..."
- [x] Paymi ovozi (MediaRecorder → `audio/webm|ogg|mp4`), `<audio>` dar chat; javob ba story (`MessageDto.story`)
- [x] Dar brauzer sanjida shud: group chat, dil, reply

### FE-24 · /accounts/* (Privacy va amniyat)
<!-- who:avaz day:4 type:frontend -->
**Spec:** 14 §1, §2, §3

**Tayyor, agar:**
- [x] `/accounts/privacy`: toggle-i "Private account" (`update-privacy`), darxosthoi follow (Confirm / Delete)
- [x] `/accounts/blocked|muted|restricted|close-friends`: ruyxat + Unblock / Unmute / Unrestrict / Remove; close friends — justuju va Add
- [x] `/accounts/archive`: tab-hoi POSTS / STORIES
- [x] Dar brauzer sanjida shud (private on/off, close friends, archive)

### FE-25 · Location, social API, Share / Report
<!-- who:avaz day:4 type:frontend -->
**Spec:** 14 §2, §7

**Tayyor, agar:**
- [x] `/explore/locations/[name]` — grid-i postho bo infinite scroll (sanjida shud)
- [x] `features/social/api.ts` — funksiyahoi hamai endpoint-hoi Spec 14 baroi Abubakr
- [x] `ShareDialog` (`features/direct/components/share-dialog.tsx`, props: `share`, `onClose`) va `ReportDialog` (`features/social/components/report-dialog.tsx`)

### BE-13 · Backend-i Spec 15 + seed
<!-- who:avaz day:4 type:backend -->
**Spec:** [15](specs/15-funksiyahoi-ilovagi.md)

**Tayyor, agar:**
- [x] 15 endpoint-i nav (`/Note/*`, `remove-follower`, `add/remove/get-favorite(s)`, `get-favorites-feed`, `get-liked-posts`, `get-user-reels`, `pin-comment`, `edit-message`, `get-activity-status`), migratsiya `spec15_full_instagram`
- [x] Spec 15 AC1–AC7 (e2e, 7 test); hamai e2e — 40/40
- [x] Seed: 40 user, 235 post (35 reel), 101 story (aks va video), 9 note, favorites, comment-hoi pin-shuda

### FE-27 · Direct-i Spec 15
<!-- who:avaz day:4 type:frontend -->
**Spec:** 15 §3–5

**Tayyor, agar:**
- [x] Notes tray bolo-i inbox (note-i man + mutual, Share / Delete, close friends)
- [x] "Edit" baroi paymi matni to 15 daqiqa, "Save", "Edited"; optimistic + rollback
- [x] "Active now" / "Active 1h ago" dar header, nuqtai sabz dar ruyxat
- [x] Dar brauzer sanjida shud

### FE-28 · /accounts/favorites va /accounts/activity
<!-- who:avaz day:4 type:frontend -->
**Spec:** 15 §1, §6

**Tayyor, agar:**
- [x] Favorites: ruyxat, justuju, Add, Remove (maks. 50)
- [x] Your activity: posthoi like-karda, nav avval
- [x] Dar brauzer sanjida shud

### FE-29 · UI-i Spec 15 dar sahifahoi Abubakr
<!-- who:abubakr day:4 type:frontend -->
**Spec:** 15 §8 · API: `features/social/api.ts` (`removeFollower`, `getUserReels`, `pinComment`, `getFavoritesFeed`) — tayyor

- Followers modal: tugmai "Remove" baroi followerhoi xud
- Profil: tab-i REELS → `getUserReels` (ba joi filtr-i `get-posts`)
- Comment: "Pin" baroi muallifi post, belgii pin; tartib — az API
- Feed: intixobi "Following / Favorites"
- More menu: linkho ba `/accounts/privacy`, `/accounts/favorites`, `/accounts/activity`
- Rangho: tokenhoi Spec 10 §1.11.1 ba `globals.css` (light + dark)

**Tayyor, agar:**
- [ ] Spec 15 AC1–AC4 az UI kor mekunand
- [ ] Har token-i Spec 10 §1 (bo §1.11.1) dar `globals.css` hast

### FE-26 · UI-i Spec 14 dar sahifahoi Abubakr
<!-- who:abubakr day:4 type:frontend -->
**Spec:** 14 §7 · API: `features/social/api.ts` (tayyor)

- Stories tray + viewer (gradient / didashuda / sabz-i close friends), like, javob (`replyStory`), share (`ShareDialog`)
- Reels, Create (Post 1–10, Reel, Story + Close friends, location, tag), Notifications (Confirm / Delete-i follow request)
- Profil: tab-i TAGGED, highlights, qulf baroi private, menyui "..." (Block, Restrict, Mute, Report, Close friends)
- Post menu: Edit, Archive, Pin, Hide like count, Turn off commenting, Delete, Report, Add to collection; Saved → collections
- Comment: dil-i comment (`likeComment`), linki `@mention` va `#hashtag`; linki location → `/explore/locations/[name]`
- Dar `more-menu` / `settings-nav` linkho ba `/accounts/privacy` va digar sahifahoi FE-24

**Tayyor, agar:**
- [ ] Spec 14 AC1–AC8 az UI kor mekunand

---

## Spec 16 — Zang, paymi ovozi / video, efir

### BE-14 · Backend-i Spec 16
<!-- who:avaz day:5 type:backend -->
**Spec:** [16](specs/16-zang-va-efir.md) §1–3

**Tayyor, agar:**
- [x] `/Call/*` (start, accept, decline, end, active, history, ICE servers) + socket `call:*`, MISSED pas az 45 s, offline → baromadan
- [x] `/Live/*` (start, end, get-lives, comments) + socket `live:*` (join, leave, signal, heart), maks. 50 tamoshobin, notification `LIVE_STARTED`
- [x] `send-message` + `Duration` → `MessageDto.durationSec`; paymi "zang" (`MessageDto.call`)
- [x] e2e: `spec16.e2e-spec.ts` (7 test), hamagi 48/48
- [x] Render: API dar https://istagram-web.onrender.com, Swagger — `/swagger`, `git push` ba main → deploy-i xudkor

### FE-30 · Direct: zangi audio / video, paymi ovozi va video
<!-- who:avaz day:5 type:frontend -->
**Spec:** 16 §1–2, §5 · API: `/Call/*`, `PUT /Chat/send-message` + `Duration`, socket `call:*`

- `features/rtc/`: `getIceServers`, `useCall` (RTCPeerConnection, offer / answer / ICE bo `call:signal`), `useLive` (baroi FE-31)
- Header-i chat: ikonkahoi telefon va kamera → `start-call`
- Ekrani zang: avatar, "Calling…" / vaqt, mute, kamera on/off, ivazi kamera, end; video-i xud dar kunj
- Zangi voridshavanda: modal dar har sahifa (`call:incoming`) + ringtone, Accept / Decline; pas az refresh — `get-active-calls`
- Paymi "zang" dar chat: "Audio call · 3:12", "Missed video call", "Call back"
- Paymi ovozi: `MediaRecorder`, pahsh karda nigoh dor / kashidan — bekor, mavj va vaqt, `Duration`
- Paymi video: navishtan to 60 s yo intixobi fayl, player bo davomnoki

- Ilova (Avaz): sahifahoi efir dar faylhoi nav — `/live` (ruyxat), `/live/new` (muallif), `/live/[id]` (tamosho); linki "Live" dar sarlavhai Direct; toast "started a live video" → Watch

**Tayyor, agar:**
- [x] Spec 16 AC1–AC5 az UI kor mekunand
- [x] Zangi audio va video dar du brauzer sanjida shud: tasvir va ovoz har du taraf (analyser: 300 Hz ↔ 500 Hz), mute, kamera, rad, "Call back"
- [x] Paymi ovozi va video: MP4 (Safari ham), ovoz dar fayl sanjida shud; BFF `Range` → 206
- [x] Efir: muallif + tamoshobin, video va ovoz, comment, dil, "Live video ended"
- [ ] Sanjish bayni du kompyuter dar shabakahoi gunogun (agar vasl nashavad — TURN, nig. PROGRESS)

### FE-31 · Darvozahoi efir dar sahifahoi Abubakr
<!-- who:abubakr day:5 type:frontend -->
**Spec:** 16 §3, §5 · Sahifahoi efir tayyorand (Avaz, FE-30): `/live`, `/live/new`, `/live/[id]`; API: `getLives` dar `features/rtc/api.ts`

- Create (menyu) → band-i "Live" → `/live/new`
- Story tray: halqai surxi "LIVE" baroi `getLives()` (va `live:started`) → `/live/[id]`
- Notifications: `LIVE_STARTED` ("started a live video." — matn tayyor dar `lib/notifications.ts`) → klik → `/live/[id]` (liveId az `getLives()` bo `actor.id`)
- Profil: agar user dar efir ast — nishoni "LIVE" dar avatar

**Tayyor, agar:**
- [ ] Har se darvoza ba sahifai efir meravand
- [ ] Mobil 375px
