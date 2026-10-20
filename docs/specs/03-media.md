# Spec 03 — Media (S3 + CDN)

**Ma'sul:** 🟦 Avaz — backend (BE-06, Ruzi 2) · 🟩 Abubakr — front (FE-10, FE-18) · **Prioritet:** P0

## Arxitektura

```
Brauzer ──1. POST /media/presign──▶ API ──▶ presigned PUT URL
Brauzer ──2. PUT fayl──────────────────────▶ S3 (MinIO lokali)
Brauzer ──3. POST /posts { media:[{key}] }─▶ API (HeadObject → tekshirish)
Namoish:  https://<CDN_URL>/<key>  (CloudFront; lokali — http://localhost:9000/<bucket>/<key>)
```

Backend fayli kalonro **qabul nemekunad** — faqat URL medihad. In tez va arzon ast.

## Tagyirandaho (.env)
```
S3_ENDPOINT=http://localhost:9000      # baroi AWS — xoli
S3_REGION=us-east-1
S3_BUCKET=instagram
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true               # baroi MinIO
CDN_URL=http://localhost:9000/instagram
```
Kitobxona: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.

## `POST /media/presign`
```json
// request
{ "contentType": "image/jpeg", "size": 2400000, "purpose": "POST" }
// 200
{ "key": "uploads/<userId>/9f1c...e2.jpg", "uploadUrl": "https://...signed", "publicUrl": "https://cdn/.../9f1c...e2.jpg", "expiresIn": 300 }
```

| purpose | Tiphoi ijozatdoda | Andozai maks. |
|---|---|---|
| `AVATAR` | image/jpeg, image/png, image/webp | 5 MB |
| `POST` | image/* (jpeg/png/webp), video/mp4 | aks 10 MB, video 100 MB |
| `STORY` | image/*, video/mp4 | 30 MB |
| `REEL` | video/mp4 | 100 MB, ≤ 90 son. |
| `MESSAGE` | image/*, video/mp4 | 25 MB |

Xato: `400 MEDIA_TYPE_NOT_ALLOWED`, `400 MEDIA_TOO_LARGE`.

## Tekshirishi key (dar hamai modulho)
Funksiyai umumi `MediaService.assertOwnedKey(userId, key)`:
1. `key.startsWith(\`uploads/${userId}/\`)` — vagarna `403 MEDIA_FORBIDDEN`.
2. `HeadObject` — fayl voqean hast — vagarna `400 MEDIA_NOT_UPLOADED`.

`MediaService.url(key)` → `${CDN_URL}/${key}`. Dar DB faqat **key** nigoh doshta meshavad, ne URL (CDN metavonad tagyir yobad).

## Andozai media
`width`, `height`, `durationSec` — frontend pesh az upload hisob mekunad (`Image`/`video.onloadedmetadata`) va hangomi sohtani post mefiristad. Frontend aksro pesh az upload **crop** mekunad (1:1, 4:5, 1.91:1 — misli Instagram), reels/story — 9:16.

## Korkard dar worker (queue `media`, Spec 11)
Pas az sohtani post/story/avatar → job `process-image`: `sharp` tekshirad ki fayl voqean aks ast (magic bytes — agar ne → `status = FAILED`, fayl hazf, dar feed nishon doda nameshavad), versiyahoi **WebP 1080 / 640 / 320** mesozad va dar `PostMedia` qayd mekunad. To tamom shudan front originalro nishon medihad — user intizor nameshavad.

Thumbnail baroi video (P1): frontend kadri avvalro bo `<canvas>` megirad va hamchun aksi alohida upload mekunad → `thumbnailKey`.

## docker-compose
MinIO + konteyneri `mc` ki bucket-ro mesozad va `anonymous set download` mekunad (baroi xondani public).

## AC
- [ ] AC1: Presign → PUT bo curl → fayl dar MinIO hast va az `publicUrl` kushoda meshavad.
- [ ] AC2: `contentType: application/pdf` → 400.
- [ ] AC3: Key-i useri digar dar `POST /posts` → 403.
- [ ] AC4: Key-e ki upload nashudaast → 400 `MEDIA_NOT_UPLOADED`.
