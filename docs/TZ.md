# TZ — Topshiriqi texniki: Kopiyai Instagram

> Versiya: 1.0 · Sana: 2026-10-20 · Muhlat: 4 ruz · Guruh: 2 nafar (A va B)

## 1. Maqsad

Sohtani veb-ilovai **kopiyai purrai Instagram** (dizayn, rangho, funksiyaho) dar shakli **monorepo**:
backend — **NestJS**, frontend — **Next.js**. Kor bo usuli **SDD (Spec-Driven Development)** meravad:
avval spec (`docs/specs/*`), ba'd kod. Har kod boyad ba spec mutobiq boshad; agar spec tagyir yobad — avval specro tagyir dihed.

## 2. Doirai funksiyaho (Scope)

Prioritetho: **P0** — hatman dar 4 ruz · **P1** — boyad boshad, agar vaqt rasad · **P2** — ilovagi (pas az 4 ruz).

| # | Modul | Funksiyaho | Prioritet |
|---|---|---|---|
| 1 | Auth | Ruyxatgiri va voridshavi bo **username + parol**, logout, refresh token | P0 |
| 2 | Users | Profil, tahriri profil, avatar, ivazi parol | P0 |
| 3 | Follow | Follow/Unfollow, ruyxati followers/following | P0 |
| 4 | Media | Bor kardani aks/video ba S3 (presigned URL), namoish tavassuti CDN | P0 |
| 5 | Posts | Post bo 1–10 aks/video (carousel), caption, tahrir, hazf | P0 |
| 6 | Like / Comment / Saved | Like, comment (va javob ba comment), saqlashuda | P0 |
| 7 | Feed | Lentai postho az odamoni follow-shuda | P0 |
| 8 | Stories | Story 24 soat, viewer, ruyxati binandagon | P0 |
| 9 | Reels | Videoi vertikali, scroll-i alohida | P0 |
| 10 | Direct | Chati realtime (Socket.IO), 1:1, holati "xonda shud", typing | P0 |
| 11 | Notifications | Like, comment, follow — realtime + ruyxat | P0 |
| 12 | Explore / Search | Sahifai Explore, justujui user va hashtag | P0 |
| 13 | Suggestions | "Suggested for you" | P1 |
| 14 | Dark mode | Mavzui torik | P1 |
| 15 | Hisobi xususi (private) + follow request | [Spec 14](specs/14-funksiyahoi-purra.md) §1.1 | P0 (az 2026-10-21) |
| 16 | Highlights, Group chat, Mention, Comment like | Spec 14 §2–4 | P0 (az 2026-10-21) |
| 17 | Block, Mute, Restrict, Report, Close friends | Spec 14 §1.2–1.6 | P0 (az 2026-10-21) |
| 18 | Tag dar aks, Location, tahriri post, Archive, Pin, Collections | Spec 14 §2 | P0 (az 2026-10-21) |
| 19 | Direct: dil-i paym, reply, paymi ovozi, javob ba story | Spec 14 §3–4 | P0 (az 2026-10-21) |
| 20 | Notes, tahriri paym, "Active now" dar Direct | [Spec 15](specs/15-funksiyahoi-ilovagi.md) §3–5 | P0 (az 2026-10-21) |
| 21 | Remove follower, Favorites + feed, pin-i comment, reels-i profil, "Your activity" | Spec 15 §1, §2, §6 | P0 (az 2026-10-21) |
| 22 | Direct: zangi audio va video (1:1 va group), paymi ovozi va video bo davomnoki | [Spec 16](specs/16-zang-va-efir.md) §1–2 | P0 (az 2026-10-22) |
| 23 | Efiri mustaqim (Live): ogoz, tamosho, comment, dil, xabar ba follower-ho | Spec 16 §3 | P0 (az 2026-10-22) |
| 24 | Deploy: API va bazai umumi dar Render (har `git push` → deploy) | [PROGRESS](PROGRESS.md) | P0 (az 2026-10-22) |

