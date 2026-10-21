# PROGRESS — Kujo hastem, chi monda

> Pas az merge-i PR → `[x]`. Tafsiloti har vazifa — [TASKS.md](TASKS.md) va GitHub Issues.
> Holat: TODO — ogoz nashud · DOING — dar jarayon · DONE — tayyor · BLOCKED — masala

**Holati umumi:** Ruzi 1: TODO · Ruzi 2: TODO · Ruzi 3: TODO · Ruzi 4: TODO
**Hozir (2026-10-22):** API dar Render: https://istagram-web.onrender.com (Swagger — `/swagger`), baza umumi — Avaz va Abubakr bo yak maʼlumot kor mekunand. Backend-i [Spec 16](specs/16-zang-va-efir.md) (zang, paymi ovozi / video, efir) tayyor, e2e 48/48. Navbat — FE-30 (Avaz), FE-31 (Abubakr), FE-26, FE-29.
**Pesh az in:** hamai vazifahoi Avaz (BE-01…BE-12, FE-13, 15, 17, 19, 21, QA-01) tayyor; API e2e 18/18, Playwright 7/7 → navbat: README/demo · Abubakr: FE-04 mock, FE-06…FE-12

## Hujjatho
- [x] TZ.md, PLAN.md, ROADMAP.md, TASKS.md
- [x] specs/00–11
- [x] Stack: Redis, BullMQ, BFF, argon2, Zod, shadcn/ui, CI, Sentry
- [x] Taqsimi kor: Avaz (backend → front), Abubakr (front bo mock)

## RUZI 1
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-01 Monorepo (pnpm 10, NestJS 11, tsconfig strict) | [x] | FE-01 Tayyori, Next 16 docs |
| [x] | BE-02 Kontrakt (Zod) — Spec 12, `packages/shared` | [x] | FE-02 Rangho, dark, shadcn |
| [x] | BE-03 Prisma + migratsiya, infra, CI, docker-compose (faqat Postgres) | [x] | FE-03 Komponenthoi UI |
| [x] | BE-04 Account API | [x] | FE-04 MSW mock |
| [x] | BE-05 User, UserProfile, FollowingRelationShip | [x] | FE-05 Layout |

## RUZI 2
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-06 Media: upload-i multipart ba disk, `/images/*` | [~] | FE-06 Login / Signup |
| [x] | BE-07 Post, like, comment, favorite | [x] | FE-07 Feed + PostCard |
| [x] | BE-08 Feed (`get-following-post`), search (`get-users`, search history) | [x] | FE-08 Post modal |
| [x] | BE-09 Realtime gateway `/ws` (Notifications — P1) | [x] | FE-09 Profil |
| [x] | BE-10 Story API | [~] | FE-10 Edit profile + parol |

## RUZI 3
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-11 Chat + Reels + Location API | [x] | FE-11 Explore, Search |
| [x] | BE-12 Seed + e2e (18 test, sabz) → **API freeze** | [x] | FE-12 Notifications panel |
| [x] | FE-13 BFF (`/api/auth/*`, `/api/[...path]`, `/api/realtime/ticket`) + proxy.ts + CSP | [x] | FE-14 Mock xomush, integratsiya |
| [x] | FE-15 Socket (ticket 60 s, reconnect + refetch) + realtime-i Direct | [~] | FE-16 Stories |

## RUZI 4
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | FE-17 Direct: inbox, chat, optimistic, unsend, New message | [ ] | FE-18 Create modal |
| [x] | FE-19 Bovarinokii front: error.tsx, WidgetBoundary, offline banner, rollback | [ ] | FE-20 Reels |
| [x] | FE-21 Playwright: 7 test (register, post, like, follow, direct x3) | [ ] | FE-22 Pardoz, responsive |
| [x] | QA-01 — [docs/qa/QA-01.md](qa/QA-01.md) | [ ] | QA-02 |
| [x] | FE-23 Direct-i Spec 14 (group, dil, reply, ovoz, story) | [ ] | FE-26 UI-i Spec 14 |
| [x] | FE-24 `/accounts/*` (privacy, blocked, muted, restricted, close friends, archive) | | |
| [x] | FE-25 `/explore/locations/[name]`, `social/api.ts`, Share / Report dialog | | |
| [x] | BE-13 backend-i Spec 15 + seed (40 user, 35 reel, 101 story) | [ ] | FE-29 UI-i Spec 15 |
| [x] | FE-27 Direct (notes, edit, "Active now") | | |
| [x] | FE-28 `/accounts/favorites`, `/accounts/activity` | | |
| [ ] | README, `v0.2`, demo | | |

