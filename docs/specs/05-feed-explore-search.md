# Spec 05 — Feed, Explore, Search

**Ma'sul:** A · **Ruz:** 2 · **Prioritet:** P0

## Feed — `GET /feed?cursor&limit=10`
- Postho (type `POST` **va** `REEL`) az userhoe ki man follow kardaam **+ posthoi xudam**.
- Tartib: `createdAt DESC, id DESC` (misli "Following" dar Instagram).
- Usul: *fan-out on read* — yak query:
```ts
prisma.post.findMany({
  where: { OR: [{ authorId: me }, { author: { followers: { some: { followerId: me } } } }] },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: limit + 1, cursor, skip: cursor ? 1 : 0,
  include: { media: { orderBy: { order: 'asc' } }, author: true },
})
```
- `isLiked`, `isSaved` — bo 2 query-i ilovagi (`postId IN (...)`) hisob meshavand, **ne** N+1.
- Javob: `{ items: PostDto[], nextCursor }`.
- Agar feed xoli ast (user navnavis) → frontend "Suggested for you"-ro nishon medihad.

## Explore — `GET /explore?cursor&limit=24`
- Postho az userhoe ki man follow **nakardaam** (va ne xudam).
- Tartib: populyarnok dar 7 ruzi oxir: `score = likeCount + 2*commentCount`, ba'd `createdAt DESC`.
- Cursor baroi score: offset-i oddi (`?page=`) qabul ast — `{ items: PostGridItem[], nextPage }`.
- Grid-i Instagram: har 5 element yak reel-i kalon (frontend tartib medihad).

## Search
| URL | Javob |
|---|---|
| `GET /search/users?q=al&limit=20` | `UserPreview[]` + `followersCount`; `username ILIKE 'al%'` yo `fullName ILIKE '%al%'`; avval follow-shudaho |
| `GET /search/hashtags?q=taj` | `[{ name: "tajikistan", postsCount: 120 }]` |
| `GET /hashtags/:name` | `{ name, postsCount }` |
| `GET /hashtags/:name/posts?cursor` | `{ items: PostGridItem[], nextCursor }` |

- `q`: 1–30 aloma; agar `q` bo `#` sar shavad → faqat hashtagho.
- Indeks: `CREATE INDEX ON "User" (username text_pattern_ops)` (migratsiyai SQL).

### Justujuhoi oxirin (Recent searches) — P1
Dar frontend `localStorage` nigoh doshta meshavad (backend lozim nest).

## AC
- [ ] AC1: Feed posthoi useri follow-nashudaro nishon namedihad.
- [ ] AC2: Pagination: 25 post, limit 10 → 3 sahifa, takror nest.
- [ ] AC3: Explore posthoi follow-shudaho va xudro nishon namedihad.
- [ ] AC4: Search `AL` = search `al`.
- [ ] AC5: Dar feed-i 10 post — query-ho ≤ 4 (log-i Prisma).
