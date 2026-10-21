# Spec 14 — Funksiyahoi purrai Instagram (ilova ba Spec 12 va 13)

**Ma'sul:** Avaz (backend + frontend) · **Sana:** 2026-10-21 · **Prioritet:** P0 (qaror-i 2026-10-21: "nusxai purrai Instagram")

> Hamai endpoint-hoi Spec 12 va 13 **tagyir nameyoband** — faqat maydonhoi nav ba DTO-ho ilova meshavand (hama bo qimati peshfarz, ki front-i kuhna nashikanad).
> Formati javob, auth, xatoho — hamon Spec 12 §1. Emoji dar UI nest: "reaction" ba story va paym — faqat **dil** (like), misli double-tap dar Instagram.

## 1. Hisob va amniyat

### 1.1 Hisobi private + follow request
- `User.isPrivate` (peshfarz `false`). `UserProfile` → maydoni nav `isPrivate`.
- `PUT /UserProfile/update-privacy` `{ isPrivate: boolean }` → `UserProfile`.
- Follow ba hisobi private → `FollowRequest`, ne `Follow`. `followResult` → `{ isFollowing: false, isRequested: true }`. Notification `FOLLOW_REQUEST`.
- `GET /UserProfile/get-follow-status?userId=` → `"none" | "requested" | "following"`.
- `GET /FollowingRelationShip/get-follow-requests` → `UserShort[]` (darxosthoi ba man).
- `POST /FollowingRelationShip/accept-follow-request?userId=` → `Follow` sohta meshavad (counter-ho +1), notification `FOLLOW` ba man az on user ne, balki `FOLLOW_ACCEPTED` ba on user.
- `DELETE /FollowingRelationShip/decline-follow-request?userId=`.
- `DELETE /FollowingRelationShip/delete-following-relation-ship` darxosti hanuz qabulnashudaro ham bekor mekunad.
- Agar hisob private boshad va man follower nestam: postho, reels, story, highlights, ruyxati followers/following → **ruyxati xoli** (`get-posts?UserId`), `get-post-by-id` → 403 `PRIVATE_ACCOUNT`. Explore va hashtag posthoi hisobhoi private-ro nishon namedihand (gayr az onhoe ki man follow kardaam).
- Ivazi `isPrivate` → `false`: hamai darxosthoi intizor xudkor qabul meshavand.

### 1.2 Block
- `POST /User/block-user?userId=`, `DELETE /User/unblock-user?userId=`, `GET /User/get-blocked-users`.
- Block → follow-ho va darxostho dar **har du taraf** hazf meshavand (counter-ho isloh).
- User-i blokshuda (dar har du taraf): profil → 404, follow → 403 `BLOCKED`, chat-i nav / paym → 403 `BLOCKED`, dar search, suggestions, explore, feed, stories, comment-ho va notification-ho namoyon nest.

### 1.3 Mute
- `POST /User/mute-user?userId=&Posts=true&Stories=true`, `DELETE /User/unmute-user?userId=`, `GET /User/get-muted-users`.
- Mute-i postho → postho dar feed nestand (dar profil hastand). Mute-i story → dar tray nestand. User namedonad.

### 1.4 Restrict
- `POST /User/restrict-user?userId=`, `DELETE /User/unrestrict-user?userId=`, `GET /User/get-restricted-users`.
- Comment-i user-i restrict-shuda ba posti man: faqat baroi xudi u va baroi man (bo `isRestricted: true`) namoyon ast; digaron namebinand. Notification az u nameoyad.

### 1.5 Report
- `POST /Report/add-report` `{ targetType: "POST"|"COMMENT"|"USER"|"STORY"|"MESSAGE", targetId: string, reason: string(1..500) }` → `true`. Takror az yak user ba yak hadaf — yak satr.

### 1.6 Close friends
- `POST /User/add-close-friend?userId=`, `DELETE /User/remove-close-friend?userId=`, `GET /User/get-close-friends`.

## 2. Post va comment

