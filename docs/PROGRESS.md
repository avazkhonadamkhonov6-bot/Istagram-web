# PROGRESS — Kujo hastem, chi monda

> Pas az merge-i PR → `[x]`. Tafsiloti har vazifa — [TASKS.md](TASKS.md) va GitHub Issues.
> Holat: TODO — ogoz nashud · DOING — dar jarayon · DONE — tayyor · BLOCKED — masala

**Holati umumi:** Ruzi 1: TODO · Ruzi 2: TODO · Ruzi 3: TODO · Ruzi 4: TODO
**Hozir:** backend tayyor va sanjida shud (e2e 18/18, [Spec 12](specs/12-api-kontrakt.md)) → **API freeze**, navbat: FE-13 BFF (Avaz) · **FE-01** (Abubakr)

## Hujjatho
- [x] TZ.md, PLAN.md, ROADMAP.md, TASKS.md
- [x] specs/00–11
- [x] Stack: Redis, BullMQ, BFF, argon2, Zod, shadcn/ui, CI, Sentry
- [x] Taqsimi kor: Avaz (backend → front), Abubakr (front bo mock)

## RUZI 1
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-01 Monorepo (pnpm 10, NestJS 11, tsconfig strict) | [ ] | FE-01 Tayyori, Next 16 docs |
| [x] | BE-02 Kontrakt (Zod) — Spec 12, `packages/shared` | [ ] | FE-02 Rangho, dark, shadcn |
| [x] | BE-03 Prisma + migratsiya, infra, CI, docker-compose (faqat Postgres) | [ ] | FE-03 Komponenthoi UI |
| [x] | BE-04 Account API | [ ] | FE-04 MSW mock |
| [x] | BE-05 User, UserProfile, FollowingRelationShip | [ ] | FE-05 Layout |

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
| [ ] | FE-13 BFF + proxy + CSP | [ ] | FE-14 Mock xomush, integratsiya |
| [ ] | FE-15 Socket + realtime | [ ] | FE-16 Stories |

## RUZI 4
| | Avaz | | Abubakr |
|---|---|---|---|
| [ ] | FE-17 Direct | [ ] | FE-18 Create modal |
| [ ] | FE-19 Bovarinokii front | [ ] | FE-20 Reels |
| [ ] | FE-21 Playwright | [ ] | FE-22 Pardoz, responsive |
| [ ] | QA-01 | [ ] | QA-02 |
| [ ] | README, `v0.2`, demo | | |

## Qaydho / masalaho
- 2026-10-21: Kontrakti API ivaz shud — endpoint-ho aynan misli Swagger-i "Web Api" (`/Account/*`, `/Post/*`, `/Chat/*`...): [Spec 12](specs/12-api-kontrakt.md). URL/DTO-hoi spec-hoi 01–09 digar amal namekunand; qoidahoi amniyat boqi memonand.
- 2026-10-21: To P1 buridashud: Redis/BullMQ, Notifications, presign S3, refresh token (Spec 12 §10).
- 2026-10-21: Docker nest; PostgreSQL 18-i lokali (port 5432) istifoda meshavad. Ogoz: `pnpm --filter api db:deploy`, `pnpm --filter api db:seed`, `pnpm --filter api dev`, test: `pnpm --filter api test`.
- 2026-10-20: Dar kompyuteri Avaz **pnpm** va **Docker** hanuz nasb nashudaand → BE-01 / BE-03.
- 2026-10-20: Muhlati 4 ruz zich ast — tartibi buridan dar PLAN.md.
- 2026-10-20: Counter-ho dar PostgreSQL (Redis faqat kesh); CAPTCHA, Meilisearch, Kafka, K8s — berun az 4 ruz (ROADMAP).
