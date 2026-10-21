# Spec 12 — Kontrakti API (endpoint-hoi Swagger-i "Web Api")

**Ma'sul:** Avaz · **Prioritet:** P0 · **Sana:** 2026-10-21

> In spec **URL-ho va DTO-hoi API-ro** dar spec-hoi 01–09 ivaz mekunad. Backend dar NestJS meboshad,
> vale endpoint-ho aynan misli Swagger-i "Web Api" (`/Account/*`, `/Post/*`, `/Chat/*`...).
> Qoidahoi amniyat va bovarinoki az TZ va spec-hoi 01–11 (argon2id, username-i yakxela, Zod, transaction,
> idempotentnost, filter-i xato) **boqi memonand**. Schema-hoi Zod — dar `packages/shared/src/schemas/`.

## 1. Qoidahoi umumi

- Base URL: `http://localhost:4000` (bidun prefiks). Swagger: `/swagger`.
- Auth: header `Authorization: Bearer <token>`. Hamai endpoint-ho himoyashuda, gayr az `/Account/register`, `/Account/login`, `/Account/ForgotPassword`, `/Account/ResetPassword`.
- ID-i user — `string` (uuid). ID-i post, comment, story, chat, message, location, search history — `integer`.
- Faylho (aks/video) bo `multipart/form-data` bor meshavand va dar `/images/<fileName>` dastrasand. Dar javobho (`avatar`, `image`, `images[]`, `file`, `fileName`) faqat **nomi fayl** meoyad; URL-i purra = `http://localhost:4000/images/<fileName>`. Andozai maks.: aks 10 MB, video 100 MB; tipho: `image/jpeg|png|webp|gif`, `video/mp4|webm|quicktime`.
- Paging: `PageNumber` (az 1), `PageSize` (peshfarz 10, maks. 50).

### Javobi yagona

```json
{ "data": <T>, "errors": [], "statusCode": 200 }
```

Javobi sahifador (paged):

```json
{ "pageNumber": 1, "pageSize": 10, "totalPage": 3, "totalRecord": 25, "data": [ ... ], "errors": [], "statusCode": 200 }
```

Xato — hamon format, `data: null`, `errors: ["matn"]`, `statusCode` = statusi HTTP (400, 401, 403, 404, 409, 429).

## 2. Account

| Metod | URL | Vorid | `data` |
|---|---|---|---|
| POST | `/Account/register` | `{ userName, fullName, email, password, confirmPassword }` | `"User registered"` |
| POST | `/Account/login` | `{ userName, password }` | JWT (`string`) |
| DELETE | `/Account/ForgotPassword?Email=` | — | `"Code sent"` (kod dar log-i dev; e-mail — P2) |
| DELETE | `/Account/ResetPassword?Token=&Email=&Password=&ConfirmPassword=` | — | `"Password reset"` |
| PUT | `/Account/ChangePassword?OldPassword=&Password=&ConfirmPassword=` | — | `"Password changed"` |

- `userName`: `trim → lowercase`, 3–30, `^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]+$`, reserved (Spec 01) → 400. Band → **409** (DB `UNIQUE` + `P2002`).
- `email`: e-mail-i durust, lowercase, yakxela → 409.
- `password` 8–64, `confirmPassword` boyad barobar boshad → 400.
- Login-i galat → 401 "Username yo parol noto'g'ri ast" (bo dummy-hash, Spec 01).
- JWT: `{ sub, name }`, muhlat 7 ruz (`JWT_EXPIRES_IN`). BFF onro dar cookie-i httpOnly nigoh medorad (Spec 01 AC9).
- Rate limit: login 5/daq., register 3/daq. (dar xotira).

## 3. User

| Metod | URL | `data` |
|---|---|---|
| GET | `/User/get-users?UserName=&Email=&PageNumber=&PageSize=` | paged `UserListItem[]` |
| POST | `/User/add-search-history?Text=` | `SearchHistory` |
| GET | `/User/get-search-histories` | `SearchHistory[]` (nav → kuhna) |
| DELETE | `/User/delete-search-history?id=` | `true` |
| DELETE | `/User/delete-search-histories` | `true` |
| POST | `/User/add-user-search-history?UserSearchId=` | `UserSearchHistory` |
| GET | `/User/get-user-search-histories` | `UserSearchHistory[]` |
| DELETE | `/User/delete-user-search-history?id=` | `true` |
| DELETE | `/User/delete-user-search-histories` | `true` |
| DELETE | `/User/delete-user?userId=` | `true` — faqat hisobi xud (digar → 403) |

