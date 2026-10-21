# Spec 15 — Funksiyahoi ilovagii Instagram (ilova ba Spec 12–14)

**Ma'sul:** Avaz (backend + Direct + `/accounts/*`), Abubakr (UI dar sahifahoi xud) · **Sana:** 2026-10-21 · **Prioritet:** P0

> Sabab: sanjishi backend bo Instagram-i asli nishon dod, ki in funksiyaho hanuz nabudand.
> Hamai endpoint-hoi Spec 12–14 **tagyir nayoftand** — faqat maydonhoi nav bo qimati peshfarz ilova shudand.
> Formati javob, auth, xatoho — hamon Spec 12 §1.

## 1. Follower-ho va Favorites

| Funksiya | API | Javob |
|---|---|---|
| Remove follower | `DELETE /FollowingRelationShip/remove-follower?userId=` | `true`; counter-ho isloh, notification-i `FOLLOW` retract; ba user xabar nameravad |
| Favorites | `POST /User/add-favorite?userId=`, `DELETE /User/remove-favorite?userId=`, `GET /User/get-favorites` | `true` / `UserShort[]`; maks. 50 → 400 `FAVORITES_LIMIT` |
| Feed-i Favorites | `GET /Post/get-favorites-feed?PageNumber=&PageSize=` | `PostDto[]` (paged) — faqat postho-i Favorites |
| Holat | `GET /User/get-relation-status` | + `isFavorite` |

## 2. Postho, reels, comment-ho

| Funksiya | API | Javob |
|---|---|---|
| Pin-i comment | `POST /Post/pin-comment?commentId=` (toggle) | `{ value }`; faqat muallifi post (aks holat 403), faqat sathi yakum, maks. 3 → 400 `COMMENT_PIN_LIMIT` |
| Tartibi comment-ho | `GET /Post/get-comments` | avval pin-shudaho; `CommentDto.isPinned` |
| Reels-i user | `GET /Post/get-user-reels?UserId=` | `PostDto[]` (paged) — tab-i REELS dar profil; hisobi private → `[]` |

## 3. Direct: tahriri paym

- `PUT /Chat/edit-message` `{ messageId, text(1..1000) }` → `MessageDto`.
- Faqat muallif (403), faqat paymi matni, to **15 daqiqa** pas az firistodan → 400 `EDIT_WINDOW_EXPIRED`.
- `MessageDto.editedAt` (string | null); ba a'zoi digar socket `message:updated`. Dar UI — "Edited".

## 4. "Active now"

- `User.lastActiveAt` — dar connect va disconnect-i socket navsozi meshavad.
- `GET /User/get-activity-status?userId=` → `{ userId, isOnline, lastActiveAt }`.
- Namoyon faqat agar yake digariro follow kunad yo chat-i umumi doshta boshand; blok → pinhon (`isOnline: false, lastActiveAt: null`).
- `ChatDto` (1:1) + `peerIsOnline`, `peerLastActiveAt`. UI: "Active now", "Active 5m ago"; kuhnatar az 24 soat — nishon doda nameshavad; nuqtai sabz (`--ig-success`) dar avatar.

## 5. Notes

- Matni to **60** alomat, **24 soat**, yak note-i faol baroi har user (note-i nav joi kuhnaro megirad).
- `POST /Note/add-note` `{ text, closeFriends? }` → `NoteDto`; `GET /Note/get-notes` → `NoteDto[]` (note-i man avval); `DELETE /Note/delete-note` (agar nest → 404 `NOTE_NOT_FOUND`).
- Kiho mebinand: followerhoe, ki muallif onhoro follow kardaast (mutual); note-i `closeFriends` — faqat close friends-i muallif; blok — nest.
- `NoteDto { id, userId, userName, userImage, text, closeFriends, createdAt, expiresAt }`.

## 6. Your activity

- `GET /Post/get-liked-posts` → `PostDto[]` (paged), tartib — vaqti like, nav avval.

## 7. Seed

40 user, ~235 post (35 reel), ~100 story (aks va video, close friends), highlights, 9 note, favorites, comment-hoi pin-shuda, paymi tahrirshuda, `lastActiveAt`. Login: `avaz` / `password123`.

## 8. Frontend

| Sahifa / komponent | Chi | Kas |
|---|---|---|
| Direct: Notes tray | bolo-i inbox: note-i man + note-hoi dustoni mutual, Share / Delete, close friends | Avaz (FE-27) |
| Direct: tahriri paym | tugmai "Edit" (to 15 daq.), "Save", namoishi "Edited" | Avaz (FE-27) |
| Direct: "Active now" | dar header-i chat va nuqtai sabz dar ruyxat | Avaz (FE-27) |
| `/accounts/favorites` | ruyxat, justuju va Add, Remove | Avaz (FE-28) |
| `/accounts/activity` | posthoi like-kardai man | Avaz (FE-28) |
| Followers modal | tugmai "Remove" baroi followerhoi xud (`removeFollower`) | Abubakr (FE-29) |
| Profil | tab-i REELS → `getUserReels` | Abubakr (FE-29) |
| Comment-ho | "Pin" dar menyui comment-i muallifi post, belgii pin (`pinComment`) | Abubakr (FE-29) |
| Feed | intixobi "Following / Favorites" dar logotip (`getFavoritesFeed`) | Abubakr (FE-29) |
| More menu | linkho ba `/accounts/privacy`, `/accounts/activity`, `/accounts/favorites` | Abubakr (FE-29) |

API-i front baroi hamai qatorho dar `apps/web/src/features/social/api.ts` tayyor ast.

## 9. Kriteriyahoi qabul

- **AC1** Remove follower → u dar ruyxati followers nest, counter-hoi har du taraf durust.
- **AC2** Favorites → feed-i Favorites faqat postho-i onhoro dorad; `isFavorite: true`.
- **AC3** Pin-i comment: begona → 403; 4-um → 400 `COMMENT_PIN_LIMIT`; pin-shudaho avval.
- **AC4** Liked posts — nav avval; reels-i user — faqat reel.
- **AC5** Tahriri paym → `editedAt`, tarafi digar `message:updated`; begona → 403; pas az 15 daq. → `EDIT_WINDOW_EXPIRED`.
- **AC6** Note: mutual mebinad, begona ne; close friends — faqat close friends; 61 alomat → 400; delete.
- **AC7** "Active now": bo socket `isOnline: true`, pas az disconnect — `false`.

Hamai AC dar `apps/api/test/spec15.e2e-spec.ts` (7 test); hamagi e2e — 40/40.
