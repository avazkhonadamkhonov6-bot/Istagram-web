# Spec 10 — Frontend: dizayn, rangho, sahifaho

**Ma'sul:** Abubakr — asosi (Ruzi 1–4) · Avaz — BFF, socket, Direct, bovarinoki (Ruzi 3–4) · **Prioritet:** P0

> Pesh az kod: `node_modules/next/dist/docs/` (Next.js 16) — xususan `16-proxy.md`, `03-layouts-and-pages.md`, `12-images.md`.

## 1. Rangho (design tokens) — ranghoi asli Instagram

> **Manba':** CSS-i voqe'ii `instagram.com`, giriftashuda **2026-10-20** az variable-hoi `:root, .__ig-light-mode` va `.__ig-dark-mode`. Hamai rangho **aynan** az Instagram hastand — hech rang taxmini nest.
> **Nomi tokenho — hamon nomhoi Instagram** (`--ig-*`), ki muqoisa va tekshirish oson boshad.
> Diqqat: Instagram rangi tugmai asosiro az kabudi kuhna `#0095F6` ba **`#4A5DF9`** ivaz kardaast. Mo rangi **nav**-ro istifoda mebarem.

### Qoidaho
1. Hamai tokenho dar `apps/web/src/app/globals.css`: light dar `:root`, dark dar `.dark` (+ `prefers-color-scheme: dark`), dar Tailwind 4 tavassuti `@theme inline`.
2. Instagram rangro hamchun `R, G, B` nigoh medorad va `rgb(var(--ig-primary-text))` istifoda mebarad. Mo ham **hamin xel** menavisem, ki shaffofi (`rgba(var(--ig-primary-text), .5)`) oson boshad.
3. **Dar komponentho rangi hardcode (`#...`, `rgb(...)`) mamnu' ast** — faqat tokenho (AC2).
4. Agar rangi nav lozim shavad: avval dar CSS-i instagram.com justuju kuned, ba'd ba in jadval ilova kuned. Rangi xudsoxta ilova nakuned.

### 1.1 Fon (background)
| Token | Light | Dark | Kujo |
|---|---|---|---|
| `--ig-primary-background` | `#FFFFFF` | `#0C1014` | fon-i asosii sahifa |
| `--ig-secondary-background` | `#F3F5F7` | `#25292E` | fon-i duyum, sahifai login |
| `--ig-highlight-background` | `#F3F5F7` | `#25292E` | hover-i qatorho (sidebar, ruyxatho) |
| `--ig-elevated-background` | `#FFFFFF` | `#212328` | modal, popover |
| `--ig-elevated-highlight-background` | `#EFEFEF` | `#363636` | hover dar modal |
| `--ig-banner-background` | `#FFFFFF` | `#262626` | banner-ho |
| `--ig-dropdown-background` | `#F3F5F7` | `#25292E` | dropdown |
| `--ig-menu-background-color` | `#F8F9F9` | `#262B31` | menyui "More" |
| `--ig-hover-overlay` | `rgba(12,16,20,.05)` | `rgba(255,255,255,.1)` | qabati hover bolo-i element |
| `--ig-temporary-highlight` | `#F5FBFF` | `#0095F6` | rushnoii muvaqqati (comment-i nav) |

### 1.2 Matn va ikonka
| Token | Light | Dark | Kujo |
|---|---|---|---|
| `--ig-primary-text` | `#0C1014` | `#F8F9F9` | matni asosi, username |
| `--ig-secondary-text` | `#6A717A` | `#A2AAB4` | vaqt, "View all comments" |
| `--ig-tertiary-text` | `#C7C7C7` | `#737373` | matni sust |
| `--ig-primary-icon` | `#0C1014` | `#F8F9F9` | ikonkahoi asosi |
| `--ig-secondary-icon` | `#8E8E8E` | `#8E8E8E` | ikonkahoi duyum |
| `--ig-tertiary-icon` | `#C7C7C7` | `#737373` | ikonkahoi gayrifa'ol |
| `--ig-link` | `#00376B` | `#E0F1FF` | link dar bio, `#hashtag`, `@mention` |
| `--ig-colors-link-text` | `#4150F7` | `#708DFF` | link-i amal ("Forgot password?", "Sign up") |
| `--ig-text-on-color` | `#FFFFFF` | `#FFFFFF` | matn bolo-i tugmai rangin |
| `--ig-text-on-media` | `#FFFFFF` | `#FFFFFF` | matn bolo-i aks/video (Reels, Stories) |