```ts
UserListItem      { id, userName, fullName, email, avatar, subscribersCount }
SearchHistory     { id, text, createdAt }
UserSearchHistory { id, createdAt, users: UserShort }   // UserShort = { id, userName, fullName, avatar }
```

## 4. UserProfile

| Metod | URL | `data` |
|---|---|---|
| GET | `/UserProfile/get-user-profile-by-id?id=` | `UserProfile` |
| GET | `/UserProfile/get-is-follow-user-profile-by-id?followingUserId=` | `boolean` |
| GET | `/UserProfile/get-my-profile` | `UserProfile` |
| PUT | `/UserProfile/update-user-profile` | `{ about?, gender? (0/1) }` → `UserProfile` |
| GET | `/UserProfile/get-post-favorites?PageNumber=&PageSize=` | paged `PostDto[]` |
| PUT | `/UserProfile/update-user-image-profile` (multipart `imageFile`) | `UserProfile` |
| DELETE | `/UserProfile/delete-user-image-profile` | `UserProfile` |

```ts
UserProfile { userId, userName, fullName, email, about, gender, image, postCount, subscribersCount, subscriptionsCount, dateUpdated }
```

## 5. FollowingRelationShip

| Metod | URL | `data` |
|---|---|---|
| GET | `/FollowingRelationShip/get-subscribers?UserId=` | `UserShort[]` — kiho `UserId`-ro follow kardaand |
| GET | `/FollowingRelationShip/get-subscriptions?UserId=` | `UserShort[]` — `UserId` kiro follow kardaast |
| POST | `/FollowingRelationShip/add-following-relation-ship?followingUserId=` | `{ isFollowing: true, subscribersCount }` |
| DELETE | `/FollowingRelationShip/delete-following-relation-ship?followingUserId=` | `{ isFollowing: false, subscribersCount }` |

Ba xud → 400; user nest → 404; takror → idempotent (Spec 02 AC2).

## 6. Post

| Metod | URL | `data` |
|---|---|---|
| GET | `/Post/get-posts?UserId=&Title=&Content=&PageNumber=&PageSize=` | paged `PostDto[]` |
| GET | `/Post/get-reels?PageNumber=&PageSize=` | paged `PostDto[]` (faqat `isReel`) |
| GET | `/Post/get-post-by-id?id=` | `PostDto` · 404 |
| GET | `/Post/get-my-posts` | `PostDto[]` |
| GET | `/Post/get-following-post?UserId=&PageNumber=&PageSize=` | paged `PostDto[]` — postho az follow-shudahoi `UserId` (peshfarz — man) + xudash |
| POST | `/Post/add-post` (multipart: `Title?`, `Content?`, `Images[]` 1–10) | `PostDto` |
| DELETE | `/Post/delete-post?id=` | `true` — faqat muallif (403) |
| POST | `/Post/like-post?postId=` | `{ isLiked, likeCount }` — **toggle** |
| POST | `/Post/view-post?postId=` | `{ viewCount }` — yak user = yak view |
| POST | `/Post/add-comment` | `{ comment, postId }` → `CommentDto` |
| DELETE | `/Post/delete-comment?commentId=` | `true` — muallifi comment yo post |
| POST | `/Post/add-post-favorite` | `{ postId }` → `{ isFavorite }` — **toggle** |

```ts
PostDto {
  postId, userId, userName, userImage, title, content, images: string[], isReel,
  datePublished, postLike: boolean, postLikeCount, postView, commentCount,
  postFavorite: boolean, comments: CommentDto[] /* 3-i oxirin */, userLikes: UserShort[] /* 2 */
}
CommentDto { postCommentId, postId, userId, userName, userImage, comment, dateCommented }
```

- Post `isReel = true`, agar hamai faylho video boshand va aniq 1 fayl (Spec 07).
- Hashtag-ho az `content` (Spec 04 regex) nigoh doshta meshavand (baroi Explore — P1).
- Counter-ho dar transaction; like/view/favorite — idempotent (`createMany skipDuplicates`).

## 7. Story

