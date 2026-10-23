import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { APP_CONFIG, AppConfig } from './config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

type Provider = { name: string; send: (from: string, m: MailMessage) => Promise<void> };

/** Bo timeout — SMTP-i bastashuda (masalan Render free) darxostro 2 daqiqa nigoh nadorad */
const TIMEOUT_MS = 10_000;

/** "Instagram <a@b.c>" → { name, email } */
function parseAddress(v: string) {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(v);
  return m ? { name: m[1] || undefined, email: m[2] } : { name: undefined, email: v.trim() };
}

/**
 * Firistodani e-mail (kodi ivazi parol), docs/EMAIL.md:
 * 1) Gmail — GMAIL_USER + GMAIL_APP_PASSWORD (Google Account -> Security -> App passwords)
 * 2) SMTP-i digar — SMTP_URL
 * 3) Brevo (HTTP, dar Render free ham kor mekunad — on jo portho-i SMTP basta-and) — BREVO_API_KEY
 * 4) Resend (HTTP) — RESEND_API_KEY
 * Provayderho ba tartib sanjida meshavand: agar yake xato dihad — navbati.
 * Agar hech kadom nest — e-mail nameravad (dar dev kod dar log navishta meshavad).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly providers: Provider[] = [];

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    const { GMAIL_USER, GMAIL_APP_PASSWORD, SMTP_URL, BREVO_API_KEY, RESEND_API_KEY } = config;
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
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              sender: parseAddress(from),
              to: [{ email: m.to }],
              subject: m.subject,
              textContent: m.text,
              htmlContent: m.html,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
        },
      });
    if (RESEND_API_KEY)
      this.providers.push({
        name: 'resend',
        send: async (from, m) => {
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
    if (this.enabled) this.logger.log(`E-mail: ${this.providers.map((p) => p.name).join(' -> ')} (az ${this.from})`);
    else this.logger.warn('E-mail tanzim nashudaast — kodi ivazi parol faqat dar log (docs/EMAIL.md)');
  }

  private addSmtp(name: string, transport: Transporter) {
    this.providers.push({ name, send: async (from, m) => void (await transport.sendMail({ from, ...m })) });
  }

  /** Firistanda: MAIL_FROM, yo akkaunti Gmail / SMTP */
  private get from() {
    if (this.config.MAIL_FROM) return this.config.MAIL_FROM;
    const user =
      this.config.GMAIL_USER ??
      (this.config.SMTP_URL ? decodeURIComponent(new URL(this.config.SMTP_URL).username) : '');
    return user ? `Instagram <${user}>` : undefined;
  }

  get enabled() {
    return Boolean(this.from && this.providers.length);
  }

  async send(message: MailMessage): Promise<boolean> {
    const from = this.from;
    if (!from) return false;
    for (const p of this.providers) {
      try {
        await p.send(from, message);
        return true;
      } catch (err) {
        this.logger.warn(`E-mail tavassuti ${p.name} firistoda nashud: ${(err as Error).message}`);
      }
    }
    return false;
  }
}
