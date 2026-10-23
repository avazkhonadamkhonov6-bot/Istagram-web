# PROGRESS — Kujo hastem, chi monda

> Pas az merge-i PR → `[x]`. Tafsiloti har vazifa — [TASKS.md](TASKS.md) va GitHub Issues.
> Holat: TODO — ogoz nashud · DOING — dar jarayon · DONE — tayyor · BLOCKED — masala

**Holati frontend Abubakr (2026-10-22):** vazifahoi MVP tayyor va dar muhiti mahalli sanjida shudand; [QA-02](qa/QA-02.md). Natijai deploy / CI-i GitHub alohida sanjida meshavad.
**Hozir (2026-10-22):** frontend-i FE-26/29/31 va ilovahoi FE-06/10/16/18 tayyor. API-i mahalli: 59/59 e2e, mock UI: 26/26, production UI: 15/15. Backend-i umumi dar Render qablan deploy shuda bud; ilovai kontrakti profil migratsiya va deploy-i navi API-ro talab mekunad.
**Frontend Abubakr:** [TASKS](TASKS.md) va [QA-02](qa/QA-02.md) nav shudand. Lighthouse: Performance / Accessibility 100/100 baroi feed va profil. CODEOWNERS: @Abubakr-63.

## Hujjatho
- [x] TZ.md, PLAN.md, ROADMAP.md, TASKS.md
- [x] specs/00–11
- [x] Stack: Redis, BullMQ, BFF, argon2, Zod, shadcn/ui, CI, Sentry
- [x] Taqsimi kor: Avaz (backend → front), Abubakr (front bo mock)

## RUZI 1
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-01 Monorepo (pnpm 10, NestJS 11, tsconfig strict) | [x] | FE-01 Tayyori, Next 16 docs |
| [x] | BE-02 Kontrakt (Zod) — Spec 12, `packages/shared` | [x] | FE-02 Rangho, dark, shadcn |
| [x] | BE-03 Prisma + migratsiya, infra, CI, docker-compose (faqat Postgres) | [x] | FE-03 Komponenthoi UI |
| [x] | BE-04 Account API | [x] | FE-04 MSW mock |
| [x] | BE-05 User, UserProfile, FollowingRelationShip | [x] | FE-05 Layout |

## RUZI 2
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-06 Media: upload-i multipart ba disk, `/images/*` | [x] | FE-06 Login / Signup |
| [x] | BE-07 Post, like, comment, favorite | [x] | FE-07 Feed + PostCard |
| [x] | BE-08 Feed (`get-following-post`), search (`get-users`, search history) | [x] | FE-08 Post modal |
| [x] | BE-09 Realtime gateway `/ws` (Notifications — P1) | [x] | FE-09 Profil |
| [x] | BE-10 Story API | [x] | FE-10 Edit profile + parol |

## RUZI 3
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | BE-11 Chat + Reels + Location API | [x] | FE-11 Explore, Search |
| [x] | BE-12 Seed + e2e (18 test, sabz) → **API freeze** | [x] | FE-12 Notifications panel |
| [x] | FE-13 BFF (`/api/auth/*`, `/api/[...path]`, `/api/realtime/ticket`) + proxy.ts + CSP | [x] | FE-14 Mock xomush, integratsiya |
| [x] | FE-15 Socket (ticket 60 s, reconnect + refetch) + realtime-i Direct | [x] | FE-16 Stories |

## RUZI 4
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | FE-17 Direct: inbox, chat, optimistic, unsend, New message | [x] | FE-18 Create modal |
| [x] | FE-19 Bovarinokii front: error.tsx, WidgetBoundary, offline banner, rollback | [x] | FE-20 Reels |
| [x] | FE-21 Playwright: 7 test (register, post, like, follow, direct x3) | [x] | FE-22 Pardoz, responsive |
| [x] | QA-01 — [docs/qa/QA-01.md](qa/QA-01.md) | [x] | QA-02 |
| [x] | FE-23 Direct-i Spec 14 (group, dil, reply, ovoz, story) | [x] | FE-26 UI-i Spec 14 |
| [x] | FE-24 `/accounts/*` (privacy, blocked, muted, restricted, close friends, archive) | | |
| [x] | FE-25 `/explore/locations/[name]`, `social/api.ts`, Share / Report dialog | | |
| [x] | BE-13 backend-i Spec 15 + seed (40 user, 35 reel, 101 story) | [x] | FE-29 UI-i Spec 15 |
| [x] | FE-27 Direct (notes, edit, "Active now") | | |
| [x] | FE-28 `/accounts/favorites`, `/accounts/activity` | | |
| [~] | README va demo tayyor; tag / relizi `v0.2` boqi ast | | |

