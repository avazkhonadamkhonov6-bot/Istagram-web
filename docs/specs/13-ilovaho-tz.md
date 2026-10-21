# Spec 13 — Ilovaho ba Spec 12: funksiyahoi P0/P1-i TZ

**Ma'sul:** Avaz · **Prioritet:** P0 (TZ §2), Suggestions — P1 · **Sana:** 2026-10-21

> Spec 12 (57 endpoint-i "Web Api") **tagyir nameyobad**. In spec faqat endpoint-ho va maydonhoi **ilovagi** medihad,
> ki TZ §2 hamchun P0 talab mekunad, vale dar Swagger-i "Web Api" nabudand: Notifications, Explore, Hashtag,
> javob ba comment, "Seen" / typing / unread dar Direct, share post ba Direct, Suggestions.
> Formati javob, auth, paging — hamon Spec 12 §1.

## 1. Notifications (TZ #11, Spec 09)

| Metod | URL | `data` |
|---|---|---|
| GET | `/Notification/get-notifications?PageNumber=&PageSize=` | paged `NotificationDto[]` (nav → kuhna) |
| GET | `/Notification/get-unread-count` | `{ count }` |
| PUT | `/Notification/read-all` | `true` |

```ts
NotificationDto {
  id, type: 'LIKE' | 'COMMENT' | 'COMMENT_REPLY' | 'FOLLOW',
  actor: UserShort & { isFollowing },        // baroi "Follow back"
  post: { postId, image } | null,            // thumbnail
  commentText: string | null, isRead, createdAt
}
```

| Type | Kay | Ba kay | Bekor |
|---|---|---|---|
| `LIKE` | like-post (on) | muallifi post | unlike → hazf |
| `COMMENT` | add-comment | muallifi post | delete-comment → hazf |
| `COMMENT_REPLY` | add-comment bo `parentId` | muallifi comment | delete-comment → hazf |
| `FOLLOW` | add-following-relation-ship | useri follow-shuda | unfollow → hazf |

- Ba xud nameoyad. Takror nest: kalidi yakxela (`LIKE:<actor>:<post>` ...) — like → unlike → like = yak notification.
- Pas az sohtan → Socket.IO `notification:new` (`NotificationDto`) ba qabulkunanda.
- Xatoi notification amali asosiro (like, follow) nameshikanad — faqat log.

## 2. Explore va Hashtag (TZ #12, Spec 05)

| Metod | URL | `data` |
|---|---|---|
| GET | `/Post/get-explore-posts?PageNumber=&PageSize=` | paged `PostDto[]` — az userhoe ki man follow nakardaam (va ne xudam); tartib: `likeCount + 2*commentCount` DESC, ba'd `createdAt` DESC |
| GET | `/Hashtag/search?Query=` | `[{ name, postsCount }]` (to 20; `#` dar sar qabul ast) |
| GET | `/Hashtag/get-posts?Name=&PageNumber=&PageSize=` | paged `PostDto[]` |

## 3. Javob ba comment (TZ #6, Spec 04)

- `POST /Post/add-comment` — maydoni ixtiyorii nav: `{ comment, postId, parentId? }`. `parentId` boyad ba hamin post tegishli boshad va xudash javob naboshad (faqat 1 sath) → vagarna 400.
- `CommentDto` + `parentId: number | null`, `replyCount: number`.
- `PostDto.comments` — faqat comment-hoi sathi yakum.

| Metod | URL | `data` |
|---|---|---|
| GET | `/Post/get-comments?postId=&PageNumber=&PageSize=` | paged `CommentDto[]` — sathi yakum, nav → kuhna |
| GET | `/Post/get-comment-replies?commentId=` | `CommentDto[]` — kuhna → nav |

`delete-comment`: comment bo hamai javobhoyash hazf meshavad; `commentCount` ba hamon qadar kam meshavad.

## 4. Direct: "Seen", unread, typing, share post (TZ #10, Spec 08)

| Metod | URL | `data` |
|---|---|---|
| POST | `/Chat/read-chat?chatId=` | `{ chatId, readAt }`; Socket.IO `chat:read` `{ chatId, userId, readAt }` ba tarafi digar |
| GET | `/Chat/get-unread-count` | `{ count }` — shumorai chat-hoe ki paymi naxonda dorand (badge) |

- `ChatDto` + `unreadCount` (paymhoi tarafi digar pas az `readAt`-i man), `peerReadAt: string | null` (baroi "Seen").
- `PUT /Chat/send-message` — maydoni ixtiyorii nav `SharedPostId` (share post ba Direct). Kamash yake: `MessageText`, `File`, `SharedPostId`.
- `MessageDto` + `sharedPost: { postId, image, userName } | null`.
- Typing: client → server `typing` `{ chatId, isTyping }`; server tekshirad ki user ishtirokchi ast → ba tarafi digar `typing` `{ chatId, userId, isTyping }`.

## 5. Suggestions (TZ #13, P1)

`GET /User/get-suggestions?Limit=5` → `(UserShort & { subscribersCount })[]` — userhoe ki man follow nakardaam: avval "follow-i follow-hoi man", ba'd populyartarin.

## 6. Chi hanuz nest (P2 dar TZ)

Hisobi xususi + follow request, Highlights, guruh-chat, mention, like-i comment, presence (nuqtai sabz).

## AC

- [ ] AC1: Like → `notification:new` ba muallif; unlike → notification nest; like-i posti xud → notification nest.
- [ ] AC2: `read-all` → `get-unread-count` = 0.
- [ ] AC3: Explore posthoi xud va follow-shudaro nishon namedihad.
- [ ] AC4: Hashtag `#Pamir` dar post → `/Hashtag/search?Query=pam` onro meyobad, `get-posts` postro medihad.
- [ ] AC5: Reply ba reply → 400; hazfi comment bo 2 javob → `commentCount` −3.
- [ ] AC6: Paym → `unreadCount` = 1 baroi qabulkunanda; `read-chat` → 0 va firistanda `chat:read` megirad ("Seen").
- [ ] AC7: Typing ba tarafi digar merasad; useri begona typing firistoda nametavonad.
- [ ] AC8: Share post → `MessageDto.sharedPost` bo `postId`.