| Metod | URL | `data` |
|---|---|---|
| GET | `/Story/get-stories` | `UserStories[]` — man + follow-shudaho, faqat 24 soati oxir |
| GET | `/Story/get-user-stories/{userId}` | `UserStories` |
| GET | `/Story/get-my-stories` | `UserStories` |
| POST | `/Story/LikeStory?storyId=` | `"Liked"` / `"Unliked"` — toggle |
| GET | `/Story/GetStoryById?id=` | `GetStoryDto` |
| POST | `/Story/AddStories?PostId=` (multipart `Image`) | `"Story added"` — fayl **yo** `PostId` (repost) |
| DELETE | `/Story/DeleteStory?id=` | `true` — faqat muallif |
| POST | `/Story/add-story-view?StoryId=` | `GetStoryViewDto` — idempotent, muallif sabt nameshavad |

```ts
GetStoryDto     { id, fileName, postId, createAt, userId, userAvatar, liked, viewerDto: { userName, name, viewCount, viewLike } }
GetStoryViewDto { id, viewUserId, storyId }
UserStories     { userId, userName, userImage, hasUnseen, stories: GetStoryDto[] }
```
`viewerDto.viewCount/viewLike` — faqat baroi muallif, baroi digaron `null`.

## 8. Chat

| Metod | URL | `data` |
|---|---|---|
| GET | `/Chat/get-chats` | `ChatDto[]` (`lastMessageAt DESC`) |
| GET | `/Chat/get-chat-by-id?chatId=` | `MessageDto[]` (kuhna → nav) — faqat ishtirokchi (403) |
| POST | `/Chat/create-chat?receiverUserId=` | `chatId` (`number`) — agar hast, hamon |
| PUT | `/Chat/send-message` (multipart: `ChatId`, `MessageText?`, `File?`) | `MessageDto` |
| DELETE | `/Chat/delete-message?massageId=` | `true` — faqat firistanda |
| DELETE | `/Chat/delete-chat?chatId=` | `true` — ishtirokchi |

```ts
ChatDto    { chatId, sendUserId, sendUserName, sendUserImage, receiveUserId, receiveUserName, receiveUserImage, lastMessage: MessageDto | null }
MessageDto { messageId, chatId, userId, userName, userImage, messageText, file, sendMassageDate }
```

WebSocket (Socket.IO, path `/ws`, `auth: { token: <ws-ticket> }`): server → `message:new` (`MessageDto`), `message:deleted` (`{ messageId, chatId }`) ba tarafi digar. Token-i galat yo JWT-i asosi (ne ticket) → disconnect (Spec 08 AC4).

Ticket: `POST /Account/ws-ticket` → `data`: JWT-i **60 soniya** (`typ: "ws"`), faqat baroi ulanish; baroi HTTP qabul nameshavad. Front onro tavassuti BFF `GET /api/realtime/ticket` megirad — JWT-i asosi hech vaqt ba JavaScript namerasad (Spec 01 AC9).

## 9. Location

| Metod | URL | `data` |
|---|---|---|
| GET | `/Location/get-Locations?City=&State=&ZipCode=&Country=&PageNumber=&PageSize=` | paged `LocationDto[]` |
| GET | `/Location/get-Location-by-id?id=` | `LocationDto` |
| POST | `/Location/add-Location` | `{ city, state, zipCode, country }` → `LocationDto` |
| PUT | `/Location/update-Location` | `{ locationId, city, state, zipCode, country }` → `LocationDto` |
| DELETE | `/Location/delete-Location?id=` | `true` |

`LocationDto { locationId, city, state, zipCode, country }`

## 10. Chi az spec-hoi kuhna monda / buridashud

- Monda: argon2id, username-i yakxela (lowercase + 409), reserved, Zod `strict()`, transaction-hoi counter, idempotentnost, filter-i yagona, `x-request-id`, rate limit, Socket.IO baroi chat.
- Buridashud (to P1): refresh token / ws-ticket (yak JWT), presign S3 (upload tavassuti API), Redis/BullMQ, Notifications, Explore/Search-i hashtag.

## AC

- [ ] AC1: `register` bo `Ali` → user `ali`; dubora bo `ALI` → 409.
- [ ] AC2: `login` bo parol-i galat → 401; durust → JWT.
- [ ] AC3: `add-post` bo 11 fayl → 400; bo 1 video → `isReel = true`.
- [ ] AC4: `like-post` 2 bor → `postLikeCount` = 0 (toggle), parallel → hech vaqt manfi/takror nest.
- [ ] AC5: `delete-post` posti begona → 403.
- [ ] AC6: `get-chat-by-id` chat-i begona → 403; `create-chat` 2 bor → yak chat.
- [ ] AC7: `get-stories` story-i kuhnatar az 24 soat va useri follow-nashudaro nishon namedihad.
- [ ] AC8: Dar hech javob `passwordHash` nest.
