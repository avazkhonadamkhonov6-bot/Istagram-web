# Spec 16 — Zangi audio / video, paymi ovozi / video, efiri mustaqim

**Ma'sul:** Avaz (backend — tayyor; front-i Direct — FE-30), Abubakr (front-i efir — FE-31) · **Sana:** 2026-10-22 · **Prioritet:** P0

> Sabab: dar Instagram-i asli dar Direct zangi audio va video, paymi ovozi va video, va efiri mustaqim (Live) hast.
> Hamai endpoint-hoi Spec 12–15 **tagyir nayoftand** — faqat maydonhoi nav bo qimati peshfarz ilova shudand.
> Formati javob, auth, xatoho — hamon Spec 12 §1. Socket — hamon `/ws` bo ws-ticket (Spec 08).

## 0. Chi tavr kor mekunad (WebRTC)

- Audio va video **bevosita bayni brauzerho** meravad (WebRTC, `RTCPeerConnection`). Server videoro namebinad va nigoh namedorad.
- Server faqat **signaling** mekunad: offer / answer / ICE candidate-ro bayni ishtirokchiyon meguzaronad va holati zangro nigoh medorad.
- ICE server-ho: `GET /Call/get-ice-servers` → `IceServer[]` → `new RTCPeerConnection({ iceServers })`.
  Peshfarz — STUN-i ozodi Google. Agar dar shabakai mahdud (NAT-i qat'i) zang vasl nashavad — dar `.env`-i API `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` guzoshta meshavad (masalan, coturn yo Metered).
- Event-hoi client → server bo **ack** javob medihand: `{ ok: true, data? }` yo `{ ok: false, code }` (`code` — az `ErrorCode`).

## 1. Paymi ovozi va video (Direct)

- Hamon `PUT /Chat/send-message` (multipart): `File` — audio (`audio/webm`, `audio/ogg`, `audio/mpeg`, `audio/mp4`, to 10 MB) yo video (`video/mp4`, `video/webm`, `video/quicktime`, to 100 MB).
- Maydoni nav **`Duration`** (soniya, 0..3600) — davomnokii paym baroi namoish ("0:07"). Baroi aks nigoh doshta nameshavad.
- `MessageDto` + `durationSec: number | null`, `fileType: 'audio' | 'video'`.
- UI misli Instagram: tugmai mikrofon (pahsh karda nigoh dor → navishtan, kashidan ba chap → bekor), mavji ovoz va vaqt; tugmai kamera → navishtani video to 60 s; dar chat — player bo davomnoki.

## 2. Zangi audio va video (Direct, 1:1 va group)

| Funksiya | API | Javob |
|---|---|---|
| ICE server-ho | `GET /Call/get-ice-servers` | `IceServer[]` |
| Ogozi zang | `POST /Call/start-call` `{ chatId, type: 'AUDIO' \| 'VIDEO' }` | `CallDto` (`RINGING`); ba digaron `call:incoming`; man dar zangi digar → 409 `CALL_BUSY`; blok → 403 |
| Qabul | `POST /Call/accept-call?callId=` | `CallDto` (`ONGOING`); ba digaron `call:accepted` `{ call, userId }` |
| Rad | `POST /Call/decline-call?callId=` | 1:1 → `DECLINED`; group → faqat man (`call:declined`); hama rad kardand → `MISSED` |
| Anjom / baromadan | `POST /Call/end-call?callId=` | agar < 2 nafar monad → `ENDED`; zangzananda pesh az qabul → `MISSED`; dar group — `call:left` |
| Zang bo id | `GET /Call/get-call-by-id?callId=` | `CallDto`; begona → 403 |
| Zanghoi faol | `GET /Call/get-active-calls` | `CallDto[]` — pas az refresh zangi voridshavandaro nishon dihed |
| Ta'rix | `GET /Call/get-calls?PageNumber=&PageSize=` | `CallDto[]` (paged), nav avval |

**Holatho:** `RINGING` → `ONGOING` → `ENDED`; bidun javob **45 s** → `MISSED`; 1:1 rad → `DECLINED`.

**Socket:**
- server → client: `call:incoming` (CallDto), `call:accepted` / `call:declined` / `call:left` (`{ call, userId }`), `call:ended` (CallDto), `call:signal` (`{ callId, fromUserId, signal }`).
- client → server: `call:signal` `{ callId, toUserId, signal: { type: 'offer' | 'answer' | 'candidate', sdp?, candidate? } }` — faqat bayni ishtirokchiyoni zangi faol; aks holat ack `FORBIDDEN` / `CALL_NOT_ACTIVE`.

**Tartibi WebRTC (muhim, to har du taraf yak xel kunand):**
1. A: `start-call` → `getUserMedia` (audio yo audio+video) → intizori `call:accepted`.
2. B: `call:incoming` → ekrani zang (Accept / Decline, ringtone) → `accept-call` → `getUserMedia` → **B offer mesozad** va ba har ishtirokchii dar zang (`participants` bo `joinedAt` va bidun `leftAt`) `call:signal` mefiristad.
3. A: `call:signal` (offer) → `setRemoteDescription` → answer → `call:signal`. ICE candidate-ho — har du taraf, `onicecandidate` → `call:signal`.
4. Group: har ilovashavanda ba hamai dar zang offer mefiristad (mesh, to ~8 nafar).
5. Anjom: `end-call` → `pc.close()`, track-ho `stop()`. `call:ended` → ekrani zang bastа meshavad.

**Paymi "zang" dar chat:** pas az anjom dar chat paym bo `MessageDto.call = { callId, type, status, durationSec }` paydo meshavad (`message:new` ba hama).
UI: "Audio call · 3:12", "Video call ended", "Missed video call", tugmai "Call back".

**Offline:** agar hamai socket-hoi ishtirokchi qat' shavand (15 s — refresh-i sahifa zangro namebandad) → u az zang mebaroyad.

**UI misli Instagram:** dar header-i chat ikonkahoi telefon va kamera; ekrani zang — avatar, nom, "Calling…" / "Ringing…" / vaqt; tugmaho: mute, kamera on/off, ivazi kamera (mobil), speaker, end (surx); video-i xud — tasviri xurd dar kunj; zangi voridshavanda — modal dar har sahifa bo ringtone.

## 3. Efiri mustaqim (Live)

| Funksiya | API | Javob |
|---|---|---|
| Ogoz | `POST /Live/start-live` `{ title? (≤100) }` | `LiveDto`; allakay dar efir → 409 `LIVE_ALREADY_STARTED`; ba follower-ho `live:started` va notification `LIVE_STARTED` |
| Anjom | `POST /Live/end-live?liveId=` | `LiveDto` (`ENDED`); faqat muallif (403); ba tamoshobinho `live:ended` |
| Efirhoi faol | `GET /Live/get-lives` | `LiveDto[]` — userhoe ki man follow mekunam (+ xudam); baroi halqai "LIVE" dar qatori story |
| Efir bo id | `GET /Live/get-live-by-id?liveId=` | `LiveDto`; private (follow namekunam) yo blok → 404 |
| Comment-ho | `GET /Live/get-comments?liveId=` | 100-i oxirin, kuhna avval |
| Comment | `POST /Live/add-comment` `{ liveId, text (1..150) }` | `LiveCommentDto`; efir tamom → 400 `LIVE_NOT_ACTIVE`; ba hama `live:comment` |

`LiveDto { liveId, user, title, status: 'LIVE' | 'ENDED', startedAt, endedAt, viewerCount, peakViewers }`.

**Socket:**
- client → server: `live:join` `{ liveId }` (ack `data: LiveDto`; `LIVE_FULL` — maks. **50** tamoshobin), `live:leave` `{ liveId }`, `live:heart` `{ liveId }`, `live:signal` `{ liveId, toUserId, signal }` (faqat muallif ↔ tamoshobin).
- server → client: `live:started`, `live:ended` (LiveDto), `live:viewer-joined` `{ liveId, user }` (faqat ba muallif), `live:viewer-left` `{ liveId, userId }`, `live:viewers` `{ liveId, viewerCount }`, `live:comment` (LiveCommentDto), `live:heart` `{ liveId, userId }`, `live:signal` `{ liveId, fromUserId, signal }`.

**Tartibi WebRTC:**
1. Muallif: `getUserMedia({ video, audio })` → `start-live` → preview-i xud.
2. Tamoshobin: `live:join` → intizori offer.
3. Muallif: `live:viewer-joined` → baroi hamin tamoshobin `RTCPeerConnection` nav, track-ho ilova, **offer** → `live:signal`.
4. Tamoshobin: offer → answer → `live:signal`; ICE — har du taraf.
5. `live:viewer-left` → muallif connection-i hamon tamoshobinro mebandad. `live:ended` → tamoshobin "Live video ended" mebinad.

**Mahdudiyatho:** muallif offline (15 s) → efir xudkor tamom meshavad; restart-i server → hamai efirho tamom. Efir nigoh doshta nameshavad (Instagram "Share to story"-ro dar in versiya nadorem).

**UI misli Instagram:** dar Create → "LIVE"; ekrani efir — video-i purra, "LIVE" (surx) va shumorai tamoshobinho dar bolo, comment-ho dar poyon (ba bolo meravand), dil-ho (animatsiya), tugmai "End"; tamoshobin: ruyxat dar story tray bo halqai surxi "LIVE", comment, dil, tugmai X.

## 4. Kodhoi xato (nav)

`CALL_NOT_FOUND` (404), `CALL_BUSY` (409), `CALL_NOT_ACTIVE` (400), `LIVE_NOT_FOUND` (404), `LIVE_ALREADY_STARTED` (409), `LIVE_NOT_ACTIVE` (400), `LIVE_FULL` (400).

## 5. Frontend

| Sahifa / komponent | Chi | Kas |
|---|---|---|
| Direct: paymi ovozi | navishtan bo `MediaRecorder` (pahsh karda nigoh dor / kashidan — bekor), `Duration`, player bo mavj va vaqt | Avaz (FE-30) |
| Direct: paymi video | navishtani video to 60 s yo intixobi fayl, `Duration`, player | Avaz (FE-30) |
| Direct: zang | ikonkahoi telefon / kamera dar header, ekrani zang, zangi voridshavanda (modal dar har sahifa + ringtone), mute / kamera / end, paymi "zang" dar chat, "Call back" | Avaz (FE-30) |
| Efir: sahifaho | `/live` (ruyxat + "Go live"), `/live/new` (muallif: preview, unvon, comment-ho, dil-ho, tamoshobinho, "End"), `/live/[id]` (tamosho, comment, dil, "Live video ended") | Avaz (FE-30) — tayyor |
| Efir: darvozaho | Create → "Live", halqai "LIVE" dar story tray, klik bar notification-i `LIVE_STARTED`, nishon dar profil | Abubakr (FE-31) |

Kodi WebRTC dar `apps/web/src/features/rtc/`: `api.ts`, `peer.ts` (RTCPeerConnection, navbati signal-ho), `call-store.ts` (zang), `live.ts` (`useLiveHost`, `useLiveViewer`), `components/call-layer.tsx` (qabati global dar `QueryProvider`), `components/live-views.tsx`.

## 6. Kriteriyahoi qabul

- **AC1** Zangi video 1:1: B `call:incoming` megirad; begona signal → `FORBIDDEN`; qabul → A `call:accepted`; offer / answer / ICE meguzarand; end → har du `call:ended` (`ENDED`), dar chat paymi zang.
- **AC2** Dar zang hastam → zangi nav 409 `CALL_BUSY`.
- **AC3** Rad (1:1) → `DECLINED`; zangzananda pesh az qabul bekor kard → `MISSED`; har du dar chat.
- **AC4** Hamai socket-hoi ishtirokchi qat' → zang tamom.
- **AC5** Paymi ovozi va video bo `Duration` → `durationSec`; `Duration` < 0 → 400.
- **AC6** Efir: follower `live:started` va notification megirad; join → muallif `live:viewer-joined`; signal faqat muallif ↔ tamoshobin; comment va dil ba hama; `viewerCount` / `peakViewers`; end → `live:ended`; pas az anjom join → `LIVE_NOT_ACTIVE`.
- **AC7** Efiri hisobi private — begona: join → `LIVE_NOT_FOUND`, `get-live-by-id` → 404.

Hamai AC dar `apps/api/test/spec16.e2e-spec.ts` (7 test); hamagi e2e — 48/48.
Sanjishi voqe'ii audio/video — dar du brauzer (yo du kompyuter) bo hamon API-i Render, pas az FE-30 / FE-31.