### 1.3 Xatho va border
| Token | Light | Dark | Kujo |
|---|---|---|---|
| `--ig-separator` | `#DBDFE4` | `#2B3036` | xati judokunanda |
| `--ig-elevated-separator` | `#DBDFE4` | `#2B3036` | xat dar modal |
| `--ig-stroke` | `#DBDBDB` | `#363636` | border-i kartaho, halqai story-i didashuda |
| `--ig-focus-stroke` | `#A8A8A8` | `#555555` | border-i focus |
| `--ig-tablist-border` | `#DBDFE4` | `#2B3036` | xati tab-hoi profil |
| `--ig-tab-underline-active` | `#0C1014` | `#F8F9F9` | tab-i fa'ol |
| `--ig-stroke-on-media` | `#FFFFFF` | `#FFFFFF` | border bolo-i media |

### 1.4 Tugmaho
| Token | Light | Dark | Kujo |
|---|---|---|---|
| `--ig-primary-button` | `#4A5DF9` | `#4A5DF9` | **Log in, Follow, Share, Send** |
| `--ig-primary-button-hover` | `#4150F7` | `#4150F7` | hover |
| `--ig-colors-button-primary-background--pressed` | `#4150F7` | `#4150F7` | pahsh |
| `--ig-colors-button-primary-background--disabled` | `#B8CDFF` | `#18208B` | to forma durust nest |
| `--ig-colors-button-primary-text` | `#FFFFFF` | `#FFFFFF` | matn |
| `--ig-colors-button-secondary-background` | `#F0F2F5` | `#25292E` | **Following, Edit profile, Message** |
| `--ig-colors-button-secondary-background--hover` | `#E7EAEE` | `#363C44` | hover |
| `--ig-colors-button-secondary-background--disabled` | `#DCE0E5` | `#2B3036` | disabled |
| `--ig-colors-button-secondary-text` | `#0C1014` | `#FFFFFF` | matn |
| `--ig-colors-button-secondary-text--disabled` | `#5E646D` | `#A2AAB4` | matni disabled |
| `--ig-colors-button-borderless-text` | `#4150F7` | `#708DFF` | tugmai bidun fon ("Follow" dar sarlavhai post, "Post" dar comment) |
| `--ig-colors-button-borderless-text--hover` | `#2536D0` | `#85A1FF` | hover |
| `--ig-colors-button-borderless-text--pressed` | `#1F28AD` | `#A3BCFF` | pahsh |
| `--ig-colors-button-borderless-text--disabled` | `#B8CDFF` | `#18208B` | disabled ("Post" to matn nest) |
| `--ig-colors-button-primary-link-text` | `#3143E3` | `#85A1FF` | link-i asosi |
| `--ig-tertiary-button-background` | `#FFFFFF` | `#FFFFFF` | tugmai sevum |
| `--ig-tertiary-button-border` | `#DBDBDB` | `#DBDBDB` | border-i on |
| `--ig-tertiary-button-hover` | `#F5F5F5` | `#F5F5F5` | hover |
| `--ig-tertiary-button-text` | `#262626` | `#262626` | matn |

### 1.5 Input (formaho)
| Token | Light | Dark |
|---|---|---|
| `--ig-input-border-primary` (focus) | `#212328` | `#F8F9F9` |
| `--ig-input-border-secondary` (oddi) | `#DBDFE4` | `#5E646D` |
| `--ig-input-disabled-background-color` | `#F3F5F7` | `#25292E` |
| `--ig-input-text-and-icon-primary` | `#0C1014` | `#F8F9F9` |
| `--ig-input-text-and-icon-secondary` (placeholder) | `#6A717A` | `#A2AAB4` |
| `--ig-input-border-radius` | `12px` | `12px` |
| `--ig-input-border-width` | `1px` | `1px` |
| `--ig-text-input-padding-vertical` | `20px` | `20px` |

