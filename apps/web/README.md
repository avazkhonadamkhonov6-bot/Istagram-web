# apps/web — Next.js 16

**Ma'sul:** Abubakr (hama, gayr az `src/app/api/`) · Avaz (`src/app/api/` — BFF, az Ruzi 3) · **Port:** 3000

> Next.js 16 tagyirothoi kalon dorad. Pesh az kod: `node_modules/next/dist/docs/` (FE-01). Fayli `AGENTS.md` dar hamin papka.

## Struktura

```
apps/web/
├─ public/
├─ e2e/                          Playwright (FE-21)
└─ src/
   ├─ app/
   │  ├─ (auth)/login, signup                    FE-06
   │  ├─ (main)/layout.tsx                       FE-05 — sidebar, bottom nav
   │  ├─ (main)/page.tsx                         FE-07 — feed
   │  ├─ (main)/explore, explore/tags/[tag]      FE-11
   │  ├─ (main)/reels                            FE-20
   │  ├─ (main)/direct/inbox, direct/t/[id]      FE-17
   │  ├─ (main)/p/[id], @modal/(.)p/[id]         FE-08
   │  ├─ (main)/[username], accounts/*           FE-09, FE-10
   │  ├─ stories/[username]                      FE-16
   │  └─ api/                                    BFF — Avaz (FE-13)
   ├─ components/ui/             shadcn/ui + komponenthoi umumi (FE-02, FE-03)
   ├─ features/                  har funksiya: api.ts, hooks.ts, components/
   │  ├─ auth/  feed/  posts/  profile/  explore/  search/
   │  ├─ stories/  reels/  direct/  notifications/  create/
   ├─ lib/                       format, query-client, api-client, socket
   ├─ mocks/                     MSW (FE-04), handlers/ — xomush: NEXT_PUBLIC_API_MOCKING=off
   └─ store/                     Zustand — faqat holati UI
```

Import: `@/…` = `src/…` (`tsconfig.json`).

## Qoidaho
- Rangho faqat az tokenho (Spec 10 §1), rangi hardcode nest.
- Ikonkaho — faqat SVG (`lucide-react`), **emoji istifoda nabared**.
- Ma'lumot faqat tavassuti `/api/*` (BFF yo mock). Tipho — az `@repo/shared`.

## Запуск интерфейса Abubakr

Из корня проекта, Node.js 22+:

```sh
pnpm install
pnpm --filter web dev:mock
```

Mock-режим работает без API и базы данных. Для настоящего API используйте
`NEXT_PUBLIC_API_MOCKING=off` в `apps/web/.env`, запустите backend по инструкции
`apps/api/README.md`, затем `pnpm --filter web dev`. После смены режима сервер
Next.js нужно перезапустить. Если pnpm не установлен, используйте
`npx --yes pnpm@10.34.7` вместо `pnpm`.

Проверки frontend:

```sh
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
node apps/web/qa/check-design.mjs
```

Отдельный набор QA-02, без изменения тестов Direct/BFF Avaz:

```sh
# Сервер web запущен в mock-режиме на 3000.
pnpm --filter web test:qa
# Сервер web запущен без mocks; тестовые user1/password123 созданы seed.
# Запускайте на отдельной тестовой базе: тесты создают посты и меняют профиль.
QA_LIVE_URL=http://127.0.0.1:3000 pnpm --filter web test:qa:live
```

Для Playwright нужен Chromium: `pnpm --filter web exec playwright install chromium`.
Lighthouse: скрипт `qa/lighthouse.mjs` принимает `LIGHTHOUSE_MODULE` (путь к
`lighthouse/core/index.js` из временной установки Lighthouse) и `QA_LIVE_URL`.
Он использует тестовый аккаунт seed и сохраняет отчёты в `/tmp`.

Root layout намеренно ожидает запрос: существующая nonce CSP требует свежего
серверного HTML. Статический shell блокировал бы запуск JavaScript в production.
Защита proxy/BFF сохранена; токены доступны только серверу. Изображения через
защищённый BFF используют `next/image` с `unoptimized`, чтобы браузер передавал
cookie напрямую; первая фотография ленты загружается с приоритетом.

Результаты и ограничения API: [QA-02](../../docs/qa/QA-02.md).

## Общий backend на Render

Фронтенд использует https://istagram-web.onrender.com через серверный BFF;
Swagger: https://istagram-web.onrender.com/swagger. HTTP и Socket.IO должны
указывать на один backend, чтобы у всех разработчиков были общие данные.

В `apps/web/.env.local` (не коммитится):

```dotenv
API_URL=https://istagram-web.onrender.com
NEXT_PUBLIC_WS_URL=https://istagram-web.onrender.com
NEXT_PUBLIC_API_MOCKING=off
```

После изменения env перезапустите Next.js и войдите заново: токен локальной
базы не действует на Render. `.env.local` имеет приоритет над `.env`.
Локальный API можно выбрать, заменив оба URL на `http://localhost:4000`.
`dev:mock` явно включает MSW и предназначен для изолированной UI-проверки.

Проверка реального контракта без изменения постов/подписок/сообщений:

```bash
pnpm --filter web test:render:contract
```

По умолчанию используется demo-аккаунт из seed. Для другого аккаунта задайте
`QA_RENDER_USERNAME` и `QA_RENDER_PASSWORD` через окружение; токен не выводится.

UI-регрессия, включая новые сценарии Spec 14/15:

```bash
pnpm --filter web dev:mock
# в другом терминале
QA_BASE_URL=http://localhost:3000 pnpm --filter web test:qa
```

Production UI smoke с настоящим Render, без публикаций/лайков/подписок:

```bash
pnpm --filter web build
pnpm --filter web start --port 3001
# в другом терминале
pnpm --filter web test:render:ui
```

Изменения партнёра и границы адаптации:
[RENDER-INTEGRATION](../../docs/qa/RENDER-INTEGRATION.md).
