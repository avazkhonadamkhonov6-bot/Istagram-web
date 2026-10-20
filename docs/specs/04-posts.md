# Spec 04 — Posts, Like, Comment, Saved

**Ma'sul:** B · **Ruz:** 1 · **Prioritet:** P0

## Ob'ekti Post (javob)
```ts
interface PostDto {
  id: string;
  type: 'POST' | 'REEL';
  author: UserPreview & { isFollowing: boolean };
  caption: string | null;
  location: string | null;
  media: Media[];               // tartib bo order
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isSaved: boolean;
  previewLikers: UserPreview[]; // 1–2 nafar baroi "Liked by ali and others" (P1)
  createdAt: string;
}
```

## Postho

### `POST /posts`
```json
{
  "type": "POST",
  "caption": "Kuhhoi Pomir #tajikistan #mountains",
  "location": "Pamir",
  "media": [ { "key": "uploads/<me>/a.jpg", "type": "IMAGE", "width": 1080, "height": 1350 } ]
}
```
- `media`: 1–10 element (`type=REEL` → aniq 1 video).
- Har `key` → `MediaService.assertOwnedKey` (Spec 03).
- Hashtag-ho az caption: regex `#([\p{L}\p{N}_]{1,100})/gu` → lowercase → `Hashtag` upsert + `PostHashtag`.
- Transaction: post + media + hashtagho + `user.postsCount++`.
- 201 → `PostDto`.

### `GET /posts/:id` → `PostDto` · 404 `POST_NOT_FOUND`
### `PATCH /posts/:id` — `{ caption, location }` — faqat muallif (403 `NOT_OWNER`); hashtag-ho az nav hisob meshavand.
### `DELETE /posts/:id` — faqat muallif; `postsCount--`; fayl-ho dar S3 (P2 — hazf dar fon). 204.

## Like
| Metod | URL | Javob |
|---|---|---|
| POST | `/posts/:id/like` | `{ "isLiked": true, "likeCount": 11 }` (idempotent) |
| DELETE | `/posts/:id/like` | `{ "isLiked": false, "likeCount": 10 }` |
| GET | `/posts/:id/likes?cursor` | `{ items: (UserPreview & {isFollowing})[], nextCursor }` |

**Algoritmi like (bidun xato dar race):**
```ts
await prisma.$transaction(async (tx) => {
  const { count } = await tx.like.createMany({ data: [{ userId, postId }], skipDuplicates: true });
  if (count === 1) await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
});
```
Unlike: `deleteMany` → agar `count === 1` → `decrement`. Hamin usul baroi follow va save.
Pas az amal: `cache:post:{id}` hazf + event `PostLiked` → queue (Spec 11).

Like → notification `LIKE` ba muallif (agar xudash nest) — **tavassuti queue**. Unlike → notification hazf meshavad.

## Comment
```ts
interface CommentDto {
  id: string; postId: string; parentId: string | null;
  author: UserPreview; text: string; replyCount: number; createdAt: string;
  isMine: boolean;
}
```
| Metod | URL | Tafsilot |
|---|---|---|
| GET | `/posts/:id/comments?cursor` | faqat comment-hoi sathi yakum (`parentId = null`), `createdAt DESC` |
| GET | `/comments/:id/replies?cursor` | javobho, `createdAt ASC` |
| POST | `/posts/:id/comments` | `{ "text": "Zebo!", "parentId": null }` → 201 `CommentDto` |
| DELETE | `/comments/:id` | muallifi comment **yo** muallifi post; `commentCount--` (bo javobhoyash) |

- `text`: 1–2200 aloma, `trim`.
- `parentId` boyad ba hamin post tegishli boshad va xudash `parentId = null` boshad (faqat 1 sath) — vagarna 400.
- Comment → notification `COMMENT` (muallifi post); reply → `COMMENT_REPLY` (muallifi comment).

## Saved
| POST | `/posts/:id/save` | `{ "isSaved": true }` |
|---|---|---|
| DELETE | `/posts/:id/save` | `{ "isSaved": false }` |

Ruyxat: `GET /users/me/saved` (Spec 02).

## AC
- [ ] AC1: Post bo 3 aks → `GET /posts/:id` media-ro bo tartib medihad, `postsCount` = +1.
- [ ] AC2: 11 media → 400.
- [ ] AC3: Like 2 bor → `likeCount` = 1.
- [ ] AC4: Caption bo `#Dushanbe` → hashtag `dushanbe` sohta meshavad.
- [ ] AC5: Hazfi posti useri digar → 403.
- [ ] AC6: Reply ba reply → 400.
- [ ] AC7: Like-i posti xud → notification nest.
