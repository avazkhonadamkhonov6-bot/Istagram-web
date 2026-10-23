# ROADMAP — Rohi loyiha az ruzi 1 to miqyosi kalon

> PLAN.md — **4 ruzi avval** soat ba soat. ROADMAP — **manzarai kalon**: chi versiya, kay, chi dorad va chi guna mefahmem ki tayyor ast.
> Holat: TODO · DOING · DONE

```
v0.1 Backend ──▶ v0.2 Frontend ──▶ v0.3 Production ──▶ v0.4 Pardoz ──▶ v1.0 Relizi purra ──▶ v2.0 Miqyos
  Ruzi 1–2         Ruzi 3–4          Hafta 2             Hafta 3–4        Moh 2               Moh 3+
```

---

## v0.1 — Backend-i purra
**Muhlat:** Ruzi 1–2 · **Tafsilot:** [PLAN.md](PLAN.md) Ruzi 1–2

| Milestone | Chi dorad | Spec |
|---|---|---|
| M1 Poydevor | Monorepo, Docker (Postgres + Redis + MinIO), Prisma schema, CI, health, logger | 00, 11 |
| M2 Akkaunt | Auth (username + parol, argon2, rotation), profil, follow | 01, 02 |
| M3 Kontent | Media (S3 presign), postho, like, comment, saved | 03, 04 |
| M4 Lenta | Feed, Explore, Search, hashtag | 05 |
| M5 Realtime | Gateway + Redis adapter, worker, notifications, Direct, Stories, Reels | 06–09, 11 |

**Tayyor, agar:** hamai endpoint-ho dar Swagger kor mekunand, e2e sabz, **API freeze** shud.

---

## v0.2 — Frontend + MVP-i purra
**Muhlat:** Ruzi 3–4 · **Tafsilot:** [PLAN.md](PLAN.md) Ruzi 3–4

| Milestone | Chi dorad | Spec |
|---|---|---|
| M6 Poydevori front | Rangho + dark, BFF, shadcn/ui, layout (245 / 72 / mobil) | 10 |
| M7 Sahifahoi asosi | Login/Signup, Feed, Post modal, Profil, Explore, Search | 01–05, 10 |
| M8 Funksiyahoi zinda | Create, Stories, Reels, Direct, Notifications | 06–09 |
| M9 Sifat | AC-hoi hamai spec-ho, Playwright, Lighthouse, testi qat'shavi | 11 |

**Tayyor, agar:** DoD-i [TZ.md §9](TZ.md) purra ijro shud → **MVP (demo)**.

---

## v0.3 — Production (deploy)
**Muhlat:** Hafta 2 (~5 ruz)

- [ ] Domain + HTTPS, Cloudflare (CDN + WAF)
- [ ] Web → Vercel; API + worker → Railway/Render (2 servisi alohida)
- [ ] Postgres → Neon (bo backup-i avtomati), Redis → Upstash, media → S3 + CloudFront
- [ ] Secrets dar platforma (ne dar fayl), `Secure` cookie-ho
- [ ] CI → CD: merge ba `main` → deploy-i avtomati, `prisma migrate deploy`
- [ ] Sentry dar production, alert dar Telegram/Email baroi 5xx
- [ ] **Testi barqarorkunii backup** (yak bor dasti)
- [ ] Playwright dar CI

**Tayyor, agar:** sayt dar internet kor mekunad, deploy bo yak merge, backup barqaror meshavad.

---

## v0.4 — Pardoz va P1
**Muhlat:** Hafta 3–4

| Funksiya | Prioritet |
|---|---|
| Suggestions-i beh ("follow-i follow-hoi shumo") | P1 |
| Algoritmi populyari Reels va Explore | P1 |
| Presence (nuqtai sabz), typing | P1 |
| Thumbnail baroi video dar worker | P1 |
| Recent searches, "Liked by ali and others" | P1 |
| Crop-i purra (1:1, 4:5, 16:9) dar Create | P1 |
| Virtualizatsiyai feed (agar dar MVP burida shud) | P1 |
| Optimizatsiya: Lighthouse ≥ 90, API p95 < 150 ms | P1 |
| "Forgot password" — kod ba Gmail (Gmail lokali, Brevo dar Render; [EMAIL.md](EMAIL.md)) — DONE 2026-10-23 | P1 |
| Instants real-time: `instant:new` + xabar dar har sahifa — DONE 2026-10-23 | P1 |
| TanStack Query: Devtools, refetch dar focus/reconnect, mutation bidun retry — DONE 2026-10-23 | P1 |

