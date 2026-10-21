# PROGRESS — Kujo hastem, chi monda

> Pas az merge-i PR → `[x]`. Tafsiloti har vazifa — [TASKS.md](TASKS.md) va GitHub Issues.
> Holat: TODO — ogoz nashud · DOING — dar jarayon · DONE — tayyor · BLOCKED — masala

**Holati umumi:** Ruzi 1: TODO · Ruzi 2: TODO · Ruzi 3: TODO · Ruzi 4: TODO
**Hozir:** hamai vazifahoi Avaz (BE-01…BE-12, FE-13, 15, 17, 19, 21, QA-01) tayyor; API e2e 18/18, Playwright 7/7 → navbat: README/demo · Abubakr: FE-04 mock, FE-06…FE-12

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
| [x] | BE-04 Account API | [ ] | FE-04 MSW mock |
| [x] | BE-05 User, UserProfile, FollowingRelationShip | [x] | FE-05 Layout |

## RUZI 2
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-06 Media: upload-i multipart ba disk, `/images/*` | [ ] | FE-06 Login / Signup |
| [x] | BE-07 Post, like, comment, favorite | [ ] | FE-07 Feed + PostCard |
| [x] | BE-08 Feed (`get-following-post`), search (`get-users`, search history) | [ ] | FE-08 Post modal |
| [x] | BE-09 Realtime gateway `/ws` (Notifications — P1) | [ ] | FE-09 Profil |
| [x] | BE-10 Story API | [ ] | FE-10 Edit profile + parol |

## RUZI 3
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-11 Chat + Reels + Location API | [ ] | FE-11 Explore, Search |
| [x] | BE-12 Seed + e2e (18 test, sabz) → **API freeze** | [ ] | FE-12 Notifications panel |
| [x] | FE-13 BFF (`/api/auth/*`, `/api/[...path]`, `/api/realtime/ticket`) + proxy.ts + CSP | [ ] | FE-14 Mock xomush, integratsiya |
| [x] | FE-15 Socket (ticket 60 s, reconnect + refetch) + realtime-i Direct | [ ] | FE-16 Stories |

## RUZI 4
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | FE-17 Direct: inbox, chat, optimistic, unsend, New message | [ ] | FE-18 Create modal |
| [x] | FE-19 Bovarinokii front: error.tsx, WidgetBoundary, offline banner, rollback | [ ] | FE-20 Reels |
| [x] | FE-21 Playwright: 7 test (register, post, like, follow, direct x3) | [ ] | FE-22 Pardoz, responsive |
| [x] | QA-01 — [docs/qa/QA-01.md](qa/QA-01.md) | [ ] | QA-02 |
| [ ] | README, `v0.2`, demo | | |

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