### 1.6 Holat va nishonho
| Token | Rang (light = dark) | Kujo |
|---|---|---|
| `--ig-badge` | `#FF3040` | nuqtai notification, **dili like-i surkh** |
| `--ig-error-or-destructive` | `#ED4956` | xatoi forma, "Delete", "Unfollow" dar menyu |
| `--ig-success` | `#58C322` | username-i ozod |
| `--ig-live-badge` | `#FF0169` | nishoni LIVE |
| `--ig-close-friends-refreshed` | `#1CD14F` | halqai "Close friends" |
| `--ig-subscribers-only` | `#7638FA` | kontenti subscriber-ho |

### 1.7 Direct (paymho)
| Token | Light | Dark |
|---|---|---|
| `--ig-outgoing-message-bubble` (paymi xud) | `#4A5DF9` | `#4A5DF9` |
| `--ig-incoming-message-bubble` (paymi digaron) | `#F3F5F7` | `#25292E` |

### 1.8 Toggle (switch)
| Token | Light | Dark |
|---|---|---|
| `--ig-toggle-background-on-prism` | `#0C1014` | `#F8F9F9` |
| `--ig-toggle-background-off-prism` | `#6A717A` | `#A2AAB4` |
| `--ig-toggle-background-disabled-on-prism` | `#838993` | `#838993` |

### 1.9 Soya, blur, toast
| Token | Qimat |
|---|---|
| `--ig-strong-shadow` | `0 4px 32px 0 rgba(11,16,20,.16)` (modal, dropdown) |
| `--ig-toast-prism-background-color` | `rgba(37,41,46,.95)` (toast) |
| `--ig-background-always-dark-blur` | `rgba(43,48,54,.5)` (blur bolo-i media) |
| Fon-i modal (overlay) | `rgba(0,0,0,.65)` |

### 1.10 Gradienti brendi Instagram (halqai story, logotip, Create)
Ranghoi decorative az CSS-i Instagram: `--decorative-ig-yellow #FFD600`, `--decorative-ig-orange #FF7A00`, `--decorative-ig-lavender #D300C5`, `--decorative-ig-purple #7638FA`, va rangi pushti-i brend `#FF0069` (dar CSS hamchun `--ig-live-badge`, `#FF0169`).

```
--ig-brand-gradient: linear-gradient(45deg, #FFD600 0%, #FF7A00 25%, #FF0069 50%, #D300C5 75%, #7638FA 100%);
```
- Halqai story-i **nadida**: `--ig-brand-gradient`, gafsi 2px, faosila 2px (`--ig-primary-background`).
- Halqai story-i **didashuda**: `--ig-stroke`, gafsi 1px.
- Halqai "Close friends": `--ig-close-friends-refreshed`.

> Halqai story dar instagram.com bo `<canvas>` kashida meshavad, baroi hamin dar CSS gradienti tayyor nest. Gradient az hamin ranghoi decorative-i brend sohta meshavad.

### 1.11 Animatsiya (az CSS-i Instagram)
| Token | Qimat |
|---|---|
| `--ig-animation-move-in` / `--ig-animation-move-out` | `cubic-bezier(0.17, 0.17, 0, 1)` |
| `--fds-animation-fade-in` | `cubic-bezier(0, 0, 1, 1)` |
| `--fds-animation-enter-exit-in` | `cubic-bezier(0.14, 1, 0.34, 1)` |
| `--fds-animation-enter-exit-out` | `cubic-bezier(0.45, 0.1, 0.2, 1)` |
| `--ig-duration-extra-extra-short-in` | `100ms` |
| `--fds-duration-extra-short-in` / `-out` | `200ms` / `150ms` |
| `--fds-duration-short-in` / `-out` | `280ms` / `200ms` |
| `--fds-duration-medium-in` / `-out` | `400ms` / `350ms` |

