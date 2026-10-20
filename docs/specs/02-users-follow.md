# Spec 02 — Users, Profil va Follow

**Ma'sul:** Avaz — backend (BE-05, Ruzi 1) · Abubakr — front (FE-09, FE-10, Ruzi 2) · **Prioritet:** P0

## Endpoint-ho — Profil

### `GET /users/:username`
```json
{
  "id": "...", "username": "ali", "fullName": "Ali Valiev", "avatarUrl": "https://cdn.../a.jpg",
  "bio": "Dushanbe", "website": "https://ali.tj", "isVerified": false,
  "postsCount": 12, "followersCount": 340, "followingCount": 120,
  "isMe": false, "isFollowing": true, "followsYou": false
}
```
404 `USER_NOT_FOUND`.

### `PATCH /users/me`
```json
{ "username": "ali.new", "fullName": "...", "bio": "...", "website": "...", "avatarKey": "uploads/<userId>/x.jpg" }
```
- Hamai maydonho ixtiyori.
- `username` — **hamon qoidahoi Spec 01** (lowercase, regex, reserved, yakxela → `409 USERNAME_TAKEN`).
- `avatarKey` — boyad bo `uploads/<currentUserId>/` sar shavad (Spec 03), vagarna `403 MEDIA_FORBIDDEN`.
- `avatarKey: null` → avatar hazf meshavad.

### `PATCH /users/me/password`
`{ "currentPassword": "...", "newPassword": "..." }` → 204. Xato: `400 WRONG_PASSWORD`. Pas az ivaz hamai refresh token-hoi digar revoke meshavand.

### `GET /users/:username/posts?cursor&limit` — postho (type=POST), grid
### `GET /users/:username/reels?cursor&limit` — reelsho
### `GET /users/me/saved?cursor&limit` — faqat baroi xud
Javob: `{ items: PostGridItem[], nextCursor }`
```ts
interface PostGridItem { id: string; type: 'POST'|'REEL'; cover: Media; mediaCount: number; likeCount: number; commentCount: number; viewCount: number }
```

### `GET /users/suggestions?limit=5` (P1)
Userhoe ki shumo follow nakardaed, avval "follow-i follow-hoi shumo", ba'd populyartarin (`followersCount DESC`).

## Endpoint-ho — Follow

| Metod | URL | Javob | Xato |
|---|---|---|---|
| POST | `/users/:username/follow` | `{ "isFollowing": true, "followersCount": 341 }` | `400 CANNOT_FOLLOW_SELF`, `404`, agar alla'kay — 200 (idempotent) |
| DELETE | `/users/:username/follow` | `{ "isFollowing": false, "followersCount": 340 }` | 404 |
| GET | `/users/:username/followers?cursor&q=` | `{ items: (UserPreview & {isFollowing})[], nextCursor }` | |
| GET | `/users/:username/following?cursor&q=` | hamon | |
| DELETE | `/users/me/followers/:username` | Hazfi follower ("Remove") | |

**Follow dar transaction:** `follow.create` + `follower.followingCount++` + `target.followersCount++` + notification `FOLLOW` (Spec 09).

## AC
- [ ] AC1: Profil-i user bo counter-hoi durust.
- [ ] AC2: Follow 2 bor → counter faqat 1 bor ziyod meshavad.
- [ ] AC3: Ba xud follow → 400.
- [ ] AC4: Ivazi username ba username-i band → 409; ba `ALI` vaqte ki `ali` band → 409.
- [ ] AC5: Pas az follow — user notification `FOLLOW` megirad.
- [ ] AC6: `/users/me/saved` faqat posthoi saqlashudai xudi user.