> 2026-10-21: qaror — "nusxai purrai Instagram". Funksiyahoi 15–21 az P2 ba P0 guzaronida shudand (20–21 — Spec 15); backend — tayyor (Spec 14), frontend — Avaz (Direct, `/accounts/*`, location) va Abubakr (sahifahoi xud, FE-26).
> 2026-10-22: funksiyahoi 22–24 ilova shudand; backend — tayyor (Spec 16), frontend — Avaz (FE-30: zang va paymi ovozi / video dar Direct), Abubakr (FE-31: efir).

## 3. Talaboti asosi ba Auth

- Faqat **username + parol** (email, telefon, Google — **ne**).
- **Username yakxela ast**: backend 2 hisobi bo yak username-ro **ijozat namedihad**.
  - Username pesh az nigohdori ba **lowercase** gardonida meshavad (`Ali` = `ali`).
  - Dar DB: `UNIQUE` constraint. Dar kod: pesh az sohtan tekshirish + dastgir kardani xatoi Prisma `P2002` (race condition) → javobi `409 Conflict`.
  - Hamin qoida hangomi **ivazi username** dar tahriri profil ham amal mekunad.
- Qoidahoi username (misli Instagram): 3–30 aloma, faqat `a-z 0-9 . _`, bo nuqta sar/anjom nameyobad, du nuqta paydarpay ne.
- Parol: kamash 8 aloma, dar DB faqat **argon2id hash** nigoh doshta meshavad.

Tafsilot: [specs/01-auth.md](specs/01-auth.md).

## 4. Texnologiyaho (Stack)

| Qism | Texnologiya | Foida |
|---|---|---|
| Arxitektura | **Modulnyi monolit** (har modul — alohida NestJS module, bidun vobastagii mustaqim ba Prisma-i moduli digar) | Hozir sodda, ba'd har modul ba servisi alohida baromada metavonad |
| Monorepo | Turborepo + pnpm workspaces | Yak `pnpm dev`, kesh-i build |
| Backend | NestJS 11, TypeScript **strict**, Prisma ORM, PostgreSQL 16 | Struktura, tiphoi umumi |
| Kesh / limit | **Redis 7** (`ioredis`) | Kesh-i feed/profil, rate limit, adapteri Socket.IO, BullMQ |
| Navbat (queue) | **BullMQ** (dar Redis) + **worker**-i alohida (`apps/api` rejimi `worker`) | Notification, korkardi media, tozakunii story — user intizor nameshavad |
| Validatsiya | **Zod** — schema-ho dar `packages/shared`, dar API (`ZodValidationPipe`) va dar front (formaho + javobi API) | Yak qoida dar du jo, xato pesh az shikastani UI dastgir meshavad |
| Auth | JWT access (15 daq.) + refresh (7 ruz, rotation), **argon2id**, tokenho **faqat dar httpOnly cookie** | XSS tokenro duzdida nametavonad |
| Realtime | Socket.IO + `@socket.io/redis-adapter` | Kor bo chand nusxai API |
| Media | S3 (presigned PUT) + CDN; lokali — MinIO; korkard — `sharp` dar worker (WebP + thumbnail) | Fayl API-ro bor namekunad |
| API hujjat | Swagger `/api/docs` (az Zod schema-ho) | |
| Frontend | Next.js 16 (App Router, SSR + **BFF**), React 19, TypeScript strict | SSR, sirho dar server |
| UI | Tailwind CSS 4 + **shadcn/ui** (komponentho dar kodi mo, bo ranghoi Instagram) | Tez va yaksha |
| Data dar front | TanStack Query v5 (optimistic, infinite, refetch dar focus/reconnect, invalidate az socket, Devtools dar dev), Zustand (faqat holati UI) | Javobi favri |
| Formaho | react-hook-form + zod | |
| Test | Vitest (unit), Supertest (API e2e), **Playwright** (e2e-i brauzer) | |
| Sifat | ESLint, Prettier, `tsc --noEmit`, **GitHub Actions CI** | Kodi shikasta ba `main` namedaroyad |
| Monitoring | **Sentry** (front + back), log-i JSON (`pino`), `/health` | Xatoho hamesha dida meshavand |
| Infra lokali | docker-compose: PostgreSQL + Redis + MinIO | Muhiti yaksha baroi har du nafar |