| Funksiya | API | DTO |
|---|---|---|
| Like-i comment | `POST /Post/like-comment?commentId=` → `{ isLiked, likeCount }` toggle; notification `COMMENT_LIKE` | `CommentDto` + `isLiked`, `likeCount`, `isRestricted` |
| @mention | dar `Content`-i post va matni comment `@username` → notification `MENTION` | front `@username`-ro link mekunad |
| Tag dar aks | `add-post` maydoni `Tags` = JSON `[{ userName, x, y, imageIndex }]` (x, y = 0..1); `GET /Post/get-tagged-posts?UserId=`; notification `TAG` | `PostDto.tags: { userId, userName, x, y, imageIndex }[]` |
| Location | `add-post` maydoni `Location` (≤100); `GET /Post/get-location-posts?Name=` | `PostDto.location` |
| Tahriri post | `PUT /Post/update-post` `{ postId, content?, location?, hideLikeCount?, commentsDisabled? }` — faqat muallif; hashtag-ho az nav | `PostDto.hideLikeCount`, `commentsDisabled` |
| Comment xomush | agar `commentsDisabled` → `add-comment` → 403 `COMMENTS_DISABLED` | |
| Archive | `POST /Post/archive-post?postId=` toggle; `GET /Post/get-archived-posts` — posti archive-shuda dar hama jo pinhon ast, gayr az archive-i muallif | `PostDto.isArchived` |
| Pin | `POST /Post/pin-post?postId=` toggle, maks. 3 → 400 `PIN_LIMIT`; dar `get-posts?UserId` avval pin-shudaho | `PostDto.isPinned` |
| Collections | `GET /Collection/get-collections`, `POST /Collection/add-collection` `{ name }`, `PUT /Collection/update-collection` `{ id, name }`, `DELETE /Collection/delete-collection?id=`, `POST /Collection/add-to-collection` `{ collectionId, postId }` (post xudkor saved meshavad), `DELETE /Collection/remove-from-collection?collectionId=&postId=`, `GET /Collection/get-collection-posts?collectionId=` | `CollectionDto { id, name, postsCount, cover }` |

## 3. Stories va Highlights

- Story-i "Close friends": `POST /Story/AddStories?CloseFriends=true` → faqat close friends va muallif mebinand. `GetStoryDto.closeFriends` (halqai sabz `--ig-close-friends-refreshed`).
- Story-hoi user-i private faqat baroi followerho.
- Javob ba story: `POST /Story/reply-story` `{ storyId, text }` → paym dar Direct bo `story` (chat xudkor sohta meshavad).
- Share-i story ba Direct: `send-message` maydoni `SharedStoryId`.
- Archive-i story: `GET /Story/get-story-archive` — hamai story-hoi man, hatto guzashta.
- Highlights:
  - `GET /Highlight/get-highlights?UserId=` → `HighlightDto[] { id, title, cover, storiesCount }`
  - `GET /Highlight/get-highlight-stories?id=` → `GetStoryDto[]` (muhlati 24 soat ahamiyat nadorad)
  - `POST /Highlight/add-highlight` `{ title(1..30), storyIds[1..100] }` — faqat story-hoi xud
  - `PUT /Highlight/update-highlight` `{ id, title?, storyIds? }`, `DELETE /Highlight/delete-highlight?id=`

## 4. Direct

- **Group chat:** `POST /Chat/create-group` `{ title(1..50), userIds[2..31] }` → `chatId`; `PUT /Chat/update-group` `{ chatId, title }`; `POST /Chat/add-group-members` `{ chatId, userIds }`; `DELETE /Chat/leave-group?chatId=`. `ChatDto` + `isGroup`, `title`, `members: UserShort[]`. Paym ba hamai a'zo bo socket meravad; "Seen" — vaqte ki hama xondand.
- **Like-i paym** (dil, double-tap): `POST /Chat/like-message?messageId=` toggle → `MessageDto`; socket `message:updated`.
- **Javob ba paym:** `send-message` maydoni `ReplyToMessageId` → `MessageDto.replyTo { messageId, userName, text }`.
- **Paymi ovozi:** `send-message` bo `File` audio (`audio/webm`, `audio/ogg`, `audio/mpeg`, `audio/mp4`, ≤10 MB) → `MessageDto.fileType = "audio"`. `fileType`: `"image" | "video" | "audio" | null`.
- `MessageDto` + `likes: string[]` (userId-ho), `replyTo`, `story { storyId, fileName, userName } | null`, `fileType`.

