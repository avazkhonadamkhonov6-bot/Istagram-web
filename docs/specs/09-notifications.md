# Spec 09 — Notifications

**Ma'sul:** 🟦 Avaz — backend (BE-09, Ruzi 2), realtime-i front (FE-15) · 🟩 Abubakr — UI-i panel (FE-12) · **Prioritet:** P0

## Kay sohta meshavad

| Type | Kay | Ba kay | Bekorshavi |
|---|---|---|---|
| `LIKE` | like-i post | muallifi post | unlike → hazf |
| `COMMENT` | comment ba post | muallifi post | hazfi comment → hazf |
| `COMMENT_REPLY` | javob ba comment | muallifi comment | hazfi reply → hazf |
| `FOLLOW` | follow | useri follow-shuda | unfollow → hazf |

- **Ba xud notification nameoyad** (`actorId === recipientId` → skip).
- Takror nest: like → unlike → like = yak notification.
- Notification **dar darxosti HTTP sohta nameshavad**: like/comment/follow → event (`PostLiked`...) → job dar queue `notifications` (Spec 11, `jobId` yakxela) → **worker** → DB + `RealtimeService.emitToUser(recipientId, 'notification:new', dto)` tavassuti Redis adapter.
- Agar worker yo Redis xomush boshad — like baz ham kor mekunad; notification pas az bargashtani worker merasad (retry 5 bor).

## Endpoint-ho

### `GET /notifications?cursor&limit=20`
```ts
interface NotificationDto {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'COMMENT_REPLY' | 'FOLLOW';
  actor: UserPreview & { isFollowing: boolean };   // baroi tugmai "Follow back"
  post: { id: string; thumbnailUrl: string } | null;
  commentText: string | null;
  isRead: boolean;
  createdAt: string;
}
```
### `GET /notifications/unread-count` → `{ count }`
### `POST /notifications/read-all` → 204

## WebSocket
- `notification:new` → `NotificationDto` (dar frontend: nuqtai surkh dar sidebar + toast-i xurd, misli Instagram).

## Frontend (Ruzi 4)
- Panel-i lagzanda az chap (397px), misli Search.
- Guruhbandi: "Today", "This week", "This month", "Earlier".
- Matn: "**ali** liked your post. 2h", "**ali** started following you. [Follow]", "**ali** commented: Zebo!".
- Hangomi kushodan → `read-all`.
- Guruhbandii "ali and 5 others liked your post" — P2.

## AC
- [ ] AC1: Like → notification dar < 1 son. dar brauzeri digar.
- [ ] AC2: Unlike → notification nest.
- [ ] AC3: Like-i posti xud → notification nest.
- [ ] AC4: `read-all` → `unread-count = 0`.
