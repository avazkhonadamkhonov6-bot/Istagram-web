# Spec 11 — Infra va bovarinoki (Redis, BullMQ, Worker, Health, CI)

**Ma'sul:** B (Redis/Queue/Worker), A (CI, health, Sentry) · **Ruz:** 1–2 · **Prioritet:** P0

## 1. docker-compose (lokali)

| Servis | Image | Port | Qayd |
|---|---|---|---|
| `postgres` | `postgres:16` | 5432 | volume `pgdata`, `healthcheck: pg_isready` |
| `redis` | `redis:7` | 6379 | `--appendonly yes` (vazifahoi queue pas az restart gum nameshavand) |
| `minio` | `minio/minio` | 9000 / 9001 (konsol) | volume `minio` |
| `minio-init` | `minio/mc` | — | bucket `instagram` + `anonymous set download` |

Parolho faqat dar `.env` (dar Git — faqat `.env.example`). Dar production — az secrets.

## 2. Tagyirandaho (`apps/api/.env.example`)
```
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://app:change_me@localhost:5432/instagram
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...           # >= 32 aloma
JWT_REFRESH_SECRET=...
JWT_WS_SECRET=...
S3_ENDPOINT=... (Spec 03)
SENTRY_DSN=
```
Konfiguratsiya hangomi start bo **Zod** tekshirida meshavad — agar tagyirandae nest yo galat → API **ba kor namedaroyad** va aniq meguyad chi kam ast (xato dar vaqti kor ne, dar start).

`apps/web/.env.example`: `API_URL=http://localhost:4000`, `NEXT_PUBLIC_WS_URL=http://localhost:4000`, `NEXT_PUBLIC_CDN_URL=...`, `SENTRY_DSN=`.

## 3. Redis — kalidho

| Kalid | TTL | Chi | Invalidate kay |
|---|---|---|---|
| `cache:user:{username}` | 60 s | profil (bidun `isFollowing`) | update profil, follow/unfollow |
| `cache:feed:{userId}:first` | 30 s | sahifai avvali feed (ID-hoi post) | posti nav az follow-shuda — TTL kifoya |
| `cache:post:{id}` | 60 s | PostDto bidun `isLiked/isSaved` | like, comment, edit, delete |
| `rl:*` | avtomat | rate limit (throttler storage) | — |
| `online:{userId}` | 60 s (heartbeat) | presence (P1) | disconnect |
| `bull:*` | — | BullMQ | — |

**Qoidai muhim:** Redis — **kesh**, ne manba'i haqiqat. Counter-ho (`likeCount`...) dar **PostgreSQL** dar yak transaction tagyir meyoband. Chiro? Agar counter faqat dar Redis boshad va Redis restart shavad yo bo DB farq kunad — raqamho galat meshavand. Kesh-ro hamesha metavon az DB az nav sokht.

**Wrapper:** `CacheService.getOrSet(key, ttl, loader)` — agar Redis xato dihad → `loader()`-ro mustaqim ijro mekunad (bypass) va warning log mekunad. Hech vaqt xatoi Redis ba user namerasad.

## 4. Queue-ho (BullMQ)

| Queue | Job | Payload | Ki meguzorad |
|---|---|---|---|
| `notifications` | `create` | `{ type, actorId, recipientId, postId?, commentId? }` | listener-i `PostLiked`, `CommentCreated`, `UserFollowed` |
| `notifications` | `remove` | `{ type, actorId, recipientId, postId?, commentId? }` | unlike, unfollow, hazfi comment |
| `media` | `process-image` | `{ key, ownerId, target: 'post'|'avatar'|'story', targetId }` | pas az sohtani post/story/avatar |
| `media` | `video-thumbnail` (P1) | `{ key, targetId }` | |
| `maintenance` | `cleanup-stories` | — | **repeatable**, har 1 soat |
| `maintenance` | `cleanup-refresh-tokens` | — | repeatable, har 24 soat |

**Tanzimoti umumi:**
```ts
defaultJobOptions: {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
}
```
- **Idempotentnost:** `jobId` muayyan (masalan `like:{actorId}:{postId}`) — vazifai takrori ilova nameshavad; processor ham idempotent (`upsert`).
- Worker — process-i alohida: `pnpm --filter api worker` (hamon kod, `src/worker.ts`). Dar dev `turbo dev` har duro ba kor medarorad.
- Worker pas az sohtani notification → `RealtimeService.emitToUser()` tavassuti **Redis adapter** (worker va API — process-hoi gunogun, vale event ba socket merasad).

### Masalan: rohi yak like (purra)
1. User ❤ mezanad → UI favran `+1` (optimistic).
2. Brauzer → `POST /api/posts/42/like` (Next BFF) → cookie → `Authorization` → NestJS.
3. NestJS: transaction `like.createMany({ skipDuplicates })`; **faqat agar `count === 1`** → `likeCount++`. Javob `{ isLiked, likeCount }`.
4. `cache:post:42` hazf meshavad; event `PostLiked` → job `notifications.create` (jobId-i yakxela).
5. Worker: notification dar DB → `notification:new` ba room `user:<authorId>`.
6. Agar qadami 3 xato dihad → UI `-1` mekunad (rollback) va toast nishon medihad.

## 5. Health, log, xatoho

- `GET /api/v1/health` 🔓 (`@nestjs/terminus`): `db` (SELECT 1), `redis` (PING), `s3` (HeadBucket) → `ok | degraded | down`. Redis/S3 xomush → `degraded` (200), DB xomush → `down` (503).
- Log: `nestjs-pino`, JSON, har darxost bo `requestId` (header `x-request-id`, BFF onro mefiristad). Parol, token, cookie dar log **pinhon** (`redact`).
- Sentry: API (filter-i global → `captureException` faqat baroi 5xx), web (`@sentry/nextjs`). Agar `SENTRY_DSN` xoli — xomush.
- Graceful shutdown: `app.enableShutdownHooks()`; worker: `worker.close()` dar `SIGTERM`.
- Timeout: BFF → API `AbortSignal.timeout(10_000)`; Prisma `connection_limit` va `pool_timeout`.

## 6. CI (GitHub Actions) — `.github/workflows/ci.yml`

Dar har PR va push ba `main`:
1. `pnpm install --frozen-lockfile` (kesh-i pnpm)
2. `pnpm lint`
3. `pnpm typecheck`
4. Servisho: `postgres`, `redis` → `prisma migrate deploy` → `pnpm test` (unit + e2e-i API)
5. `pnpm build`
6. `pnpm audit --audit-level=high`

Qoida: PR bo CI-i surkh **merge nameshavad** (branch protection dar `main`).
Playwright (5 senariyai asosi) — ruzi 4, lokali; dar CI — P1.

## AC
- [ ] AC1: `docker compose up -d` → har 3 servis `healthy`.
- [ ] AC2: `.env` bidun `JWT_ACCESS_SECRET` → API ba kor namedaroyad bo xatoi fahmo.
- [ ] AC3: `docker stop redis` → `GET /feed` kor mekunad, `/health` = `degraded`.
- [ ] AC4: Worker xomush → like → worker-ro ba kor andoxtan → notification sohta shud.
- [ ] AC5: 2 like-i parallel az yak user → `likeCount` = 1, 1 notification.
- [ ] AC6: Dar log parol va token nest.
- [ ] AC7: PR bo xatoi TypeScript → CI surkh.