### 1.11.1 Tokenhoi ilovagi (az CSS-i instagram.com, sanjida 2026-10-21)
> Baroi "100% ranghoi Instagram": in tokenho dar `globals.css` hanuz nestand — **Abubakr** (FE-29) ilova mekunad (`:root` va `.dark`, bo hamin nom va qimat).

| Token | Light | Dark |
|---|---|---|
| `--ig-toggle-background-disabled-off-prism` | `#838993` | `#838993` |
| `--ig-toggle-outline-prism` | `#6A717A` | `#A2AAB4` |
| `--ig-toggle-outline-disabled-prism` | `#DBDFE4` | `#2B3036` |
| `--ig-stroke-prism` | `#FFFFFF` | `#0C1014` |
| `--ig-stroke-disabled-on-prism` / `-off-prism` | `#DCE0E5` | `#363C44` |
| `--ig-facebook-blue` | `#3579EA` | `#3579EA` |
| `--ig-secondary-button` | `#262626` | `#F5F5F5` |
| `--ig-secondary-button-background` | `#EFEFEF` | `rgba(85,85,85,.7)` |
| `--ig-secondary-button-hover` | `#DBDBDB` | `#363636` |
| `--ig-colors-button-primary-background` | `#4A5DF9` | `#4A5DF9` |
| `--ig-colors-button-primary-background--hover` | `#4150F7` | `#4150F7` |
| `--ig-colors-button-primary-link-text--disabled` | `#A3BCFF` | `#1F28AD` |
| `--ig-colors-button-primary-link-text--hover` | `#2536D0` | `#A3BCFF` |
| `--ig-colors-button-primary-link-text--pressed` | `#1F28AD` | `#B8CDFF` |
| `--ig-colors-button-secondary-background--pressed` | `#E7EAEE` | `#363C44` |
| `--ig-colors-button-secondary-link-text` | `#0C1014` | `#FFFFFF` |
| `--ig-colors-button-secondary-link-text--disabled` | `#5E646D` | `#A2AAB4` |
| `--ig-colors-button-borderless-background--disabled` | `#DCE0E5` | `#DCE0E5` |
| `--ig-menu-text-color` | `#0C1014` | `#F8F9F9` |
| `--ig-duration-extra-extra-short-out` | `100ms` | `100ms` |

### 1.12 Kadom element — kadom token
| Element | Token |
|---|---|
| Fon-i sahifa | `--ig-primary-background` |
| Sidebar: hover-i qator | `--ig-hover-overlay` |
| Username, caption | `--ig-primary-text` |
| Vaqt ("2h"), "View all 45 comments" | `--ig-secondary-text` |
| Dili like-shuda | `--ig-badge` |
| Dili like-nashuda, ikonkahoi post | `--ig-primary-icon` |
| Tugmai "Follow" (kalon) | `--ig-primary-button` + `--ig-colors-button-primary-text` |
| "Follow" dar sarlavhai post / "Post" dar comment | `--ig-colors-button-borderless-text` |
| "Following", "Edit profile", "Message" | `--ig-colors-button-secondary-background` + `-text` |
| Border-i PostCard (desktop) | `--ig-separator` |
| Modal | `--ig-elevated-background` + `--ig-strong-shadow` |
| Input | `--ig-input-*` |
| Paymi xud / digaron | `--ig-outgoing-message-bubble` / `--ig-incoming-message-bubble` |
| Nishoni tasdiq (verified) | `--ig-primary-button` |
| "Unfollow", "Delete", "Report" | `--ig-error-or-destructive` |
| "Active now" (nuqta dar avatar-i Direct) | `--ig-success` |
| Dil dar paym va comment | `--ig-badge` |

## 2. Typography (az CSS-i Instagram)
- Shrifti Instagram — `"Instagram Sans"`: **shrifti xususii Meta, litsenziyai ozod nadorad** — istifoda namebarem. Mo hamon fallback-ro istifoda mebarem ki xudi Instagram dar CSS dorad:
  `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` (dar Windows = Segoe UI, aynan misli instagram.com dar Windows).