## RUZI 5
| | Avaz | | Abubakr |
|---|---|---|---|
| [x] | Deploy: Render (API + Postgres), faylho dar DB (MediaFile), seed-i xudkor | | |
| [x] | BE-14 backend-i Spec 16: zang, paymi ovozi / video, efir | | |
| [x] | FE-30 Direct: zangi audio / video, paymi ovozi va video + sahifahoi efir (`/live`) | [x] | FE-31 Darvozahoi efir (Create, story tray, notification) |

## Qaydho / masalaho
- 2026-10-21: Kontrakti API ivaz shud — endpoint-ho aynan misli Swagger-i "Web Api" (`/Account/*`, `/Post/*`, `/Chat/*`...): [Spec 12](specs/12-api-kontrakt.md). URL/DTO-hoi spec-hoi 01–09 digar amal namekunand; qoidahoi amniyat boqi memonand.
- 2026-10-21: To P1 buridashud: Redis/BullMQ, Notifications, presign S3, refresh token (Spec 12 §10).
- 2026-10-21: Docker nest; PostgreSQL 18-i lokali (port 5432) istifoda meshavad. Ogoz: `pnpm --filter api db:deploy`, `pnpm --filter api db:seed`, `pnpm --filter api dev`, test: `pnpm --filter api test`.
- 2026-10-20: Dar kompyuteri Avaz **pnpm** va **Docker** hanuz nasb nashudaand → BE-01 / BE-03.
- 2026-10-20: Muhlati 4 ruz zich ast — tartibi buridan dar PLAN.md.
- 2026-10-20: Counter-ho dar PostgreSQL (Redis faqat kesh); CAPTCHA, Meilisearch, Kafka, K8s — berun az 4 ruz (ROADMAP).
- 2026-10-21: FE-13/15/17 dar brauzer sanjida shud (login, cookie-i httpOnly, `document.cookie` xoli, CSP bo nonce, paym dar realtime < 1 s, unsend, New message, mobil 375px, logout). Ticket-i Socket: `POST /Account/ws-ticket` (60 s), gateway JWT-i asosiro qabul namekunad.
- 2026-10-21: Typing, Seen, share post va badge-i notifications — nest, chunki dar kontrakti Spec 12 endpoint/event nadorand (P1).
- 2026-10-21 (baroi Abubakr): `src/components/layout/sidebar.tsx` — `usePathname()` berun az `<Suspense>` (Next 16 `cacheComponents` ogohi "Blocking Route" medihad). `CURRENT_USERNAME = "me"` boyad az `GET /api/UserProfile/get-my-profile` ivaz shavad. Aksho: `/api/images/<fileName>` (`lib/media.ts`), login: `POST /api/auth/login`.
- 2026-10-21: FE-19/FE-21/QA-01 tayyor. Dar QA 5 xato yoft va islohshud (parol dar log, rate limit dar BFF, offline rollback, ruyxati chat, status 201) — [QA-01](qa/QA-01.md).
- 2026-10-21 (baroi Abubakr): `OfflineBanner` (`src/components/offline-banner.tsx`) hozir faqat dar Direct ast — onro ba root layout guzored. `WidgetBoundary` baroi Stories/Suggestions/PostCard tayyor ast. Bo FE-07/FE-09/FE-18 senariyahoi Playwright-i post/like/follow ba UI guzaronida meshavand.
- 2026-10-21: [Spec 13](specs/13-ilovaho-tz.md) — funksiyahoi P0/P1-i TZ, ki dar Swagger-i "Web Api" nabudand, ilova shudand (57 endpoint-i Spec 12 tagyir nayoftand): Notifications + realtime, Explore, Hashtag, javob ba comment, Direct (Seen, typing, unread, share post), Suggestions. API e2e 24/24, Playwright 8/8.
- 2026-10-21: Rangho: hamai 62 tokeni rangi Spec 10 §1 dar `globals.css` mos (174 sanjish, light + dark); AC2 = 0.
- 2026-10-21: FE-23…FE-25 tayyor va dar brauzer sanjida shud (group chat, dil-i paym, reply, private on/off, close friends, archive, location). `tsc`, `eslint` (0 xato), `next build` — sabz.
- 2026-10-21 (baroi Abubakr): dar `components/layout/bottom-nav.tsx` hydration mismatch: `href="/me"` dar server, `"/avaz"` dar client — linki profil boyad pas az mount ivaz shavad. Linkho ba `/accounts/privacy` (FE-24) ba `more-menu` / `settings-nav` ilova kuned.
- 2026-10-21: [Spec 15](specs/15-funksiyahoi-ilovagi.md) — sanjishi backend bo Instagram: 15 endpoint-i nav (notes, remove follower, favorites + feed, pin-i comment, liked posts, user reels, tahriri paym, "Active now"). Seed: 40 user, 235 post (35 reel), 101 story, 9 note. API e2e 40/40; Direct va `/accounts/favorites|activity` dar brauzer sanjida shudand.
- 2026-10-21 (baroi Abubakr): ranghoi ilovagii instagram.com dar Spec 10 §1.11.1 — ba `globals.css` ilova kuned (FE-29). Pas az `db:seed` user-ho nav meshavand — dar brauzer az nav login kuned.
- 2026-10-22: Deploy ba Render. API: https://istagram-web.onrender.com, Swagger: https://istagram-web.onrender.com/swagger. Baroi kor bo bazai umumi dar `apps/web/.env.local`: `API_URL=https://istagram-web.onrender.com`, `NEXT_PUBLIC_WS_URL=https://istagram-web.onrender.com`, `NEXT_PUBLIC_API_MOCKING=off`. Har `git push` ba `main` → Render xudkor deploy mekunad, maʼlumoti baza nigoh doshta meshavad. Plan-i free: pas az 15 daq. bekori server "xob" meravad (darxosti avval ~50 s); bazai free pas az 30 ruz muhlatash meguzarad.
- 2026-10-22: [Spec 16](specs/16-zang-va-efir.md) — zangi audio / video (WebRTC, server — signaling), paymi ovozi / video bo `Duration`, efiri mustaqim. 12 endpoint-i nav, socket `call:*` va `live:*`. API e2e 48/48. Front: FE-30 (Avaz), FE-31 (Abubakr).
- 2026-10-22: FE-30 tayyor va dar du brauzer (avaz + abubakr) sanjida shud: zangi audio va video (tasvir va ovoz har du taraf, mute, kamera, rad → "Call declined", paymi zang + "Call back"), paymi ovozi va video (MP4, ovoz dar fayl sanjida shud), efir (video + ovoz, comment, dil, anjom). Xatohoi yoftshuda va islohshuda: `myId` pas az zang pok meshud; `scrollIntoView` dar Chrome-i nav Promise bar megardonad (effect-i efir vayron meshud); poygai join dar efir (token + watchdog 8 s); event-hoi socket pesh az auth (server akkun intizor meshavad); paymi ovozii MP4 qismi avvalro gum mekard (bidun timeslice).
- 2026-10-22 (muhim): zang va efir bevosita bayni brauzerho meravand (WebRTC). Dar yak shabaka yo bo aksari internet-ho STUN kifoya ast; agar bayni du shabakai gunogun (masalan, Wi-Fi va internet-i mobil) ovoz / video naoyad — serveri TURN lozim: dar Render ba `Istagram-web` → Environment `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` guzoshta meshavad (masalan, hisobi roygoni Metered yo Cloudflare). OpenRelay-i ozod sanjida shud — kor namekunad.
- 2026-10-22 (baroi hardu): dar rejimi production (`next build` + `next start`) sahifahoi statiki (login va g.) nonce-i CSP nadorand va skriptho bastа meshavand (Next 16: nonce faqat dar rendering-i dinamiki). Hal — dar root layout `await connection()` (fayli umumi, `src/app/layout.tsx`) yo CSP bidun nonce. Dar `pnpm dev` kor mekunad. Hanuz isloh nashudaast.
- 2026-10-22 (baroi Abubakr): hydration mismatch dar `sidebar.tsx` va `bottom-nav.tsx` (`/me` dar server, `/avaz` dar client) hanuz hast.

