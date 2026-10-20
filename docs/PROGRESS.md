# PROGRESS — Kujo hastem, chi monda

> Har qadam pas az tamom shudan `[x]` meshavad. Belgiho: ⬜ ogoz nashud · 🟡 dar jarayon · ✅ tayyor · ⛔ masala (dar "Qaydho" navised)

**Holati umumi:** ⬜ Ruzi 1 · ⬜ Ruzi 2 · ⬜ Ruzi 3 · ⬜ Ruzi 4
**Hozir:** Hujjatho (TZ, PLAN, specs) tayyor → **qadami navbati: Ruzi 1, Qadami 0**

## 📄 Hujjatho
- [x] TZ.md
- [x] PLAN.md
- [x] ROADMAP.md
- [x] specs/00–11 (11 — infra va bovarinoki)
- [x] Stack navsozi shud: Redis, BullMQ, BFF, argon2, Zod, shadcn/ui, CI, Sentry

## RUZI 1 — Backend
### Qadami 0 (setup)
- [ ] `corepack enable`, pnpm nasb (A)
- [ ] Monorepo: `apps/web` (Next.js-i hozira kuchonida shud), `apps/api`, `packages/shared` (Zod), `turbo.json`, TS strict (A)
- [ ] CI — GitHub Actions (A)
- [ ] docker-compose: PostgreSQL + Redis + MinIO + bucket (B)
- [ ] `.env.example` + tekshirishi Zod (B)
### Poydevor
- [ ] `schema.prisma` + migratsiyai avval (A)
- [ ] Prisma, ZodValidationPipe, filter-i xato, logger, Swagger, /health (A)
- [ ] Redis + CacheService (bypass), BullMQ + worker.ts (B) — Spec 11
- [ ] common: pagination, `@CurrentUser`, error codes (B)
### Modulho
- [ ] Auth — Spec 01 (A) · AC 1–8
- [ ] Users + Follow — Spec 02 (A) · AC 1–6
- [ ] Media — Spec 03 (B) · AC 1–4
- [ ] Posts + Like + Saved — Spec 04 (B)
- [ ] Comment + replies — Spec 04 (B) · AC 1–7

## RUZI 2 — Backend
- [ ] Feed + grid-i profil — Spec 05 (A)
- [ ] Explore + Search + Hashtag — Spec 05 (A) · AC 1–5
- [ ] RealtimeGateway + Redis adapter, job-i media (B)
- [ ] Stories — Spec 06 (B) · AC 1–4
- [ ] Notifications — Spec 09 (A) · AC 1–4
- [ ] Direct REST + WS — Spec 08 (B) · AC 1–5
- [ ] Reels — Spec 07 (B) · AC 1–4
- [ ] Suggestions (A, P1)
- [ ] Seed (A)
- [ ] e2e test-ho + testi bovarinoki Spec 11 AC1–7 (A + B)
- [ ] 🔒 Freeze-i API

## RUZI 3 — Frontend
- [ ] Rangho + dark mode, BFF (auth + proxy), api-client (Zod), Query, proxy.ts + CSP, Sentry (A)
- [ ] shadcn/ui + komponenthoi UI, error/loading (B)
- [ ] Layout: sidebar / bottom nav / panel-ho (A)
- [ ] Login / Signup (B)
- [ ] Feed + PostCard (A)
- [ ] Profil + edit + password (B)
- [ ] Post modal + comment-ho (A)
- [ ] Explore + Hashtag + Search (B)

## RUZI 4 — Frontend + yakun
- [ ] Create modal (post / reel / story) (A)
- [ ] Socket client + Notifications (B)
- [ ] Stories tray + viewer (A)
- [ ] Direct inbox + chat (B)
- [ ] Reels (A)
- [ ] Pardoz: dark toggle, 404, empty states (B)
- [ ] Testi umumi bo AC-ho + Playwright + Lighthouse + testi qat'shavi (A + B)
- [ ] README + demo

## Qaydho / masalaho
- 2026-10-20: Dar kompyuter **pnpm** va **Docker** hanuz nasb nashudaand → Qadami 0.
- 2026-10-20: Muhlati 4 ruz baroi hamai funksiyaho xele kam ast — tartibi buridan dar PLAN.md.
- 2026-10-20: Hujjati stack qabul shud. Moslashkuniho: counter-ho dar PostgreSQL (Redis faqat kesh), CAPTCHA va Meilisearch/Kafka/K8s — berun az 4 ruz.
