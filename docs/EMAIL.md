# EMAIL — Kodi "Forgot password" ba Gmail

> Sahifa: `/accounts/password/reset` → e-mail → kod (8 aloma, 15 daqiqa) → paroli nav.
> Backend: `apps/api/src/infra/mail.service.ts`. Agar e-mail tanzim nashavad, kod faqat dar log-i API (dar dev) navishta meshavad va ba Gmail namerasad.

## Kadom rohro intixob kunem

| API dar kujo kor mekunad | Roh | Chiro |
|---|---|---|
| Kompyuteri xud (`localhost:4000`) | **Gmail** (App Password) | Xat az akkaunti Gmail-i xudi shumo meravad |
| Render (plan-i free) | **Brevo** (HTTP API) | Render-i free portho-i SMTP-ro (25, 465, 587) mebandad — Gmail SMTP dar onjo kor namekunad |

Agar chand roh tanzim shavad, ba tartib sanjida meshavand: Gmail → SMTP → Brevo → Resend. Agar yake xato dihad — navbati.

## 1. Gmail (lokali)

1. Dar akkaunti Google **2-Step Verification**-ro fa'ol kuned: https://myaccount.google.com/security
2. **App passwords**: https://myaccount.google.com/apppasswords → nom (masalan `instagram-clone`) → **Create**. 16 harf nishon doda meshavad (`abcd efgh ijkl mnop`) — onro nusxa kuned.
3. Ba `apps/api/.env` ilova kuned (fosilaho dar parol mumkin ast, xud hazf meshavand):

   ```
   GMAIL_USER=you@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```

4. Sanjish (xati sanjishi mefiristad):

   ```bash
   pnpm --filter api mail:test you@gmail.com
   ```

5. API-ro az nav ba kor andozed. Dar log boyad bined: `E-mail: gmail (az Instagram <you@gmail.com>)`.
6. Frontend boyad ba API-i lokali vasl boshad — dar `apps/web/.env.local`:

   ```
   API_URL=http://localhost:4000
   NEXT_PUBLIC_WS_URL=http://localhost:4000
   ```

> App Password — kalidi alohida, ne paroli asosii Google. Onro dar Git nanavised (`.env` dar `.gitignore` ast). Agar gum shavad — dar hamon sahifa hazf kuned va navash sozed.

## 2. Brevo (Render)

1. Dar https://www.brevo.com akkaunti roygon sozed (300 xat dar ruz).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: e-mail-i Gmail-i xud → kodi tasdiqro az Gmail vorid kuned.
3. **SMTP & API → API keys → Generate a new API key** — kalidro nusxa kuned.
4. Render → servisi `Istagram-web` → **Environment**:

   ```
   BREVO_API_KEY=<kalid>
   MAIL_FROM=Instagram <you@gmail.com>
   ```

   `MAIL_FROM` boyad hamon sender-i tasdiqshuda boshad. **Save** → Render xud restart mekunad.
5. Dar log-i Render boyad bined: `E-mail: brevo (az Instagram <you@gmail.com>)`.

## Agar xat naoyad

| Alomat dar log-i API | Sabab va hal |
|---|---|
| `E-mail tanzim nashudaast` | Kalidho dar `.env` / Render nestand yo API restart nashud |
| `Invalid login: 535-5.7.8` | Gmail App Password nodurust (yo paroli asosi guzoshta shud) — App Password-i nav sozed |
| `Connection timeout` (gmail) | Shabaka portho-i SMTP-ro mebandad (masalan Render free) — Brevo-ro istifoda bared |
| `brevo ... HTTP 401` | `BREVO_API_KEY` nodurust |
| `brevo ... HTTP 400 ... sender` | `MAIL_FROM` dar Brevo tasdiq nashudaast |
| Xat dar log "firistoda shud", vale dar Inbox nest | Papkai **Spam** / **Promotions**-ro bined |

E-mail-i nomavjud: javob hamon ast ("Code sent"), xat nameravad — in amniyat ast (az ruyi javob fahmida nameshavad, ki akkaunt hast).

## Javobi sahifa (az 2026-10-23)

| Holat | Sahifa nishon medihad | Kod (API) |
|---|---|---|
| Kod ba e-mail-i navishtashuda firistoda shud | qadami "Enter confirmation code" | 200 |
| Bo in e-mail akkaunt nest | "No account found with this email..." | 404 `EMAIL_NOT_FOUND` |
| E-mail tanzim nashudaast yo Brevo / Gmail xato dod | "We couldn't send the email right now..." | 503 `EMAIL_NOT_SENT` |

Pesh az in sahifa dar hama holat "Code sent" menavisht va xato pinhon memond. Sababi 503-ro dar log-i API (`MailService`) bined.

## Diagnostika va islohi avtomati (az 2026-10-24)

- `GET /health` → `mail: { ready, providers, from, last }` — natijai firistodani oxirin bo sabab (bidun kalid va e-mail). Masalan: https://istagram-web.onrender.com/health
- Qimathoi `BREVO_API_KEY`, `MAIL_FROM` va g. az fosila, satri nav va qavsho xudkor toza meshavand.
- Agar `MAIL_FROM` nest yo dar Brevo tasdiq nashudaast — sender-i tasdiqshuda **xudkor az Brevo** (Senders) girifta meshavad. Bas ast, ki dar Brevo yak sender tasdiq shuda boshad.

| `mail.last.error` | Hal |
|---|---|
| `HTTP 401 — BREVO_API_KEY nodurust ast` | Kalidi navro dar Brevo → SMTP & API → API keys sozed va dar Render ivaz kuned |
| `Dar Brevo sender-i tasdiqshuda nest` | Brevo → Senders → Add a sender → kodi tasdiq az Gmail |
| `mail.ready: false` | `BREVO_API_KEY` dar Render → Environment nest yo Render restart nashud |
