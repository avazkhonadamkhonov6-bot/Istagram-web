# Spec 10 — Frontend: dizayn, rangho, sahifaho

**Ma'sul:** A + B · **Ruz:** 3–4 · **Prioritet:** P0

> Pesh az kod: `node_modules/next/dist/docs/` (Next.js 16) — xususan `16-proxy.md`, `03-layouts-and-pages.md`, `12-images.md`.

## 1. Rangho (design tokens)

Dar `apps/web/src/app/globals.css` hamchun CSS-variable va dar Tailwind 4 tavassuti `@theme`. **Dar kod ranghoi "hardcode" (`#0095F6`) navised — faqat tokenho.**

| Token | Light | Dark | Kujo |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#000000` | fon-i asosi |
| `--bg-secondary` | `#FAFAFA` | `#121212` | fon-i sahifai login, hover |
| `--bg-elevated` | `#FFFFFF` | `#262626` | modal, dropdown |
| `--text` | `#000000` | `#F5F5F5` | matni asosi |
| `--text-secondary` | `#737373` | `#A8A8A8` | vaqt, "View all comments" |
| `--separator` | `#DBDBDB` | `#262626` | xatho, border |
| `--primary` | `#0095F6` | `#0095F6` | tugmai Follow / Log in / Share |
| `--primary-hover` | `#1877F2` | `#1877F2` | |
| `--primary-disabled` | `#4CB5F9` | `#4CB5F9` (opacity .7) | tugma to validatsiya |
| `--btn-secondary` | `#EFEFEF` | `#363636` | Following, Edit profile, Message |
| `--btn-secondary-hover` | `#DBDBDB` | `#262626` | |
| `--link` | `#00376B` | `#E0F1FF` | link dar bio |
| `--like` | `#FF3040` | `#FF3040` | dili surkh |
| `--error` | `#ED4956` | `#ED4956` | xatoi forma |
| `--success` | `#58C322` | `#58C322` | ✓ username-i ozod |
| `--badge` | `#FF3040` | `#FF3040` | nuqtai notification |
| `--bubble-me` | `#3797F0` | `#3797F0` | paymi xud (Direct) |
| `--bubble-other` | `#EFEFEF` | `#262626` | paymi digaron |
| `--verified` | `#0095F6` | `#0095F6` | nishoni tasdiq |

**Gradienti Instagram** (halqai story, logotip, tugmahoi maxsus):
```css
--ig-gradient: linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%);
```
Halqai story-i didashuda: `--separator`.

## 2. Typography
- Shrift: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Andoza-i asosi: **14px / 18px**. Username — `font-semibold` (600). Vaqt — 12px `--text-secondary`.
- Profile: username 20px; counter-ho 16px (raqam semibold).
- Logotip — matni "Instagram" bo shrifti script (Google Font **"Grand Hotel"**), 28–32px.

## 3. Layout (responsive)

| Breakpoint | Navigatsiya | Mazmun |
|---|---|---|
| ≥ 1264px | Sidebar-i chap **245px** (ikonka + matn + logotip) | Feed 470px + sutuni rost "Suggested" 319px (≥1160px) |
| 768–1263px | Sidebar **72px** (faqat ikonka) | Feed markaz |
| < 768px | Top bar (logo, ❤) 60px + bottom nav **50px** (Home, Explore, Reels, Create, Profile) | Feed 100% kenglik |

**Sidebar (tartib):** Home · Search · Explore · Reels · Messages · Notifications · Create · Profile · (poyon) More.
Search va Notifications — **panel-i lagzanda 397px** (sidebar ba 72px meravad), misli Instagram.
Ikonkaho: `lucide-react` (stroke 2, 24px); fa'ol — `fill` / stroke-i gafs. Ikonkai fa'ol + matni semibold.

## 4. Sahifaho (routes)

| Route | Sahifa | Tafsilot |
|---|---|---|
| `/login` | Login | Chap — aksi telefon (desktop), rost — kartai 350px: logo, username, parol, "Log in", link ba signup |
| `/signup` | Ruyxatgiri | username (✓/✗ realtime, Spec 01), Full name, parol |
| `/` | Feed | Stories tray (avatar 56px, halqa 66px), postho, "Suggested for you" |
| `/explore` | Explore | Grid 3 sutun, gap 4px, har 5-um — kalon (2×2) reel |
| `/explore/tags/[tag]` | Hashtag | sarlavha + grid |
| `/reels` | Reels | Spec 07 |
| `/direct/inbox`, `/direct/t/[id]` | Direct | Spec 08 |
| `/p/[id]` | Post | Desktop: modal (intercepting route `@modal/(.)p/[id]`) — chap media, rost comment-ho (335px); kushodani mustaqim — sahifai purra |
| `/stories/[username]` | Story viewer | Fon-i siyoh `#1A1A1A`, story 9:16 dar markaz |
| `/[username]` | Profil | Avatar 150px, username + tugmaho, counter-ho, bio; tab-ho POSTS · REELS · SAVED (faqat xud) · TAGGED (P2); grid 3 sutun, nisbat **3:4** |
| `/[username]/reels`, `/[username]/saved` | Tab-hoi profil | |
| `/[username]/followers`, `/following` | Modal | ruyxat bo search va tugmai Follow/Remove |
| `/accounts/edit` | Tahriri profil | avatar, username, name, website, bio (0/150) |
| `/accounts/password` | Ivazi parol | |

**Create (modal):** 1) intixobi fayl (drag & drop, "Select from computer") → 2) crop (1:1, 4:5, 16:9, original) + carousel → 3) caption (0/2200), location → "Share". Upload: Spec 03.

## 5. Komponentho (asosi)

