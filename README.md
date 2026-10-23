# Instagram Clone — monorepo

Kopiyai Instagram-i veb. Backend — NestJS, frontend — Next.js 16, monorepo — Turborepo + pnpm.
Kor bo usuli **SDD**: avval spec (`docs/specs/`), ba'd kod.

## Struktura

```
exem-3/
├─ apps/
│  ├─ api/                    NestJS API (port 4000)              — Avaz
│  └─ web/                    Next.js (port 3000)                  — Abubakr
│     └─ src/app/api/         BFF (route handler-ho)               — Avaz
├─ packages/
│  ├─ shared/                 Zod schema-ho, tipho, kodhoi xato    — Avaz
│  └─ tsconfig/               konfiguratsiyai umumii TypeScript    — Avaz
├─ docs/                      TZ, PLAN, TASKS, PROGRESS, ROADMAP, specs/
├─ scripts/                   skriptho (masalan sohtani Issue-ho dar GitHub)
├─ .github/                   CI, CODEOWNERS
├─ package.json               skripthoi umumi (turbo)
├─ pnpm-workspace.yaml
└─ turbo.json
```

Tafsiloti har papka — dar `README.md`-i xudi on.

## Hujjatho

| Fayl | Baroi chi |
|---|---|
| [docs/TZ.md](docs/TZ.md) | Topshiriqi texniki |
| [docs/PLAN.md](docs/PLAN.md) | 4 ruz, soat ba soat, Avaz va Abubakr |
| [docs/TASKS.md](docs/TASKS.md) | Hamai vazifaho bo ID (BE-xx, FE-xx, QA-xx) |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Chi tayyor, chi monda |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Versiyaho v0.1 → v2.0 |
| [docs/specs/](docs/specs/) | Spec-i har modul (API, AC); **kontrakti amaldori API — [Spec 12](docs/specs/12-api-kontrakt.md) + ilovaho [Spec 13](docs/specs/13-ilovaho-tz.md)** |
| [docs/qa/QA-01.md](docs/qa/QA-01.md) | Hisoboti QA (spec 01, 05, 08, 09, 11) |

## Ogoz

Talab: Node >= 22, pnpm (`corepack enable`), PostgreSQL (lokali yo `docker compose up -d`).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # DATABASE_URL va JWT_SECRET-ro ivaz kuned
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @repo/shared build
pnpm --filter api db:deploy                 # migratsiyaho
pnpm --filter api db:seed                   # user1…user10, parol password123
npm run dev:all                              # api :4000, web :3000
```

| Chi | Kujo |
|---|---|
| Sayt | http://localhost:3000 (Direct: `/direct/inbox`) |
| API + Swagger | http://localhost:4000/swagger |
| Health | http://localhost:4000/health |

## Запуск с общим backend

Node.js 22+; из корня проекта:

```bash
npx --yes pnpm@10.34.7 install
npm run dev
```

`npm run dev` напрямую запускает установленный Next.js на http://localhost:3000
и заранее компилирует основные страницы. Глобальный pnpm для этого запуска не требуется.
В `apps/web/.env.local` оба URL (`API_URL`, `NEXT_PUBLIC_WS_URL`) должны указывать
на `https://istagram-web.onrender.com`, а `NEXT_PUBLIC_API_MOCKING=off`.
Для запуска всех локальных сервисов используйте `npm run dev:all`
(предварительно подготовьте PostgreSQL и миграции по инструкции выше,
а в `apps/web/.env.local` задайте оба URL как `http://localhost:4000`).

```bash
npm run check:api
```

Команда проверяет `/health` через Node.js с тем же `API_URL`, что использует Next.js,
и показывает состояние базы и хранилища. Если страница отдаёт 200, а `/api/*` —
504 примерно через 60 секунд, Next.js запущен, но backend не ответил за таймаут.
Проверьте подключение, доступность Render и повторите проверку. В интерфейсе
при 502/504 появляется сообщение с повторной попыткой; сессия сохраняется.

## Testho

```bash
pnpm --filter api test        # API e2e (Jest + Supertest + Socket.IO), DB-i voqe'i lozim
pnpm --filter web test:e2e    # Playwright (Chrome-i nasbshuda), api va web-ro xud ba kor medarorad
```

## Qoidaho

1. **Har kas faqat dar papkai xud kor mekunad** (jadvali bolo, `.github/CODEOWNERS`).
2. `packages/shared` — faqat Avaz tagyir medihad. Agar maydoni nav lozim — comment dar Issue.
3. Branch: `feat/be-<nom>` yo `feat/fe-<nom>` → PR ba `main` bo `Closes #<issue>`. CI boyad sabz boshad.
4. Spec — kontrakt. Agar spec galat ast: avval spec, ba'd kod.
5. **Emoji istifoda nabared** — na dar kod, na dar UI (ikonkaho faqat SVG), na dar commit, na dar hujjatho.
6. Commit-ho kutoh va fahmo: `feat(api): auth register`, `fix(web): feed scroll`.

## Проверка завершённых задач frontend

Изменения FE-06/10/16/18/26/29/31 и QA-02 описаны в [QA-02](docs/qa/QA-02.md).
Для новой версии API примените миграции (`pnpm --filter api db:deploy`):
редактирование профиля добавляет поле `website` и публичную проверку username.
Обновляйте API и frontend вместе.

```sh
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
# API и production web уже запущены; требуется отдельная тестовая база:
QA_LIVE_URL=http://127.0.0.1:3301 pnpm --filter web test:completion
```

Полностью локальный сценарий с отдельной базой, без изменения Render:

```sh
export NODE_ENV=test
export DATABASE_URL=postgresql://app:app@localhost:5432/instagram_test
export JWT_SECRET=local_test_secret_at_least_32_characters
export API_URL=http://127.0.0.1:4400
export NEXT_PUBLIC_WS_URL=http://127.0.0.1:4400
export NEXT_PUBLIC_API_MOCKING=off
export WEB_ORIGIN=http://127.0.0.1:3301
export PORT=4400
export UPLOAD_DIR=/tmp/instagram-qa-uploads
pnpm --filter @repo/shared build
pnpm --filter api db:deploy
pnpm --filter api build
node apps/api/test/seed-frontend.cjs
NODE_ENV=production pnpm --filter web build
pnpm --filter web exec playwright install chromium
QA_START_SERVERS=1 pnpm --filter web test:completion
```

Скрипт тестовых данных разрешён только при `NODE_ENV=test` и имени базы с `test`
или `qa`. GitHub Actions запускает эти проверки и сохраняет trace при ошибке.
Демонстрационный маршрут: [docs/DEMO.md](docs/DEMO.md).