- 2026-10-22: Stil ba Instagram-i asl bargardonida shud (branch `fix/ig-style`): hamai tokenhoi rangi Spec 10 §1 va §1.11.1 dar `globals.css` (light + dark, `#0C1014`, `#4A5DF9` ...); sidebar va paneli Search/Notifications — hamvor, bidun "glass"; modali post — tugmai X berun az modal (digar bo "..." yakjo nameshavad), sahnai siyoh baroi media, sutuni comment 405/500px, "Follow" dar sarlavha, xati "View replies", `#hashtag` / `@mention` link, "Post" hamesha namoyon (disabled to matn nest), dar mobil satri "< Post"; feed + "Suggested for you" dar markaz (profili xud, "See All", footer); profil 935px. QA mock 26/26, `tsc`, `eslint`, `next build` — sabz.
- 2026-10-22: Direct — paneli "Details" (tugmai (i) va click ba sarlavha): ivazi nomi gruppa, ruyxati a'zoho, "Add people", "Leave chat"; dar 1:1 — "Block", "Delete chat". Tugmai kamera dar composer: aksi fawri (getUserMedia → JPEG) va firistodan. Efirhoi faol (LIVE) dar avvali qatori story dar sahifai asosi (realtime `live:started` / `live:ended`), tugmai "Live" dar Create. Reels: video-hoi seed bo ovoz (commit-i 2145f61 az `avaz`), ovoz baroi hamai reel-ho yakest va bo ovoz sar meshavad. Amniyat: email-i userhoi digar dar API namoyon nest, justujui qismi bo email man' shud, magic bytes baroi video / audio / GIF, `..` dar BFF man', header-hoi amniyat (nosniff, DENY, Referrer-Policy, Permissions-Policy, HSTS). Hydration mismatch dar Direct va badge-ho isloh shud. API e2e 49/49, QA mock 26/26, `tsc`, `eslint`, `next build` — sabz.
- 2026-10-22: Bor kardani reel / video: BFF baroi multipart to 5 daqiqa intizor mekunad (pesh — 60 s, video-i 46 s dar internet-i sust "did not respond within 60 seconds" medod). Reels: agar brauzer ovozi autoplay-ro man' kunad, bo avvalin click / tugma ovoz xudkor boz meshavad. Search: pill-i xokistari bo ikonka va tugmai tozakuni, bidun xati kabud. SEO: title-i har sahifa (`%s • Instagram`, `@user • Instagram photos and videos`), description, Open Graph / Twitter, canonical, theme-color, `robots.txt`, `sitemap.xml`, `manifest.webmanifest` (`NEXT_PUBLIC_SITE_URL`). `npm run dev` — `scripts/dev.mjs`: bidun `npx pnpm` va build-i shared, Ready ~1 s, sahifahoi asosi pesh-az-vaqt kompilyatsiya meshavand (~10 s); usuli kuhna — `npm run dev:pnpm`. QA mock 26/26, `tsc`, `eslint`, `next build` — sabz.
- 2026-10-22: Mobil misli Instagram dar telefon: satri bolo — "Instagram ⌄" (menyui Following / Favorites) va dil bo nuqtai surx; satri poyon — Home, Search (/explore), Reels, Create, Messages (bo badge), Profile; post-i purra-arz bidun border, joy zeri username; story-hoi kalon; tugmai mudavvari Messages dar sahifai asosi. QA mock 26/26, `next build` — sabz.
- 2026-10-22: Navigatsiya misli instagram.com (2025): Home, Reels, Messages, Search, Notifications, Create, Profile dar miyonai sidebar, bidun xati kanor; Search — sahifai Explore bo satri justuju dar bolo va ruyxati natijaho zeri on; tor-i Explore 4 sutun (3:4). Story-hoi kalon (87px), tugmai "Messages" bo avatar-hoi chat-ho. Tugmai kamera (aksi fawri) dar Direct hazf shud. QA mock 26/26, `next build` — sabz.

