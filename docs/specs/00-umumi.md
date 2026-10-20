# Spec 00 — Qoidahoi umumi va modeli ma'lumot

## 1. SDD — chi guna kor mekunem

1. **Spec-ro xoned** → fahmed chi endpoint, chi DTO, chi xato.
2. **Zod schema-ho va tipho** dar `packages/shared` (`z.infer<>`) → api (`ZodValidationPipe`) va web (formaho, tekshirishi javob) yak qoidaro istifoda mebarand. Agar API tagyir yobad — frontend favran xatoi TypeScript nishon medihad.
3. **Kod** dar `apps/api/src/modules/<modul>`.
4. **Test** — har "Kriteriyai qabul" (AC) dar spec = kamash yak test yo tekshirishi dasti.
5. **PROGRESS.md**-ro navsozi kuned (checkbox).
6. Agar dar vaqti kor fahmided ki spec galat ast — **avval specro islah kuned**, ba'd kod.

## 2. Qoidahoi API

- Base URL: `/api/v1`
- Format: JSON, `camelCase`
- Sana: ISO 8601 (`2026-10-20T10:00:00.000Z`)
- ID: `uuid`
- Auth: header `Authorization: Bearer <accessToken>` — onro **BFF-i Next.js** az cookie-i httpOnly ilova mekunad (Spec 01, TZ §5.3).
- Har javob header-i `x-request-id` dorad (baroi justujui xato dar log). Hamai endpoint-ho himoyashuda hastand, gayr az onho ki bo ** public** qayd shudaand.
- Usernameho dar URL: `/users/:username` (lowercase).