**Chi ilova nameshavad (va chiro):** mikroservisho, Kafka, Kubernetes, Elasticsearch/Meilisearch, GraphQL — bidun sarborii voqe'i faqat kordo sust mekunand. Justuju — PostgreSQL (`pg_trgm`). Bo hamin arxitektura ba'dan ilova kardan oson ast (§11).

> **Diqqat (Next.js 16):** in versiya tagyirothoi kalon dorad (masalan `middleware.ts` → `proxy.ts`).
> Pesh az navishtani kodi frontend hujjati `node_modules/next/dist/docs/`-ro xoned.

## 5. Arxitektura

### 5.1 Naqshai umumi

```
Brauzer ─▶ (CDN — dar production) ─▶ Next.js :3000  (SSR + BFF: app/api/[...path])
                                         │  cookie → Authorization header
                                         ▼
                                     NestJS API :4000 (modulnyi monolit)
                                         ├─▶ PostgreSQL   (manba'i haqiqat)
                                         ├─▶ Redis        (kesh, rate limit, socket adapter)
                                         ├─▶ BullMQ ─▶ Worker (notification, media, cron)
                                         └─▶ S3 ◀── brauzer mustaqim upload (presigned) ──▶ CDN
Brauzer ══ WebSocket (Socket.IO /ws, bo "ws-ticket"-i kutoh) ══▶ NestJS
```

### 5.2 Papkaho

```
exem-3/
├─ apps/
│  ├─ api/                 NestJS (port 4000), prefiks /api/v1
│  │  ├─ prisma/schema.prisma
│  │  └─ src/
│  │     ├─ main.ts        rejimi HTTP
│  │     ├─ worker.ts      rejimi worker (BullMQ processor-ho), hamon kod
│  │     ├─ infra/         prisma, redis, queue, s3, health, logger
│  │     ├─ common/        guards, pipes, filters, decorators
│  │     └─ modules/{auth,users,follows,media,posts,comments,feed,explore,
│  │                 stories,reels,direct,notifications,realtime}
│  └─ web/                 Next.js (port 3000)
│     └─ src/{app,components,features,lib}
│        └─ app/api/[...path]/route.ts   BFF-proxy
├─ packages/
│  ├─ shared/              Zod schema-ho + tipho + kodhoi xato (api va web)
│  └─ tsconfig/            konfiguratsiyai umumii TS (strict)
├─ docs/                   TZ, PLAN, PROGRESS, specs/
├─ .github/workflows/ci.yml
├─ docker-compose.yml      postgres, redis, minio
├─ turbo.json
└─ pnpm-workspace.yaml
```

### 5.3 BFF (Next.js hamchun qabati miyona)

- Brauzer **hech vaqt** ba NestJS mustaqim murojiat namekunad (gayr az WebSocket va upload ba S3).
- `POST /api/auth/login|register|logout` — route handler-hoi Next: javobi NestJS-ro megirand va tokenhoro dar **httpOnly cookie** meguzorand (`access_token` 15 daq., `refresh_token` 7 ruz, `Secure` dar production, `SameSite=Lax`).
- `/api/[...path]` — har darxostro ba `API_URL/api/v1/...` mefiristad, `Authorization: Bearer <access_token az cookie>` ilova mekunad. Agar NestJS `401` dihad → BFF xudash `refresh` mekunad, cookie-hoi navro meguzorad va darxostro **yak bor** takror mekunad.
- Server Components ma'lumotro dar server megirand (SSR baroi `/[username]`, `/p/[id]` — SEO va bor shudani tez).
- WebSocket: front `GET /api/realtime/ticket` → JWT-i **60 soniya** (faqat baroi ulanish) → `io(WS_URL, { auth: { ticket } })`.
- CSRF: `SameSite=Lax` + BFF baroi `POST/PATCH/DELETE` header-i `Origin`-ro tekshirad.

