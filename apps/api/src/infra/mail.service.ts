import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { APP_CONFIG, AppConfig } from './config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

type Address = { name?: string; email: string };
type Provider = { name: string; send: (from: string | undefined, m: MailMessage) => Promise<void> };

/** Bo timeout — SMTP-i bastashuda (masalan Render free) darxostro 2 daqiqa nigoh nadorad */
const TIMEOUT_MS = 10_000;

/**
 * Qimati muhit az copy-paste: fosila, satri nav va qavshoi atrof hazf
 * (`"xkeysib-..." `, `'Instagram <a@b.c>'`) — sababi maʼmulii HTTP 401 / sender-i nodurust.
 */
export function cleanEnv(v: string | undefined) {
  const s = v?.trim().replace(/^(["'])(.*)\1$/s, '$2').trim();
  return s || undefined;
}

/** "Instagram <a@b.c>" → { name, email } */
function parseAddress(v: string): Address {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(v);
  return m ? { name: m[1] || undefined, email: m[2]!.trim() } : { email: v.trim() };
}

/** Matni xato bidun e-mail-ho va kalidho — baroi log va /health */
const safe = (s: string) => s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>').replace(/xkeysib-[\w-]+/g, '<key>').slice(0, 300);

/**
 * Firistodani e-mail (kodi ivazi parol), docs/EMAIL.md:
 * 1) Gmail — GMAIL_USER + GMAIL_APP_PASSWORD (Google Account -> Security -> App passwords)
 * 2) SMTP-i digar — SMTP_URL
 * 3) Brevo (HTTP, dar Render free ham kor mekunad — on jo portho-i SMTP basta-and) — BREVO_API_KEY;
 *    agar MAIL_FROM nest yo dar Brevo tasdiq nashudaast — sender-i tasdiqshuda az Brevo girifta meshavad
 * 4) Resend (HTTP) — RESEND_API_KEY
 * Provayderho ba tartib sanjida meshavand: agar yake xato dihad — navbati.
 * Agar hech kadom nest — e-mail nameravad (dar dev kod dar log navishta meshavad).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly providers: Provider[] = [];
  private readonly mailFrom: string | undefined;
  private brevoSender?: Address;
  /** Natijai oxirin — dar /health (bidun kalid va e-mail) */
  private last: { ok: boolean; provider?: string; error?: string; at: string } | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.mailFrom = cleanEnv(config.MAIL_FROM);
    const GMAIL_USER = cleanEnv(config.GMAIL_USER);
    const GMAIL_APP_PASSWORD = cleanEnv(config.GMAIL_APP_PASSWORD);
    const SMTP_URL = cleanEnv(config.SMTP_URL);
    const BREVO_API_KEY = cleanEnv(config.BREVO_API_KEY);
    const RESEND_API_KEY = cleanEnv(config.RESEND_API_KEY);
    if (GMAIL_USER && GMAIL_APP_PASSWORD)
      // App Password-i Google bo fosila nishon doda meshavad ("abcd efgh ...") — fosilaho hazf
      this.addSmtp('gmail', createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
        connectionTimeout: TIMEOUT_MS,
        greetingTimeout: TIMEOUT_MS,
        socketTimeout: TIMEOUT_MS,
      }));
    if (SMTP_URL)
      this.addSmtp('smtp', createTransport(SMTP_URL, {
        connectionTimeout: TIMEOUT_MS,
        greetingTimeout: TIMEOUT_MS,
        socketTimeout: TIMEOUT_MS,
      }));
    if (BREVO_API_KEY)
      this.providers.push({
        name: 'brevo',
        send: async (from, m) => {
          const sender = await this.resolveBrevoSender(BREVO_API_KEY, from);
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              sender,
              to: [{ email: m.to }],
              subject: m.subject,
              textContent: m.text,
              htmlContent: m.html,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok) {
            // Sender rad shud — keshro pok mekunem, darxosti navbati az nav az Brevo megirad
            if (res.status === 400) this.brevoSender = undefined;
            throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
          }
        },
      });
    if (RESEND_API_KEY)
      this.providers.push({
        name: 'resend',
        send: async (from, m) => {
          if (!from) throw new Error('MAIL_FROM lozim ast');
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to: m.to, subject: m.subject, text: m.text, html: m.html }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
        },
      });
  }

  onModuleInit() {
    if (this.enabled)
      this.logger.log(`E-mail: ${this.providers.map((p) => p.name).join(' -> ')} (az ${this.from ?? 'sender-i Brevo'})`);
    else this.logger.warn('E-mail tanzim nashudaast — kodi ivazi parol faqat dar log (docs/EMAIL.md)');
  }

  private addSmtp(name: string, transport: Transporter) {
    this.providers.push({
      name,
      send: async (from, m) => {
        if (!from) throw new Error('MAIL_FROM yo GMAIL_USER lozim ast');
        await transport.sendMail({ from, ...m });
      },
    });
  }

  /**
   * Sender-i Brevo: MAIL_FROM, agar dar Brevo tasdiq shuda boshad; vagarna — avvalin sender-i fa'ol
   * (Brevo → Senders). Hamin tavr MAIL_FROM-i nodurust yo nabuda xatoi 400 namedihad.
   */
  private async resolveBrevoSender(apiKey: string, from: string | undefined): Promise<Address> {
    if (this.brevoSender) return this.brevoSender;
    const wanted = from ? parseAddress(from) : undefined;
    try {
      const res = await fetch('https://api.brevo.com/v3/senders', {
        headers: { 'api-key': apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 401) throw new Error('HTTP 401 — BREVO_API_KEY nodurust ast');
      if (res.ok) {
        const { senders = [] } = (await res.json()) as { senders?: { name?: string; email: string; active?: boolean }[] };
        const active = senders.filter((s) => s.active !== false);
        const match = wanted && active.find((s) => s.email.toLowerCase() === wanted.email.toLowerCase());
        const pick = match ?? active[0];
        if (pick) {
          if (wanted && !match) this.logger.warn('MAIL_FROM dar Brevo tasdiq nashudaast — sender-i tasdiqshudai Brevo istifoda meshavad');
          this.brevoSender = { name: wanted?.name ?? pick.name ?? 'Instagram', email: pick.email };
          return this.brevoSender;
        }
        if (!wanted) throw new Error('Dar Brevo sender-i tasdiqshuda nest (Senders → Add a sender)');
      }
    } catch (err) {
      if ((err as Error).message.includes('401') || !wanted) throw err;
    }
    // Ruyxati sender-ho dastras nest (kalid ijozat nadorad) — MAIL_FROM hamon tavr
    return wanted!;
  }

  /** Firistanda: MAIL_FROM, yo akkaunti Gmail / SMTP; baroi Brevo metavonad naboshad */
  private get from() {
    if (this.mailFrom) return this.mailFrom;
    const smtpUrl = cleanEnv(this.config.SMTP_URL);
    const user = cleanEnv(this.config.GMAIL_USER) ?? (smtpUrl ? decodeURIComponent(new URL(smtpUrl).username) : '');
    return user ? `Instagram <${user}>` : undefined;
  }

  get enabled() {
    return this.providers.length > 0 && Boolean(this.from || this.providers.some((p) => p.name === 'brevo'));
  }

  /** Baroi /health: provayderho, firistanda dorad yo ne, natijai oxirin (bidun kalid va e-mail) */
  status() {
    return {
      ready: this.enabled,
      providers: this.providers.map((p) => p.name),
      from: this.from ? 'set' : this.providers.some((p) => p.name === 'brevo') ? 'brevo-sender' : 'missing',
      last: this.last,
    };
  }

  async send(message: MailMessage): Promise<boolean> {
    if (!this.enabled) return false;
    const from = this.from;
    const errors: string[] = [];
    for (const p of this.providers) {
      try {
        await p.send(from, message);
        this.last = { ok: true, provider: p.name, at: new Date().toISOString() };
        return true;
      } catch (err) {
        const msg = safe((err as Error).message);
        errors.push(`${p.name}: ${msg}`);
        this.logger.warn(`E-mail tavassuti ${p.name} firistoda nashud: ${msg}`);
      }
    }
    this.last = { ok: false, error: errors.join(' | '), at: new Date().toISOString() };
    return false;
  }
}
