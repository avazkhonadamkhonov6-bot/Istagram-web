# Spec 17 — Instants (aksi momentali dar Direct)

**Ma'sul:** Avaz (backend + Direct) · **Sana:** 2026-10-22 · **Prioritet:** P1

> Sabab: Instagram dar 2025 funksiyai "Instants"-ro ilova kard — aksi zud az kamera, ki dustoni nazdik yak bor mebinand.
> Endpoint-hoi Spec 12–16 tagyir nayoftand. Formati javob, auth, xatoho — hamon Spec 12 §1.

## 1. Qoidaho

- Faqat **aks az kamera**: galereya, filtr, matn va tahrir nest. Aks foran firistoda meshavad; muallif metavonad "Undo" kunad.
- Kiho mebinand: followerhoe, ki muallif onhoro follow kardaast (mutual), yo agar `closeFriends` — faqat close friends-i muallif; blok — nest.
- Har giranda instant-ro **yak bor** mebinad: pas az `view-instant` digar dar ruyxati u nest.
- **24 soat** pas az firistodan baroi hama nopadid meshavad; dar archive-i muallif **1 sol** memonad (faqat muallif mebinad).

## 2. API

| Funksiya | API | Javob |
|---|---|---|
| Firistodan | `POST /Instant/add-instant?CloseFriends=` (multipart `Image`, faqat aks) | `InstantDto`; be fayl → 400 `MEDIA_REQUIRED`; video → 400 `MEDIA_TYPE_NOT_ALLOWED` |
| Instant-hoi nadida | `GET /Instant/get-instants` | `InstantDto[]` (kuhna → nav, maks. 50) — faqat az digaron |
| Didan | `POST /Instant/view-instant?id=` | `true`; agar nest → 404 `INSTANT_NOT_FOUND` |
| Undo / hazf | `DELETE /Instant/delete-instant?id=` | `true`; faqat muallif, digaron → 404 `INSTANT_NOT_FOUND` |
| Archive | `GET /Instant/get-instant-archive` | `InstantDto[]` (nav → kuhna, 1 sol, maks. 100) |

`InstantDto { id, userId, userName, userImage, fileName, closeFriends, createdAt, expiresAt, viewCount }` — `viewCount` faqat baroi muallif, baroi digaron `null`.

Jadvalho: `Instant`, `InstantView` (migratsiyai `spec17_instants`).

## 3. Frontend

| Komponent | Chi | Kas |
|---|---|---|
| Direct: tugmai Instants | dar kunji rost-i poyoni inbox; agar instant-i nav boshad — tudai aksho-i kaj va shumora (`--ig-badge`), vagarna ikonka | Avaz |
| Binanda | ekrani siyoh, header (avatar, nom, vaqt, nishoni close friends), click → navbati; har aks hangomi namoyish `view-instant` | Avaz |
| Kamera | `getUserMedia`, Friends / Close friends (`--ig-close-friends`), tugmai aksgiri, ivazi kamera; toast bo "Undo" | Avaz |
| Archive | panjarai aksho bo shumorai binandagon, hazf | Avaz |

Kod: `apps/web/src/features/instants/` (`api.ts`, `components/instants.tsx`), dar `features/direct/components/chat-list.tsx` vasl shudaast.

## 4. Kriteriyahoi qabul

- **AC1** Instant-ro faqat dusti mutual mebinad; muallif dar javob `viewCount` megirad.
- **AC2** Pas az `view-instant` instant az ruyxati giranda nopadid meshavad; dar archive `viewCount = 1`.
- **AC3** `closeFriends` — faqat close friends mebinand.
- **AC4** Undo — faqat muallif; begona → 404.
- **AC5** Pas az 24 soat nopadid; be fayl → 400.

Hamai AC dar `apps/api/test/spec17.e2e-spec.ts` (5 test).