## RUZI 5
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | Deploy: Render (API + Postgres), faylho dar DB (MediaFile), seed-i xudkor | | |
| [x] | BE-14 backend-i Spec 16: zang, paymi ovozi / video, efir | | |
| [x] | FE-30 Direct: zangi audio / video, paymi ovozi va video + sahifahoi efir (`/live`) | [ ] | FE-31 Darvozahoi efir (Create, story tray, notification) |

## Qaydho / masalaho
- 2026-10-21: Kontrakti API ivaz shud — endpoint-ho aynan misli Swagger-i "Web Api" (`/Account/*`, `/Post/*`, `/Chat/*`...): [Spec 12](specs/12-api-kontrakt.md). URL/DTO-hoi spec-hoi 01–09 digar amal namekunand; qoidahoi amniyat boqi memonand.
- 2026-10-21: To P1 buridashud: Redis/BullMQ, Notifications, presign S3, refresh token (Spec 12 §10).
- 2026-10-21: Docker nest; PostgreSQL 18-i lokali (port 5432) istifoda meshavad. Ogoz: `pnpm --filter api db:deploy`, `pnpm --filter api db:seed`, `pnpm --filter api dev`, test: `pnpm --filter api test`.
- 2026-10-20: Dar kompyuteri Avaz **pnpm** va **Docker** hanuz nasb nashudaand → BE-01 / BE-03.
- 2026-10-20: Muhlati 4 ruz zich ast — tartibi buridan dar PLAN.md.
- 2026-10-20: Counter-ho dar PostgreSQL (Redis faqat kesh); CAPTCHA, Meilisearch, Kafka, K8s — berun az 4 ruz (ROADMAP).
- 2026-10-21: FE-13/15/17 dar brauzer sanjida shud (login, cookie-i httpOnly, `document.cookie` xoli, CSP bo nonce, paym dar realtime < 1 s, unsend, New message, mobil 375px, logout). Ticket-i Socket: `POST /Account/ws-ticket` (60 s), gateway JWT-i asosiro qabul namekunad.
- 2026-10-21: Typing, Seen, share post va badge-i notifications — nest, chunki dar kontrakti Spec 12 endpoint/event nadorand (P1).
- 2026-10-21 (baroi Abubakr): `src/components/layout/sidebar.tsx` — `usePathname()` berun az `<Suspense>` (Next 16 `cacheComponents` ogohi "Blocking Route" medihad). `CURRENT_USERNAME = "me"` boyad az `GET /api/UserProfile/get-my-profile` ivaz shavad. Aksho: `/api/images/<fileName>` (`lib/media.ts`), login: `POST /api/auth/login`.
- 2026-10-21: FE-19/FE-21/QA-01 tayyor. Dar QA 5 xato yoft va islohshud (parol dar log, rate limit dar BFF, offline rollback, ruyxati chat, status 201) — [QA-01](qa/QA-01.md).
- 2026-10-21 (baroi Abubakr): `OfflineBanner` (`src/components/offline-banner.tsx`) hozir faqat dar Direct ast — onro ba root layout guzored. `WidgetBoundary` baroi Stories/Suggestions/PostCard tayyor ast. Bo FE-07/FE-09/FE-18 senariyahoi Playwright-i post/like/follow ba UI guzaronida meshavand.
- 2026-10-21: [Spec 13](specs/13-ilovaho-tz.md) — funksiyahoi P0/P1-i TZ, ki dar Swagger-i "Web Api" nabudand, ilova shudand (57 endpoint-i Spec 12 tagyir nayoftand): Notifications + realtime, Explore, Hashtag, javob ba comment, Direct (Seen, typing, unread, share post), Suggestions. API e2e 24/24, Playwright 8/8.
- 2026-10-21: Rangho: hamai 62 tokeni rangi Spec 10 §1 dar `globals.css` mos (174 sanjish, light + dark); AC2 = 0.
- 2026-10-21: FE-23…FE-25 tayyor va dar brauzer sanjida shud (group chat, dil-i paym, reply, private on/off, close friends, archive, location). `tsc`, `eslint` (0 xato), `next build` — sabz.
- 2026-10-21 (baroi Abubakr): dar `components/layout/bottom-nav.tsx` hydration mismatch: `href="/me"` dar server, `"/avaz"` dar client — linki profil boyad pas az mount ivaz shavad. Linkho ba `/accounts/privacy` (FE-24) ba `more-menu` / `settings-nav` ilova kuned.
- 2026-10-21: [Spec 15](specs/15-funksiyahoi-ilovagi.md) — sanjishi backend bo Instagram: 15 endpoint-i nav (notes, remove follower, favorites + feed, pin-i comment, liked posts, user reels, tahriri paym, "Active now"). Seed: 40 user, 235 post (35 reel), 101 story, 9 note. API e2e 40/40; Direct va `/accounts/favorites|activity` dar brauzer sanjida shudand.
- 2026-10-21 (baroi Abubakr): ranghoi ilovagii instagram.com dar Spec 10 §1.11.1 — ba `globals.css` ilova kuned (FE-29). Pas az `db:seed` user-ho nav meshavand — dar brauzer az nav login kuned.
- 2026-10-22: Deploy ba Render. API: https://istagram-web.onrender.com, Swagger: https://istagram-web.onrender.com/swagger. Baroi kor bo bazai umumi dar `apps/web/.env.local`: `API_URL=https://istagram-web.onrender.com`, `NEXT_PUBLIC_WS_URL=https://istagram-web.onrender.com`, `NEXT_PUBLIC_API_MOCKING=off`. Har `git push` ba `main` → Render xudkor deploy mekunad, maʼlumoti baza nigoh doshta meshavad. Plan-i free: pas az 15 daq. bekori server "xob" meravad (darxosti avval ~50 s); bazai free pas az 30 ruz muhlatash meguzarad.
- 2026-10-22: [Spec 16](specs/16-zang-va-efir.md) — zangi audio / video (WebRTC, server — signaling), paymi ovozi / video bo `Duration`, efiri mustaqim. 12 endpoint-i nav, socket `call:*` va `live:*`. API e2e 48/48. Front: FE-30 (Avaz), FE-31 (Abubakr).
- 2026-10-22: FE-30 tayyor va dar du brauzer (avaz + abubakr) sanjida shud: zangi audio va video (tasvir va ovoz har du taraf, mute, kamera, rad → "Call declined", paymi zang + "Call back"), paymi ovozi va video (MP4, ovoz dar fayl sanjida shud), efir (video + ovoz, comment, dil, anjom). Xatohoi yoftshuda va islohshuda: `myId` pas az zang pok meshud; `scrollIntoView` dar Chrome-i nav Promise bar megardonad (effect-i efir vayron meshud); poygai join dar efir (token + watchdog 8 s); event-hoi socket pesh az auth (server akkun intizor meshavad); paymi ovozii MP4 qismi avvalro gum mekard (bidun timeslice).
- 2026-10-22 (muhim): zang va efir bevosita bayni brauzerho meravand (WebRTC). Dar yak shabaka yo bo aksari internet-ho STUN kifoya ast; agar bayni du shabakai gunogun (masalan, Wi-Fi va internet-i mobil) ovoz / video naoyad — serveri TURN lozim: dar Render ba `Istagram-web` → Environment `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` guzoshta meshavad (masalan, hisobi roygoni Metered yo Cloudflare). OpenRelay-i ozod sanjida shud — kor namekunad.
- 2026-10-22 (baroi hardu): dar rejimi production (`next build` + `next start`) sahifahoi statiki (login va g.) nonce-i CSP nadorand va skriptho bastа meshavand (Next 16: nonce faqat dar rendering-i dinamiki). Hal — dar root layout `await connection()` (fayli umumi, `src/app/layout.tsx`) yo CSP bidun nonce. Dar `pnpm dev` kor mekunad. Hanuz isloh nashudaast.
- 2026-10-22 (baroi Abubakr): hydration mismatch dar `sidebar.tsx` va `bottom-nav.tsx` (`/me` dar server, `/avaz` dar client) hanuz hast.

