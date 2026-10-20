# Spec 06 — Stories

**Ma'sul:** B · **Ruz:** 2 · **Prioritet:** P0

## Qoidaho
- Story 24 soat zinda ast: `expiresAt = createdAt + 24h`. Hamai query-ho: `expiresAt > now()`.
- Aks — 5 soniya namoish, video — to 60 son. (frontend).
- Story-i kuhna dar DB memonad (baroi Highlights P2); tozakuni — cron (P2).

## Endpoint-ho

### `POST /stories`
`{ "key": "uploads/<me>/s.jpg", "type": "IMAGE", "durationSec": null }` → 201 `StoryDto`.

```ts
interface StoryDto { id: string; mediaUrl: string; type: 'IMAGE'|'VIDEO'; durationSec: number|null; createdAt: string; expiresAt: string; isSeen: boolean; viewCount?: number /* faqat baroi muallif */ }
```

### `GET /stories/feed` — "tray"-i boloi feed
```json
[
  { "user": { "id": "...", "username": "me", "avatarUrl": "..." }, "hasUnseen": false, "latestAt": "...", "isMe": true },
  { "user": { "username": "ali" }, "hasUnseen": true, "latestAt": "..." }
]
```
- Xudam (agar story doram) — avval; ba'd follow-shudaho bo story-i zinda.
- Tartib: avval `hasUnseen = true`, ba'd `latestAt DESC`.

### `GET /users/:username/stories` → `StoryDto[]` (`createdAt ASC`)
### `POST /stories/:id/view` → 204 (idempotent; muallif xudash — sabt nameshavad)
### `GET /stories/:id/viewers?cursor` — faqat muallif → `{ items: (UserPreview & { viewedAt })[], nextCursor }`; digaron → 403
### `DELETE /stories/:id` — faqat muallif → 204

## Frontend (barosi Ruzi 4)
- Halqai gradient atrofi avatar: `hasUnseen` → gradient (Spec 10), dide shuda → xokistari `#DBDBDB`.
- Viewer: progress bar-ho dar bolo, tap chap/rost — story-i qabli/badi, hold — pauza, swipe/tugma — useri badi, `Esc` — bastan.

## AC
- [ ] AC1: Story pas az 24 soat dar tray va ruyxat nest (test bo `expiresAt` dar guzashta).
- [ ] AC2: `hasUnseen` pas az didani hamai story-ho `false` meshavad.
- [ ] AC3: Viewers-ro faqat muallif mebinad.
- [ ] AC4: Tray story-i useri follow-nashudaro nishon namedihad.