### 5.4 Qoidahoi modulnyi monolit
- Modul ba jadvalhoi moduli digar **mustaqim** dast namezanad — faqat tavassuti servisi on (`UsersService.findPreviewMany()`).
- Amalhoi "vazni" (notification, korkardi media, fan-out) — **faqat tavassuti queue**, ne dar darxosti HTTP.
- Event-hoi dokhili: `PostLikedEvent`, `UserFollowedEvent`... (`@nestjs/event-emitter`) → listener vazifaro ba queue meguzorad. Ba'dan in event-ho ba Kafka/RabbitMQ ivaz kardan oson ast.

## 6. Talaboti gayrifunksionali

### 6.1 Amniyat

| Xatar | Himoya dar loyihai mo |
|---|---|
| Duzdii parol | **argon2id** (memoryCost 19 MB, timeCost 2); parol hech vaqt dar log/javob nest |
| Intixobi parol (brute force), spam | Rate limit dar **Redis** (`@nestjs/throttler` + storage-i Redis): login 5/daq. baroi `IP+username`, register 3/daq. baroi IP; CAPTCHA (Cloudflare Turnstile) — P2 |
| Duzdii sessiya | Access 15 daq. + refresh 7 ruz bo **rotation** va dar DB faqat hash; tokenho **faqat httpOnly cookie** |
| XSS | Next: CSP-i qat'i (`script-src 'self'` + nonce), React matnro xudash escape mekunad, `dangerouslySetInnerHTML` **mamnu'** (qoidai ESLint) |
| CSRF | `SameSite=Lax` + tekshirishi `Origin` dar BFF baroi metodhoi tagyirdihanda |
| SQL injection | Faqat Prisma (parametrho); `$queryRaw` faqat bo template tag, `$queryRawUnsafe` mamnu' |
| Voridoti galat | Zod dar hamai endpoint-ho, `strict()` — maydoni ilovagi → 400 |
| Faylhoi xatarnok | Tip va andoza dar presign + dar worker tekshirishi "magic bytes" bo `sharp`; key faqat az `uploads/<userId>/` |
| Dastrasi ba ma'lumoti begona | Har query bo `authorId/userId`-i joriy tekshirad (403); ID — uuid (taxmin kardan nameshavad) |
| Vobastagihoi kuhna | `pnpm audit` dar CI, Dependabot dar GitHub |
| Header-ho | `helmet`, CORS faqat baroi `WEB_ORIGIN` |

### 6.2 Sur'at (Performance)

- **Maqsad:** API p95 < 200 ms baroi feed/profil (lokali); Core Web Vitals: **LCP < 2.5 s, INP < 200 ms, CLS < 0.1**.
- **DB:** indeksho (Spec 00), counter-hoi denormalized dar transaction, `select`-i faqat maydonhoi lozimi, hech N+1 (dar dev Prisma query-horo log mekunad).
- **Redis kesh:** profil (`user:{username}` 60 s), feed-i sahifai avval (`feed:{userId}:first` 30 s), `isFollowing`. Hangomi tagyir — kesh **hazf** meshavad (invalidate), ne navsozi.
- **Frontend:** `next/image` (AVIF/WebP, `sizes`, `priority` faqat baroi posti avval), lazy loading, **virtualizatsiyai feed** (`@tanstack/react-virtual`), code splitting (modalho bo `dynamic()`), andozai aks/video hamesha ma'lum → CLS = 0.
- **Media:** worker aksro ba WebP (1080px + 640px + thumbnail 320px) mebarad; CDN bo `Cache-Control: public, max-age=31536000, immutable`.

### 6.3 Bovarinoki — "hech jo naband nashavad"

