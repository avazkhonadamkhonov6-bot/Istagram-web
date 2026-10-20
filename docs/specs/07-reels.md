# Spec 07 — Reels

**Ma'sul:** B · **Ruz:** 2 · **Prioritet:** P0

## Qoidaho
- Reel = `Post` bo `type = REEL` va **aniq 1 video** (≤ 90 son., 9:16 tavsiya).
- Sohtan — hamon `POST /posts` bo `"type": "REEL"` (Spec 04). Like, comment, save — hamon endpoint-ho.

## Endpoint-ho

### `GET /reels?cursor&limit=5`
- Hamai reel-ho (az hama), tartib: avval az follow-shudaho dar 3 ruzi oxir, ba'd populyar (`likeCount DESC`, `createdAt DESC`).
- Soddakardashuda baroi 4 ruz: `createdAt DESC` qabul ast (P0), algoritmi populyar — P1.
- Javob: `{ items: PostDto[], nextCursor }`.

### `POST /reels/:id/view` → 204
`viewCount++` (bo debounce dar front: faqat pas az 2 soniya tamosho, yak bor dar sessiya).

### `GET /users/:username/reels` — Spec 02.

## Frontend (Ruzi 4)
- Sahifai `/reels`: scroll-i vertikali bo `scroll-snap-type: y mandatory`, har reel balandii purrai ekran (desktop — markaz, 9:16, ~ 400×711px).
- `IntersectionObserver`: video-i namoyon — `play()`, digaron — `pause()`. Peshfarz `muted`, tugmai ovoz.
- Rost: like ❤ (shumora), comment 💬, share ✈, save 🔖, ... ; poyon: avatar + username + Follow + caption.
- Double-tap → like bo animatsiyai dil.

## AC
- [ ] AC1: Reel bo 2 video → 400.
- [ ] AC2: Reel bo aks → 400.
- [ ] AC3: `/reels` faqat `type=REEL` medihad.
- [ ] AC4: Reel dar profil dar tab-i "Reels" namoyon ast.
