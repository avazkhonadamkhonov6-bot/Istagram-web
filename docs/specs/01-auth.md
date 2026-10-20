# Spec 01 — Auth (username + parol)

**Ma'sul:** A · **Ruz:** 1 · **Prioritet:** P0

## Maqsad
User bo **username va parol** ruyxat meshavad va vorid meshavad. Ikta useri bo yak username **imkonnopazir** ast.

## Qoidahoi validatsiya

| Maydon | Qoida |
|---|---|
| `username` | `trim()` → `toLowerCase()`; 3–30 aloma; regex `^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]+$` |
| `password` | 8–64 aloma |
| `fullName` | ixtiyori, 0–60 aloma |

**Username-hoi mamnu' (reserved):** `admin, api, explore, reels, direct, stories, accounts, p, login, signup, settings, about` — chunki bo route-hoi frontend (`/explore`, `/p/:id`...) barxurd mekunand.

## Endpoint-ho

### `POST /auth/register` 🔓
```json
// request
{ "username": "Ali.Valiev", "password": "secret123", "fullName": "Ali Valiev" }
// 201 response
{ "user": { "id": "...", "username": "ali.valiev", "fullName": "Ali Valiev", "avatarUrl": null, "isVerified": false },
  "accessToken": "eyJ...", "refreshToken": "f3a9...", "accessExpiresIn": 900, "refreshExpiresIn": 604800 }
```
> Tokenho dar JSON **faqat ba BFF-i Next.js** merasand (NestJS — servisi dokhili). BFF (`app/api/auth/register/route.ts`) onhoro ba cookie-hoi `access_token` va `refresh_token` (`HttpOnly; SameSite=Lax; Path=/; Secure` dar production) meguzorad va ba brauzer faqat `{ user }` mefiristad. **Brauzer hech vaqt tokenro dar JavaScript namebinad.**
Xatoho: `400 VALIDATION_ERROR`, `409 USERNAME_TAKEN`, `400 USERNAME_RESERVED`.

**Algoritm (muhim):**
1. `username = dto.username.trim().toLowerCase()`
2. Agar dar ruyxati reserved → `400 USERNAME_RESERVED`
3. `findUnique({ username })` → agar hast → `409 USERNAME_TAKEN`
4. `argon2.hash(password, { type: argon2id })` → `user.create(...)`
5. Agar `create` xatoi Prisma `P2002` dihad (du darxost dar yak vaqt) → `409 USERNAME_TAKEN`
6. Tokenho sohta, javob dihed.

### `GET /auth/username-available?username=ali` 🔓
```json
{ "available": false }
```
Frontend inro hangomi navishtani username (debounce 400ms) istifoda mebarad — misli Instagram ✓ / ✗ nishon medihad.

### `POST /auth/login` 🔓
```json
{ "username": "ALI.valiev", "password": "secret123" }
```
200 — misli register. Xato: `401 INVALID_CREDENTIALS` ("Username yo parol noto'g'ri ast" — **nagued** kadomash galat ast).
Agar user nest — baz ham `argon2.verify` bo hash-i "dummy" ijro meshavad, ki az ruyi vaqti javob fahmidan nashavad ki username hast yo ne (timing attack).

### `POST /auth/refresh` 🔓
`{ "refreshToken": "..." }` — BFF az cookie megirad va mefiristad. NestJS tekshirad (hash dar DB, `revokedAt = null`, `expiresAt > now`) → tokeni kuhnaro `revoke` mekunad → jufti nav medihad (**rotation**).
Agar tokeni revoke-shuda istifoda shavad → hamai refresh token-hoi in user revoke meshavand (duzdii token).
200: `{ "accessToken": "...", "refreshToken": "...", ... }` · 401: `INVALID_REFRESH_TOKEN`.
Agar du darxost dar yak vaqt refresh kunand (du tab) — BFF faqat **yak** refresh mekunad (promise-i umumi), NestJS ba tokeni hozir revoke-shuda **10 soniya grace period** medihad, ki user bexuda logout nashavad.

### `POST /auth/logout`
`{ "refreshToken": "..." }` → revoke. BFF cookie-horo pok mekunad. `204`.

### `POST /auth/ws-ticket`
JWT-i 60 soniya (`JWT_WS_SECRET`, `{ sub, typ: "ws" }`) baroi ulanishi Socket.IO. Front onro tavassuti BFF `GET /api/realtime/ticket` megirad.

### `GET /auth/me`
`200 UserPreview` + `{ bio, website, followersCount, followingCount, postsCount }`.

## Tokenho

| Token | Muhlat | Nigohdori dar front | Payload |
|---|---|---|---|
| Access (JWT, HS256) | 15 daq. | cookie `access_token` (httpOnly) | `{ sub: userId, username }` |
| Refresh (tasodufi 64 bayt) | 7 ruz | cookie `refresh_token` (httpOnly) | — (dar DB faqat SHA-256 hash) |
| WS ticket (JWT) | 60 s | dar xotirai JS, faqat baroi `io()` | `{ sub, typ: "ws" }` |

BFF: agar NestJS `401` dihad → yak bor `/auth/refresh` → cookie-hoi nav → darxostro takror. Agar refresh ham 401 → cookie-ho pok, javobi 401 → front ba `/login` meravad.

## Amniyat
- `@nestjs/throttler` + storage-i **Redis**: login — 5/daq. baroi `IP + username`, register — 3/daq. baroi IP. Agar Redis nest — limit dar xotira (fallback). IP-i voqe'i az header `x-forwarded-for`, ki BFF mefiristad.
- `passwordHash` hech vaqt dar javob nameoyad (Prisma `select` / serializer).

## Kriteriyahoi qabul (AC)
- [ ] AC1: Register bo `Ali` → user bo username `ali` sohta meshavad.
- [ ] AC2: Register-i dubora bo `ali` yo `ALI` → `409 USERNAME_TAKEN`.
- [ ] AC3: 2 darxosti parallel bo yak username → faqat 1 user, duyumi 409.
- [ ] AC4: Login bo parol-i galat → 401, matni umumi.
- [ ] AC5: Access token muhlatash guzasht → refresh → darxost kor mekunad.
- [ ] AC6: Refresh tokeni kuhna (pas az rotation) → 401 va hamai sessiyaho baste meshavand.
- [ ] AC7: Username `explore` → `400 USERNAME_RESERVED`.
- [ ] AC8: Dar hech javob `passwordHash` nest.
- [ ] AC9: Dar brauzer `document.cookie` va `localStorage` token nadorand.
- [ ] AC10: 6 login-i galat dar 1 daqiqa → 429.