- `PostCard` — header (avatar 32px, username • vaqt, ⋯), media (carousel bo nuqtaho, double-tap ❤ animatsiya), amalho (❤ 💬 ✈ … 🔖), "1,234 likes", caption ("... more"), "View all 45 comments", "Add a comment…" + Post.
- `StoryRing`, `Avatar` (andozaho: 24/32/44/56/77/150).
- `FollowButton` (Follow — kabud / Following — xokistari / Follow back).
- `Modal` (fon `rgba(0,0,0,.65)`, radius 12px), `Dropdown`, `Toast`, `Skeleton` (shimmer hangomi bor shudan).
- `InfiniteList` — `useInfiniteQuery` + `IntersectionObserver`.
- `MediaGrid`, `ReelPlayer`, `StoryViewer`, `ChatWindow`, `NotificationItem`.

## 6. Strukturai `apps/web`

```
src/
├─ app/
│  ├─ (auth)/login, (auth)/signup
│  ├─ (main)/layout.tsx          sidebar + panel-ho
│  ├─ (main)/page.tsx            feed
│  ├─ (main)/explore, reels, direct, accounts, [username], p/[id]
│  ├─ (main)/@modal/(.)p/[id]    modali post
│  └─ stories/[username]
│  └─ api/
│     ├─ auth/{login,register,logout}/route.ts   tokenho → httpOnly cookie
│     ├─ realtime/ticket/route.ts                WS ticket-i 60 s
│     └─ [...path]/route.ts                      BFF-proxy ba NestJS (+ refresh-i avtomati)
├─ components/ui/                shadcn/ui (Button, Input, Dialog, DropdownMenu, Sheet, Skeleton, Sonner) — bo tokenhoi Instagram
├─ features/                     auth, posts, feed, stories, reels, direct, notifications, profile
│   └─ <feature>/{api.ts, hooks.ts, components/}
├─ lib/
│  ├─ bff.ts                     funksiyai server: fetch ba NestJS bo cookie, timeout 10 s, x-request-id
│  ├─ api-client.ts              fetch-i brauzer ba `/api/*` + tekshirishi javob bo Zod (`@repo/shared`)
│  ├─ server-api.ts              baroi Server Components (SSR)
│  ├─ socket.ts, query-client.ts, format.ts (2h, 3d, 1w)
├─ store/ ui.store.ts (Zustand — faqat holati UI: panel-i kushoda, theme)
└─ proxy.ts                      agar cookie `refresh_token` nest → /login (Next 16: proxy, ne middleware)
```

## 7. Holat va data
- Brauzer **faqat** ba `/api/*`-i xudi Next murojiat mekunad (BFF, TZ §5.3). Tokenho dar JS nestand.
- SSR: `/[username]`, `/p/[id]` — Server Component ma'lumotro dar server megirad (tez + SEO), ba'd TanStack Query bo `initialData` / `HydrationBoundary`.
- Server state — **TanStack Query** (`queryKey`: `['feed']`, `['post', id]`, `['user', username]`...), `retry: 2`, `staleTime: 30s`.
- Optimistic update baroi like, save, follow, comment, message — **hamesha bo rollback** dar `onError` + toast.
- Socket event-ho kesh-ro navsozi mekunand (`queryClient.setQueryData`); pas az reconnect — `invalidateQueries`.
- Javobhoi API bo **Zod** tekshirida meshavand (dar dev — xatoi baland, dar prod — Sentry + fallback UI).

## 7.1 Sur'at va bovarinoki dar front
- `next/image` baroi hamai aksho (AVIF/WebP, `sizes`, `priority` faqat posti avval), domain-i CDN dar `next.config`.
- Feed va Explore — **virtualizatsiya** (`@tanstack/react-virtual`), video-ho faqat dar ekran `play()`.
- Modalho, Story viewer, Create, emoji — `dynamic()` (code splitting).
- `error.tsx` dar har segment + Error Boundary baroi har widget (Stories, Suggestions, PostCard) — xatoi yak qism tamomi sahifaro nameshikanad.
- `loading.tsx` + Skeleton; hech jo ekrani safedi xoli.
- Holati offline: banner "No internet connection", amalho baroi takror memonand.
- CSP bo nonce dar `proxy.ts`; `dangerouslySetInnerHTML` — mamnu' (ESLint).

## 8. UX-i Instagram (bo diqqat)
- Vaqt: `2m`, `3h`, `5d`, `2w`, pas az 7 hafta — sana ("October 20").
- Raqamho: `1,234`, `12.5K`, `1.2M`.
- Tugmai "Log in" / "Share" / "Post" to forma durust nest — `--primary-disabled`.
- Caption: `#hashtag` va `@username` — link (`--link`).
- Skeleton dar hama jo, spinner-i Instagram (12 xati xokistari) hangomi infinite scroll.

## AC
- [ ] AC1: Dar 1440px, 1000px va 390px layout misli Instagram ast (sidebar 245 / 72 / bottom nav).
- [ ] AC2: Dar kod rangi hardcode nest (grep `#[0-9A-F]{6}` dar `components/` → 0).
- [ ] AC3: Dark mode bo `prefers-color-scheme` va toggle dar "More".
- [ ] AC4: Lighthouse accessibility ≥ 90 (alt baroi aksho, label baroi input-ho).
- [ ] AC5: Lighthouse performance ≥ 85, LCP < 2.5 s, CLS < 0.1 dar `/` va `/[username]`.
- [ ] AC6: API-ro qat' kuned → sahifa nameshikanad, xatoi fahmo + tugmai "Try again".
- [ ] AC7: Like bo internet-i qat' → rollback + toast.
- [ ] AC8: Feed-i 200 post — scroll ravon (DOM ≤ ~15 PostCard).