- 2026-10-22 (Abubakr, yakun): FE-06/10/16/18/26/29/31 va QA-02 tayyor. TAGGED, Highlights (bo story-i guzashta), collections, menyui purrai post, tag-i odamon, viewers/share-i story, menyui profil, Confirm/Delete-i request, LIVE dar profil va notification. Public username check va tahriri username/fullName/website — Spec 14 §9, migratsiya `20261022200000_profile_website`.
- Sanjish: API 59/59, mock UI 26/26, production UI 15/15; TypeScript, ESLint va `next build` sabz. Spec 10: 173 sanjish. Lighthouse: feed 100/100 (LCP 0.183 s, CLS 0.00186), profil 100/100 (LCP 0.382 s, CLS 0.00007). SSR-i profil (self/highlights/grid) sathi layout-ro ustuvor kard; overflow-i 4 tab dar mobil va Escape-i viewer isloh shudand.
- CI: frontend lint/typecheck/build va Playwright bo bazai test, artifact-i trace; `.github/CODEOWNERS`: @Abubakr-63. [Demo](DEMO.md), natijaho va hududhoi QA dar [QA-02](qa/QA-02.md). Push/deploy, relizi `v0.2`, testi WebRTC bayni du shabakai voqe'i va infra-i P1 ba sifat-i ijroshuda qayd nashudand.