- Andozai asosi: **14px / 18px** (az `body`-i instagram.com). Username — 600. Vaqt — 12px `--ig-secondary-text`.
- Profil: username 20px; counter-ho 16px (raqam 600).
- Logotip — matni "Instagram" bo shrifti script (Google Font **"Grand Hotel"**), 28–32px (logotipi asl — tamgai Meta).

## 3. Layout (responsive)

| Breakpoint | Navigatsiya | Mazmun |
|---|---|---|
| ≥ 1264px | Sidebar-i chap **245px** (ikonka + matn + logotip) | Feed 470px + sutuni rost "Suggested" 319px (≥1160px) |
| 768–1263px | Sidebar **72px** (faqat ikonka) | Feed markaz |
| < 768px | Top bar (logo, notifications) 60px + bottom nav **50px** (Home, Explore, Reels, Create, Profile) | Feed 100% kenglik |

**Sidebar (tartib):** Home · Search · Explore · Reels · Messages · Notifications · Create · Profile · (poyon) More.
Search va Notifications — **panel-i lagzanda 397px** (sidebar ba 72px meravad), misli Instagram.
Ikonkaho: faqat SVG — `lucide-react` (stroke 2, 24px), **emoji istifoda nabared** (na dar UI, na dar matnho); fa'ol — `fill` / stroke-i gafs. Ikonkai fa'ol + matni semibold.

## 4. Sahifaho (routes)

| Route | Sahifa | Tafsilot |
|---|---|---|
| `/login` | Login | Chap — aksi telefon (desktop), rost — kartai 350px: logo, username, parol, "Log in", link ba signup |
| `/signup` | Ruyxatgiri | username (ozod/band realtime, Spec 01), Full name, parol |
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

- `PostCard` — header (avatar 32px, username • vaqt, ⋯), media (carousel bo nuqtaho, double-tap like animatsiya), amalho (like, comment, share, save), "1,234 likes", caption ("... more"), "View all 45 comments", "Add a comment…" + Post.
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
- Tugmai "Log in" / "Share" / "Post" to forma durust nest — `--ig-colors-button-primary-background--disabled`.
- Caption: `#hashtag` va `@username` — link (`--link`).
- Skeleton dar hama jo, spinner-i Instagram (12 xati xokistari) hangomi infinite scroll.

## AC
- [ ] AC1: Dar 1440px, 1000px va 390px layout misli Instagram ast (sidebar 245 / 72 / bottom nav).
- [ ] AC2: Dar kod rangi hardcode nest: grep `#[0-9A-Fa-f]{3,8}\b|rgb\(` dar `src/components` va `src/features` → 0 (rangho faqat dar `globals.css`).
- [ ] AC3: Dark mode bo `prefers-color-scheme` va toggle dar "More".
- [ ] AC4: Lighthouse accessibility ≥ 90 (alt baroi aksho, label baroi input-ho).
- [ ] AC5: Lighthouse performance ≥ 85, LCP < 2.5 s, CLS < 0.1 dar `/` va `/[username]`.
- [ ] AC6: API-ro qat' kuned → sahifa nameshikanad, xatoi fahmo + tugmai "Try again".
- [ ] AC7: Like bo internet-i qat' → rollback + toast.
- [ ] AC8: Feed-i 200 post — scroll ravon (DOM ≤ ~15 PostCard).
- [ ] AC9: Ranghoi asl: har token-i §1 dar `globals.css` bo hamon qimat. Tekshirish: dar instagram.com (light va dark) va dar loyiha dar DevTools `getComputedStyle(document.documentElement).getPropertyValue("--ig-primary-button")` va tokenhoi digar — natija yaksa.
- [ ] AC10: Muqoisai vizuali: screenshot-i sahifahoi login, feed, profil, post, direct dar instagram.com va dar loyiha kanori ham — rangho farq nadorand.