### Formati xato (yagona)

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "USERNAME_TAKEN",
  "message": "In username band ast",
  "details": null
}
```

| Status | Kay |
|---|---|
| 400 | Validatsiya (`code: VALIDATION_ERROR`, `details`: ruyxati maydonho) |
| 401 | Token nest / noto'g'ri / muhlatash guzashtaast |
| 403 | Ijozat nest (masalan posti digarro hazf kardan) |
| 404 | Yoft nashud |
| 409 | Konflikt (username band, alla'kay follow kardaast) |
| 429 | Darxost ziyod (rate limit) |

`code`-ho dar `packages/shared/src/error-codes.ts` nigoh doshta meshavand.

### Pagination (cursor)

Darxost: `GET /posts/:id/comments?cursor=<id>&limit=20`

```json
{ "items": [ ... ], "nextCursor": "c1d2..." }
```

`nextCursor = null` → digar ma'lumot nest. Tartib: `createdAt DESC, id DESC`.

## 3. Ob'ekthoi umumii javob (packages/shared)

```ts
// Useri kutoh — dar hama jo (post author, comment, followers)
interface UserPreview {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

interface Media {
  id: string;
  url: string;            // CDN URL
  type: 'IMAGE' | 'VIDEO';
  width: number;
  height: number;
  thumbnailUrl: string | null;
}
```

## 4. Modeli ma'lumot (Prisma)

> Fayl: `apps/api/prisma/schema.prisma`. In schema — **manba'i haqiqat** baroi DB.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum MediaType   { IMAGE VIDEO }
enum MediaStatus { PROCESSING READY FAILED }
enum PostType    { POST REEL }
enum NotificationType { LIKE COMMENT FOLLOW COMMENT_REPLY }

model User {
  id             String   @id @default(uuid())
  username       String   @unique            // hamesha lowercase
  passwordHash   String
  fullName       String?
  bio            String?  @db.VarChar(150)
  website        String?
  avatarKey      String?
  isVerified     Boolean  @default(false)
  isPrivate      Boolean  @default(false)    // P2
  followersCount Int      @default(0)
  followingCount Int      @default(0)
  postsCount     Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  refreshTokens  RefreshToken[]
  posts          Post[]
  comments       Comment[]
  likes          Like[]
  saved          SavedPost[]
  followers      Follow[] @relation("following")
  following      Follow[] @relation("follower")
  stories        Story[]
  storyViews     StoryView[]
  participants   ConversationParticipant[]
  messages       Message[]
  notifications  Notification[] @relation("recipient")
  actedNotifs    Notification[] @relation("actor")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User @relation("follower",  fields: [followerId],  references: [id], onDelete: Cascade)
  following   User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  @@id([followerId, followingId])
  @@index([followingId])
}

model Post {
  id           String   @id @default(uuid())
  authorId     String
  type         PostType @default(POST)
  caption      String?  @db.VarChar(2200)
  location     String?
  likeCount    Int      @default(0)
  commentCount Int      @default(0)
  viewCount    Int      @default(0)          // baroi Reels
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  media        PostMedia[]
  likes        Like[]
  comments     Comment[]
  saved        SavedPost[]
  hashtags     PostHashtag[]
  @@index([authorId, createdAt])
  @@index([type, createdAt])
}

model PostMedia {
  id           String    @id @default(uuid())
  postId       String
  key          String                         // S3 key
  type         MediaType
  width        Int
  height       Int
  durationSec  Int?
  thumbnailKey String?
  variants     Json?                          // { "1080": key, "640": key, "320": key } — az worker
  status       MediaStatus @default(PROCESSING)
  order        Int
  post         Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId])
}

model Like {
  userId    String
  postId    String
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@id([userId, postId])
  @@index([postId])
}

model Comment {
  id         String   @id @default(uuid())
  postId     String
  authorId   String
  parentId   String?                          // javob ba comment (1 sath)
  text       String   @db.VarChar(2200)
  replyCount Int      @default(0)
  createdAt  DateTime @default(now())
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author     User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent     Comment? @relation("replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies    Comment[] @relation("replies")
  @@index([postId, createdAt])
  @@index([parentId])
}

model SavedPost {
  userId    String
  postId    String
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@id([userId, postId])
}

model Hashtag {
  id    String @id @default(uuid())
  name  String @unique                         // lowercase, bidun '#'
  posts PostHashtag[]
}

model PostHashtag {
  postId    String
  hashtagId String
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  hashtag   Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)
  @@id([postId, hashtagId])
  @@index([hashtagId])
}

model Story {
  id        String    @id @default(uuid())
  authorId  String
  key       String
  type      MediaType
  durationSec Int?
  createdAt DateTime  @default(now())
  expiresAt DateTime                          // createdAt + 24 soat
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  views     StoryView[]
  @@index([authorId, expiresAt])
}

model StoryView {
  storyId  String
  viewerId String
  viewedAt DateTime @default(now())
  story    Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
  viewer   User  @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  @@id([storyId, viewerId])
}

model Conversation {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  lastMessageAt DateTime @default(now())
  participants  ConversationParticipant[]
  messages      Message[]
  @@index([lastMessageAt])
}

model ConversationParticipant {
  conversationId String
  userId         String
  lastReadAt     DateTime?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([conversationId, userId])
  @@index([userId])
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  clientId       String                       // uuid az front — baroi idempotentnost
  text           String?  @db.VarChar(1000)
  mediaKey       String?
  sharedPostId   String?
  createdAt      DateTime @default(now())
  deletedAt      DateTime?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  @@unique([senderId, clientId])
  @@index([conversationId, createdAt])
}

model Notification {
  id          String           @id @default(uuid())
  recipientId String
  actorId     String
  type        NotificationType
  postId      String?
  commentId   String?
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())
  recipient   User @relation("recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor       User @relation("actor",     fields: [actorId],     references: [id], onDelete: Cascade)
  @@index([recipientId, createdAt])
}
```

### Qoidahoi counter-ho

Counter-ho (`likeCount`, `followersCount`, ...) **dar yak transaction** bo amal tagyir meyoband:

```ts
await prisma.$transaction([
  prisma.like.create({ data: { userId, postId } }),
  prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
]);
```

## 5. Strukturai har modul (NestJS)

```
src/modules/posts/
├─ posts.module.ts
├─ posts.controller.ts
├─ posts.service.ts
├─ dto/  create-post.dto.ts, update-post.dto.ts
└─ posts.e2e-spec.ts
```

Modulhoi umumi (`src/infra/`): `PrismaModule`, `ConfigModule` (bo tekshirishi Zod), `RedisModule` + `CacheService`, `QueueModule` (BullMQ), `S3Module`, `HealthModule`, `LoggerModule` (pino). `common/`: `JwtAuthGuard` (global) + `@Public()`, `@CurrentUser()`, `ZodValidationPipe`, filter-i global-i xatoho, `paginationSchema`.

**Qoidai modulho:** modul ba jadvalhoi moduli digar mustaqim dast namezanad — faqat tavassuti servisi on. Amalhoi vazni — tavassuti event → queue (Spec 11).

## 6. Seed

`pnpm --filter api db:seed` — 10 user (`user1`…`user10`, parol `password123`), 50 post, follow, like, comment, story — baroi test-i frontend.
