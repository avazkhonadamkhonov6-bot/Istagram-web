# Spec 08 — Direct (chati realtime)

**Ma'sul:** Avaz — backend (BE-11, Ruzi 3) va front (FE-17, Ruzi 4) · **Prioritet:** P0 (1:1); guruh — P2

## REST

### `GET /conversations?cursor`
```ts
interface ConversationDto {
  id: string;
  peer: UserPreview;               // baroi 1:1 — tarafi digar
  lastMessage: MessageDto | null;
  unreadCount: number;
  lastMessageAt: string;
}
```
Tartib: `lastMessageAt DESC`.

### `POST /conversations` — `{ "username": "ali" }`
Agar suhbati 1:1 bo ali hast → hamonro bargardonad (200), vagarna nav mesozad (201). Bo xud → 400.

### `GET /conversations/:id/messages?cursor&limit=30`
Faqat ishtirokchi (vagarna 403). Tartib `createdAt DESC` (frontend chappa nishon medihad).
```ts
interface MessageDto {
  id: string; conversationId: string; senderId: string;
  text: string | null; mediaUrl: string | null;
  sharedPost: PostGridItem | null;   // "Share to Direct" az post
  createdAt: string; isDeleted: boolean;
}
```

### `POST /conversations/:id/messages` — `{ text?, mediaKey?, sharedPostId? }`
Kamash yake az se boyad boshad. 201 `MessageDto`. **Hamin endpoint asosi** ast; WebSocket faqat baroi rasonidan (delivery) — in soddatar va bovarinoktar.

### `POST /conversations/:id/read` → 204 (`lastReadAt = now`)
### `DELETE /messages/:id` — faqat firistanda ("Unsend") → `deletedAt`; event `message:deleted`.
### `GET /conversations/unread-count` → `{ count }` — baroi badge dar sidebar.

## WebSocket (Socket.IO)

- URL: `ws://localhost:4000/ws`, auth: front `GET /api/realtime/ticket` (BFF) → `io(url, { auth: { ticket } })` (Spec 01 — WS ticket 60 s).
- Dar `handleConnection`: ticket tekshirish (`typ: "ws"`) → agar galat → `disconnect()`. Socket ba room `user:<userId>` dokhil meshavad. Hangomi reconnect — ticket-i nav.
- `@socket.io/redis-adapter` — event-ho az worker va az chand nusxai API ba socket merasand.
- Pas az har reconnect front paymhoi suhbati kushoda va `unread-count`-ro **refetch** mekunad (paymhoe ki dar vaqti qat'shavi omadand, gum nameshavand — manba'i haqiqat REST/DB ast, socket faqat xabar medihad).
- Firistodani paym idempotent: front `clientId` (uuid) mefiristad → `@@unique([senderId, clientId])` dar `Message`; takrori darxost → hamon paym bargardonida meshavad.
- `RealtimeGateway` — **yak gateway umumi** baroi Direct va Notifications (Spec 09). Servisho `RealtimeService.emitToUser(userId, event, payload)`-ro istifoda mebarand.

| Event | Samt | Payload |
|---|---|---|
| `message:new` | server → client | `MessageDto` (ba hamai ishtirokchiyon, gayr az firistanda) |
| `message:deleted` | server → client | `{ id, conversationId }` |
| `conversation:read` | server → client | `{ conversationId, userId, lastReadAt }` → "Seen" |
| `typing` | client → server | `{ conversationId, isTyping }` |
| `typing` | server → client | `{ conversationId, userId, isTyping }` |
| `presence` (P1) | server → client | `{ userId, online }` → nuqtai sabz |

Typing: server tekshirad ki user ishtirokchi ast; frontend `isTyping:false`-ro pas az 3 son. bekori mefiristad.

## Frontend (Ruzi 4)
- `/direct/inbox` — chap ruyxati suhbatho (397px), rost — "Your messages" + tugmai "Send message".
- `/direct/t/[id]` — sarlavha (avatar, username), paymho: xudam — rost, `--ig-outgoing-message-bubble` bo matni `--ig-text-on-color`; digaron — chap, `--ig-incoming-message-bubble` bo matni `--ig-primary-text`; "Seen" zeri paymi oxirin.
- Modali "New message": search-i user (Spec 05).
- Optimistic update: paym favran namoyon meshavad, pas az javobi API — tasdiq.

## AC
- [ ] AC1: Du brauzer — paym dar < 1 son. bidun refresh merasad.
- [ ] AC2: `POST /conversations` bo yak user 2 bor → yak suhbat.
- [ ] AC3: Useri begona `GET /conversations/:id/messages` → 403.
- [ ] AC4: Socket bo tokeni galat — qat' meshavad.
- [ ] AC5: `unreadCount` pas az `read` → 0, tarafi digar "Seen" mebinad.