| Holat | Raftor |
|---|---|
| Redis xomush shud | API kor mekunad: kesh **bypass** (to'g'ri ba DB), rate limit ba xotira (fallback), queue vazifaro bo xato log mekunad; `/health` → `degraded` |
| Vazifai queue xato kard | **retry 5 bor** bo backoff-i eksponensiali (1s, 2s, 4s…); ba'd → navbati "failed", dar log/Sentry |
| Worker xomush ast | Vazifaho dar Redis memonand va pas az ba kor andoxtan ijro meshavand — hech chiz gum nameshavad |
| Darxosti takrori (2 klik) | Hamai amalho **idempotent**: like/follow/save — `createMany skipDuplicates` yo `upsert`; counter faqat agar satr voqean sohta shud |
| Du darxost dar yak vaqt (race) | Constraint-hoi DB (`@unique`, `@@id`) + transaction; xatoi `P2002` → 409, ne 500 |
| Servisi beruni javob namedihad (S3, NestJS az BFF) | **Timeout**: BFF → API 10 s, API → S3 5 s; xatoi fahmo ba user |
| Xatoi nomatlub dar API | Filter-i global → formati yagona, `requestId` dar har javob va log, Sentry; server namemirad |
| Xato dar yak qismi UI | `error.tsx` dar har segment, Error Boundary baroi har widget (feed kor mekunad, hatto agar Stories xato dihad) |
| Internet qat' shud | TanStack Query retry 2 bor (faqat query; mutation takror nameshavad — amal du bor ijro nashavad); Socket.IO reconnect-i avtomati va pas az ulanish **refetch**-i paymho/notificationho; optimistic update → **rollback** |
| E-mail (kodi parol) naraft | Provayderho ba tartib (Gmail → SMTP → Brevo → Resend), timeout 10 s; javobi API intizori xatro namekashad — [EMAIL.md](EMAIL.md) |
| Hangomi deploy/restart | Graceful shutdown (`enableShutdownHooks`): darxosthoi joriy tamom meshavand, worker vazifai joriyro tamom mekunad |
| Migratsiyai DB | Faqat `prisma migrate` (hech vaqt `db push` dar `main`), migratsiyaho dar Git |

`GET /health` → `{ status: "ok"|"degraded"|"down", db, redis, s3 }` (`@nestjs/terminus`).

### 6.4 Digar
- **Pagination:** hamai ruyxatho — **cursor-based** (`?cursor=&limit=`), limit-i peshfarz 20, maks. 50.
- **Formati xato:** yagona baroi hama (`specs/00-umumi.md`).
- **Responsive:** desktop (≥1264px), planshet (768–1263px), mobil (<768px) — misli Instagram.
- **Sifat:** **emoji istifoda nabared** (kod, UI, commit, hujjatho); TypeScript `strict`, ESLint + Prettier, CI dar har PR (`lint → typecheck → test → build`); har modul — e2e baroi "happy path" + xatohoi asosi; Playwright — 5 senariyai asosi (register, post, like, follow, direct).

Tafsiloti infra (kalidhoi Redis, queue-ho, CI, health): [specs/11-infra-bovarinoki.md](specs/11-infra-bovarinoki.md).

## 7. Dizayn

Purra misli Instagram-i veb. Rangho, shriftho, andozaho va layout — dar [specs/10-frontend-dizayn.md](specs/10-frontend-dizayn.md).

> Logotip va brendi rasmi Instagram tamgai molikiyati Meta ast. Loyiha baroi omuzish ast — onro bo hamin nom ba internet publish nakuned.

## 8. Muhiti kor (Environment)

- Node.js ≥ 22 (hast: v24), pnpm ≥ 9 (`corepack enable`), Docker Desktop (baroi PostgreSQL + Redis + MinIO).
- Agar Docker nest: PostgreSQL va Redis (Memurai baroi Windows) lokali, baroi media MinIO.exe yo AWS S3.
- Hosting (berun az 4 ruz): Vercel (web) + Railway/Render (api + worker) + Neon (Postgres) + Upstash (Redis) + S3/CloudFront.
- Fayli `.env.example` dar `apps/api` va `apps/web` — hamai tagyirandaho onjo navishta meshavand.