---

## v1.0 — Relizi purra (kopiyai Instagram)
**Muhlat:** Moh 2

| Funksiya | Tafsilot |
|---|---|
| Hisobi xususi + follow request | `isPrivate`, tasdiq/rad |
| Highlights | Story-hoi kuhna dar profil |
| Mention `@user` + notification | Dar caption va comment |
| Like baroi comment | |
| Direct-i guruhi | Chand ishtirokchi, nomi guruh |
| Paym bo aks/video, reaction ba paym | |
| Tagged posts | Tab-i "Tagged" dar profil |
| Block / Report / Mute | Amniyati user-ho |
| CAPTCHA (Turnstile) dar register | Himoya az botho |
| Sessiyaho | Ruyxati device-ho, "Log out everywhere" |
| Archive, edit-i comment | |

**Tayyor, agar:** hamai funksiyahoi **P2** dar [TZ.md §2](TZ.md) kor mekunand + har kadom spec-i xudro dorad.

> **2026-10-21:** qismi kalon az v1.0 ba **v0.2** guzasht ([Spec 14](specs/14-funksiyahoi-purra.md)): private + follow request, highlights, mention, comment like, group chat, dil-i paym, tagged, block / report / mute / restrict, close friends, archive, pin, collections, location. Backend va frontendi Avaz (FE-23…FE-25) tayyor; UI dar sahifahoi Abubakr — FE-26. Dar v1.0 memonand: CAPTCHA, sessiyaho, edit-i comment.

> **2026-10-21 (Spec 15):** ba v0.2 ilova shudand: Notes, tahriri paym, "Active now", remove follower, Favorites + feed, pin-i comment, reels-i profil, "Your activity". Dar v1.0 memonand: message requests, vanish mode, hidden words, sessiyaho / "Log out everywhere", 2FA, CAPTCHA, remix-i reels, stickers dar story.

---

## v2.0 — Miqyos (vaqte ki sarborii voqe'i oyad)
**Muhlat:** Moh 3+ · faqat agar metrikaho talab kunand

| Signal | Amal |
|---|---|
| DB > 70% CPU dar xondan | Replica-i Postgres baroi read |
| Yak nusxai API kam ast | 2+ nusxa pasi load balancer (Socket.IO alla'kay bo Redis adapter) |
| Feed sust (> 300 ms) | Fan-out on write: feed dar Redis |
| Justuju sust / ma'nidor nest | Meilisearch |
| Event-ho > 1000/s | Kafka ba joi event-hoi dokhili |
| Media va notifications sarbori kalon | Servishoi alohida (modulho alla'kay judo hastand) |
| Kishvarhoi gunogun | Multi-region, sharding, Kubernetes |

> **Qoida:** murakkabiro faqat vaqte ilova mekunem, ki metrika (Sentry, Grafana) nishon dihad ki lozim ast — ne pesh az on.

---

## Jadvali umumi

| Versiya | Muhlat | Natija | Holat |
|---|---|---|---|
| v0.1 | Ruzi 1–2 | Backend-i purra, API freeze | TODO |
| v0.2 | Ruzi 3–4 | MVP — demo | TODO |
| v0.3 | Hafta 2 | Sayt dar internet | TODO |
| v0.4 | Hafta 3–4 | P1, sur'at | TODO |
| v1.0 | Moh 2 | Kopiyai purrai Instagram (P2) | TODO |
| v2.0 | Moh 3+ | Miqyos az ruyi metrika | TODO |

**Qoidahoi kor bo roadmap:**
- Har funksiyai nav → avval **spec** dar `docs/specs/` (SDD), ba'd kod.
- Pas az har milestone → holat dar in fayl va dar [PROGRESS.md](PROGRESS.md) navsozi meshavad.
- Har versiya → `git tag v0.1`, `v0.2`... va qaydi kutoh dar `CHANGELOG.md`.
