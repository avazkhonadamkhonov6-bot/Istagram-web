# apps/api — NestJS API

**Ma'sul:** Avaz · **Port:** 4000 · **Prefiks:** `/api/v1` · **Swagger:** `/api/docs`

Kod dar BE-01 sohta meshavad (`nest new`). Hozir faqat struktura hast.

## Struktura

```
apps/api/
├─ prisma/
│  ├─ schema.prisma         modeli DB (Spec 00 §4)
│  ├─ migrations/
│  └─ seed.ts               (BE-12)
├─ src/
│  ├─ main.ts               rejimi HTTP
│  ├─ worker.ts             rejimi worker (BullMQ)
│  ├─ app.module.ts
│  ├─ infra/                prisma, redis + cache, queue, s3, health, logger, config (Spec 11)
│  ├─ common/
│  │  ├─ guards/            JwtAuthGuard, @Public
│  │  ├─ pipes/             ZodValidationPipe
│  │  ├─ filters/           filter-i global-i xato
│  │  └─ decorators/        @CurrentUser
│  └─ modules/
│     ├─ auth/              Spec 01 — BE-04
│     ├─ users/             Spec 02 — BE-05
│     ├─ follows/           Spec 02 — BE-05
│     ├─ media/             Spec 03 — BE-06
│     ├─ posts/             Spec 04 — BE-07
│     ├─ comments/          Spec 04 — BE-07
│     ├─ feed/              Spec 05 — BE-08
│     ├─ explore/           Spec 05 — BE-08 (search, hashtag)
│     ├─ realtime/          Spec 08, 09 — BE-09 (gateway)
│     ├─ notifications/     Spec 09 — BE-09
│     ├─ stories/           Spec 06 — BE-10
│     ├─ direct/            Spec 08 — BE-11
│     └─ reels/             Spec 07 — BE-11
└─ test/                    e2e (Supertest)
```

## Strukturai yak modul

```
modules/posts/
├─ posts.module.ts
├─ posts.controller.ts
├─ posts.service.ts
├─ posts.events.ts          (agar event dorad)
└─ posts.e2e-spec.ts
```

DTO-ho dar in papka **nestand** — onho dar `packages/shared` (Zod).

## Qoidaho
- Modul ba jadvalhoi moduli digar mustaqim dast namezanad — faqat tavassuti servisi on.
- Amalhoi vazni (notification, media) — faqat tavassuti queue.
- Har endpoint — mutobiqi spec; har AC — test.