## 9. Kriteriyahoi qabul (Definition of Done)

Loyiha tayyor hisob meshavad, agar:
1. `pnpm install && docker compose up -d && pnpm dev` — api va web har du bemushkilot ba kor medaroyand.
2. Hamai funksiyahoi **P0** dar jadvali §2 kor mekunand va dar `docs/PROGRESS.md` qayd shudaand.
3. Ruyxatgiri bo username-i takrori (hatto bo harfhoi kalon) → xatoi "Username band ast" (409).
4. Du brauzer: paym dar Direct va notification dar realtime merasand.
5. Dizayn dar desktop va mobil ba Instagram monand ast; **rangho 100% ranghoi asli Instagram** (tokenhoi `--ig-*` az CSS-i instagram.com, `specs/10` §1, AC9–AC10).
6. `pnpm lint`, `pnpm typecheck`, `pnpm test` bidun xato; CI dar GitHub sabz.
7. Swagger dar `/api/docs` hamai endpoint-horo nishon medihad.
8. Dar brauzer (DevTools → Application) token dar `localStorage` **nest**, faqat cookie-hoi httpOnly.
9. Redis-ro qat' kuned → sayt kor mekunad (sust tar), `/health` = `degraded`. Redis-ro bargardoned → hama bargasht.
10. Worker-ro qat' kuned, like kuned, worker-ro ba kor andozed → notification merasad (gum nashud).
11. Lighthouse dar `/` va `/[username]`: Performance ≥ 85, LCP < 2.5 s, CLS < 0.1.

## 10. Hujjatho

| Fayl | Chi dorad |
|---|---|
| [TASKS.md](TASKS.md) | 36 vazifa bo ID (BE/FE/QA), kas, ruz, "Tayyor, agar" — har kadom Issue-i GitHub |
| [ROADMAP.md](ROADMAP.md) | Versiyaho v0.1 → v2.0: chi, kay, kriteriyai tayyori |
| [PLAN.md](PLAN.md) | Naqshai 4 ruz, soat ba soat, baroi A va B |
| [PROGRESS.md](PROGRESS.md) | Chi tayyor, chi dar jarayon, chi monda |
| [specs/00-umumi.md](specs/00-umumi.md) | Qoidahoi umumii API, xatoho, pagination, modeli DB |
| [specs/01-auth.md](specs/01-auth.md) | Auth |
| [specs/02-users-follow.md](specs/02-users-follow.md) | Profil va follow |
| [specs/03-media.md](specs/03-media.md) | S3 + CDN |
| [specs/04-posts.md](specs/04-posts.md) | Post, like, comment, saved |
| [specs/05-feed-explore-search.md](specs/05-feed-explore-search.md) | Feed, Explore, Search |
| [specs/06-stories.md](specs/06-stories.md) | Stories |
| [specs/07-reels.md](specs/07-reels.md) | Reels |
| [specs/08-direct.md](specs/08-direct.md) | Direct (chat) |
| [specs/09-notifications.md](specs/09-notifications.md) | Notifications |
| [specs/10-frontend-dizayn.md](specs/10-frontend-dizayn.md) | Dizayn, rangho, sahifaho, BFF |
| [specs/11-infra-bovarinoki.md](specs/11-infra-bovarinoki.md) | Redis, BullMQ, worker, health, CI, Sentry |

## 11. Marhilahoi kalon shudan (baroi oyanda)

| Marhila | Chi ilova meshavad |
|---|---|
| **Start (in 4 ruz)** | Monolit, yak Postgres, Redis, BullMQ, S3 + CDN |
| Rushd | Replica-i Postgres baroi xondan, chand nusxai API pasi load balancer (Socket.IO bo Redis adapter alla'kay tayyor), keshi aggressivtar |
| Sarborii kalon | Feed → fan-out on write (feed dar Redis), media va notifications → servishoi alohida, Kafka, Meilisearch |
| Miqyosi kalon | Sharding, multi-region, Kubernetes |