## 5. Notifications

`NotificationType` ilova: `FOLLOW_REQUEST`, `FOLLOW_ACCEPTED`, `COMMENT_LIKE`, `MENTION`, `TAG`. Qoidahoi Spec 13 §1 (kalidi yakxela, retract) hamon.

## 6. Xatohoi nav

`PRIVATE_ACCOUNT` (403), `BLOCKED` (403), `COMMENTS_DISABLED` (403), `PIN_LIMIT` (400), `COLLECTION_NOT_FOUND` (404), `HIGHLIGHT_NOT_FOUND` (404), `NOT_GROUP` (400).

## 7. Frontend

> **Taqsim (2026-10-21):** sahifahoe, ki dar vazifahoi Abubakr hastand (Stories, Reels, Create, Notifications, Profil, Post, Feed), — **Abubakr** (FE-26). Avaz faqat sahifahoi xud va sahifahoi navro menavisad: Direct (FE-23), `/accounts/*` (FE-24), location va API-i front (FE-25). Kodi Abubakr-ro Avaz tagyir namedihad.

| Sahifa / komponent | Chi | Kas |
|---|---|---|
| Stories tray + viewer | gradient / didashuda / sabz (close friends), progress, tap chap-rost, hold, Esc, useri badi, like, javob, share, viewers baroi xud | Abubakr |
| `/reels` | scroll-snap, autoplay/pause (IntersectionObserver), mute, like, comment, save, share | Abubakr |
| Create (modal) | intixob / drag & drop, Post (1–10), Reel (1 video), Story (+ Close friends), caption, location, tag-i odamon | Abubakr |
| Notifications panel | Today / This week / This month / Earlier, Follow back, darxosthoi follow (Confirm / Delete) | Abubakr |
| Profil | tab-hoi POSTS / REELS / SAVED / TAGGED, highlights, qulf baroi private, menyui "..." (Block, Restrict, Mute, Report, Close friends) | Abubakr |
| Post menu | Edit, Archive, Pin, Hide like count, Turn off commenting, Delete, Report, Add to collection | Abubakr |
| Comment | dil-i comment, `@mention` va `#hashtag` link | Abubakr |
| `/accounts/*` | Privacy (private), Blocked, Muted, Restricted, Close friends, Archive (postho, story) | Avaz |
| Saved | collections | Abubakr |
| Direct | group chat, dil-i paym (double-tap), reply, paymi ovozi, javob ba story | Avaz |
| `/explore/locations/[name]` | posthoi location | Avaz |

## 8. Kriteriyahoi qabul

- **AC1** Follow ba hisobi private → `isRequested: true`, postho → `[]`; pas az accept → postho namoyon.
- **AC2** Block → follow-i har du taraf nest, profil → 404, paym → 403.
- **AC3** Comment-i user-i restrict-shuda baroi user-i seyum namoyon nest.
- **AC4** Like-i comment toggle, `likeCount` durust; `@user` dar comment → notification `MENTION`.
- **AC5** Posti archive-shuda dar feed / profil / explore nest, dar `get-archived-posts` hast.
- **AC6** Pin-i 4-um → 400 `PIN_LIMIT`.
- **AC7** Story-i close friends-ro user-i begona namebinad.
- **AC8** Highlight story-i guzashtaro nishon medihad.
- **AC9** Group chat: paym ba har 3 a'zo bo socket merasad.
- **AC10** Like-i paym → tarafi digar `message:updated` megirad.