- 2026-10-23: yakuni sanjish — avtomati ogozi API + production web az konfiguratsiyai CI, 15/15; regression-i live (feed, create, profil/avatar/follow, story, password change/restore), 5/5. Hamagi 46 browser test va 59 API test. Vazifahoi frontend-i Abubakr monda nestand; holati deploy / reliz va testi shabakahoi voqe'i alohida boqi memonad.

- 2026-10-23 (Avaz): **Forgot password ba Gmail** — `MailService` provayderhoi Gmail (`GMAIL_USER` + `GMAIL_APP_PASSWORD`), SMTP, Brevo (HTTP, baroi Render-i free, ki SMTP-ro mebandad) va Resend-ro ba tartib mesanjad; timeout 10 s, xati HTML, javobi API intizori firistodanro namekashad. Sanjish: `pnpm --filter api mail:test you@gmail.com`. Qadam ba qadam: [EMAIL.md](EMAIL.md). Dar brauzer (API va bazai lokali) sanjida shud: kod → paroli nav → login bo paroli nav 200, bo kuhna 401. **Monda:** App Password-i Gmail ba `apps/api/.env` (lokali) yo `BREVO_API_KEY` + `MAIL_FROM` ba Render — bidun onho kod faqat dar log-i API ast.
- 2026-10-23 (Avaz): **Instants real-time** — pas az `add-instant` server ba girandagon (mutual, close friends, bidun block) `instant:new` mefiristad; dar har sahifa toast "<user> sent you an Instant" → View, va inbox-i Instants foran nav meshavad. Dar brauzer sanjida shud.
- 2026-10-23 (Avaz): **TanStack Query** — Devtools (faqat `next dev`, tugma dar kunji chap-i poyon), `gcTime` 5 daq., refetch dar focus / reconnect, mutation-ho xudkor takror nameshavand.
- Sanjish: API e2e 66/66 (test-i navi Spec 17 AC6), `tsc` (api + web), `eslint` — sabz.
- 2026-10-23 (Avaz, qismi 2): **Share ba chand nafar** — dialogi Share (post, reel, story) misli Instagram: tor-i avatar-ho, nishoni kabud (`--ig-primary` #4A5DF9), "Write a message...", "Send" / "Send separately", "Copy link"; har giranda alohida, agar yake naravad — faqat on intixobshuda memonad. Dar brauzer: reel ba 3 nafar → "Sent to 3 people", 3 chat.
- **Instants ba hamai followerho** (pesh — faqat mutual): inbox va `instant:new` ba har follower-i muallif (close friends va block — misli pesh). Instants dar **Direct (Messages) → tugmai rost-i poyon (barq)**: agar instant-i nav boshad — tudai aksho bo shumora.
- **TanStack Query dar justuju**: hamai justujuhoi odamon (Search, Share, New message, gruppa, tag, Close friends / Favorites) — yak hook `useUserSearch` / `usePeopleSearch` bo kesh-i umumi (1 daq.) va `keepPreviousData`; `fetch`-i dasti hazf shud. Tugmai Devtools hazf shud.
- **Tarjima**: English / Русский / Tojiki — More → Language va Settings → Language (zeri "Switch appearance"), footer-i sahifahoi vorid. Faqat DOM-i hydrate-shuda tarjima meshavad (xatoi hydration nest); matni korbar tarjima nameshavad.
- Isloh: xatoi hydration dar `/accounts/edit` (skeleton to hydration).
- 2026-10-23 (Avaz, qismi 3): **502 dar localhost:3000** — API-i Render dar vaqti bedorshavi / deploy (pas az merge-i PR) pevastagiro mebast. BFF akkun darxosthoi GET-ro hangomi xatoi shabaka yo 502/503/504 xudkor 2 bori digar takror mekunad (1 s, 3 s); POST/PUT takror nameshavand.
- **Reels:** bor kardan lokali sanjida shud (MP4 0.5 MB va 38 MB tavassuti BFF — 200). Mahdudiyat: aks to **10 MB**, video to **100 MB**; reel va video-i post to **3 daqiqa** (pesh 90 s), story to 60 s. Fayli bidun tip (Windows/Android) az pasvand shinoxta meshavad (.mp4, .m4v, .mov, .webm); .mov-i iPhone (HEVC), ki Chrome kushoda nametavonad, digar man' nameshavad. Mahdudiyat dar ekrani Create navishta shud.
- **See translation** (misli Instagram): zeri har caption (feed, post, reels) va har comment alohida — tarjima ba zaboni UI (English / Русский / Tojiki) tavassuti `/api/translate` (Google Translate, zaxira — MyMemory; kesh dar server; Tojiki ba lotini). Tarjimai UI: matnhoi nav va vaqt ("5m" → "5 мин."); qismhoi der hydrate-shuda ham tarjima meshavand.
- 2026-10-23 (Avaz): **Flash dar kamerai Instants** — tugmai ⚡ dar kunji rost-i bolo (peshfarz fa'ol, intixob nigoh doshta meshavad). Dar kompyuter: pesh az aks tamomi ekran 0.45 s safed meshavad (front flash) va aks kami ravshantar korkard meshavad; dar telefon bo kamerai poyon chirog (torch) ham fa'ol meshavad. Dar brauzer sanjida shud (bo flash va bidun on, `add-instant` 200).
- 2026-10-23 (Avaz): **Flash-i voqei dar Instants** (`features/instants/enhance.ts`): (1) kamera muvaqqatan ba exposure / brightness-i baland va torch guzaronida meshavad (agar webcam dastgiri kunad); (2) aksi girifta tahlil meshavad — auto-levels (1–99.5%) va gamma, to ravshanii miyona ~58%; (3) preview bo flash ravshantar. Sanjish: aksi torik 11% → 47%, miyona 33% → 54%, ravshan 71% → 80% (nemesuzad). Ekrani safed faqat ilovagi ast.
- 2026-10-23 (Avaz): **502 hangomi bor kardani story / video** — sabab: Render (free, 512 MB) API-ro az xotira mekusht ("exceeded its memory limit"), chunki har video dar RAM chand bor nusxa meshud (buffer + `new Uint8Array` + Prisma baroi nusxai DB). Isloh: nusxai zoid hazf; fayli > 20 MB ba DB nusxa nameshavad (faqat disk — pas az restart-i Render metavonad gum shavad); sharp bidun kesh, Node heap 320 MB. Dar UI ba joi "HTTP 502" — "The server is restarting. Try again in a moment."
- 2026-10-23 (Avaz): **Story-i xud** — dar doirai "Your story" bo halqa (misli Instagram), na alohida dar ruyxat; click ba doira → didani story, "+" → story-i nav. **Flash-i qavitar:** ravshanii maqsad 62%, S-curve-i kontrast, rang +12%, sharpen — aksi torik 11% → 52%, kontrast 12 → 65 (toza, na xira); preview bo flash ham ravshantar.
- 2026-10-23 (Avaz): **Flash — "night mode"** (aksho nuqtador va binafsh budand): sharpen va rangi zoid shovqini webcam-ro zurtar mekardand. Akkun: 12 kadr pay dar pay → miyona (shovqini temporal ~3.5× kam), white balance-i avtomati (gray world), denoise-i rang (7×7) va ravshani (Y), levels bo gain-i maks. ~2.3× va gamma-i narm bo "shoulder" (safed nemesuzad); kamera 1280px. Simulyatsiyai sahnai torik bo rangi binafsh: ravshani 19% → 43%, shovqin 5.7 (xom) / 12.6 (korkardi kuhna) → **3.7**, R/G/B barobar.
- 2026-10-23 (Avaz): **Flash — aks "xira" nest:** black point az 2%-i torik (siyoh — siyoh), ekspozitsiya az ruyi markaz (ruy), kontrast-i S-curve (0.3), clarity (kontrasti mahalli, radius 12), white balance faqat az pikselhoi miyona (markaz 2×), saturation 0.95. Simulyatsiya (devori binafsh, ruy-i torik): ruy 60 → 92, kontrast 51 → 60, siyoh 2 → 0, shovqin 3.2.
