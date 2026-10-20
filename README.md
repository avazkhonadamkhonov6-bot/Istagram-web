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
| [docs/specs/](docs/specs/) | Spec-i har modul (API, AC) |

## Ogoz (pas az BE-01)

```bash
corepack enable
pnpm install
pnpm dev
```

## Qoidaho

1. **Har kas faqat dar papkai xud kor mekunad** (jadvali bolo, `.github/CODEOWNERS`).
2. `packages/shared` — faqat Avaz tagyir medihad. Agar maydoni nav lozim — comment dar Issue.
3. Branch: `feat/be-<nom>` yo `feat/fe-<nom>` → PR ba `main` bo `Closes #<issue>`. CI boyad sabz boshad.
4. Spec — kontrakt. Agar spec galat ast: avval spec, ba'd kod.
5. **Emoji istifoda nabared** — na dar kod, na dar UI (ikonkaho faqat SVG), na dar commit, na dar hujjatho.
6. Commit-ho kutoh va fahmo: `feat(api): auth register`, `fix(web): feed scroll`.
