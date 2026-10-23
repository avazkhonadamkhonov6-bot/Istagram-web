import { Inject, Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { APP_CONFIG, AppConfig } from './config';

/**
 * Firistodani e-mail (kodi ivazi parol):
 * 1) SMTP — masalan Gmail: SMTP_URL=smtps://you@gmail.com:<app-password>@smtp.gmail.com:465
 * 2) yo HTTP API-i Resend: RESEND_API_KEY.
 * Agar hech kadom nest — e-mail nameravad (dar dev kod dar log navishta meshavad).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly smtp?: Transporter;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    if (config.SMTP_URL) this.smtp = createTransport(config.SMTP_URL);
  }

  /** Firistanda: MAIL_FROM yo hamon akkaunti SMTP */
  private get from() {
    if (this.config.MAIL_FROM) return this.config.MAIL_FROM;
    const user = this.config.SMTP_URL ? decodeURIComponent(new URL(this.config.SMTP_URL).username) : '';
    return user ? `Instagram <${user}>` : undefined;
  }

  get enabled() {
    return Boolean(this.from && (this.smtp || this.config.RESEND_API_KEY));
  }

  async send(to: string, subject: string, text: string): Promise<boolean> {
    const from = this.from;
    if (!from) return false;
    try {
      if (this.smtp) {
        await this.smtp.sendMail({ from, to, subject, text });
        return true;
      }
      if (!this.config.RESEND_API_KEY) return false;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) this.logger.warn(`E-mail firistoda nashud: HTTP ${res.status}`);
      return res.ok;
    } catch (err) {
      this.logger.warn(`E-mail firistoda nashud: ${(err as Error).message}`);
      return false;
    }
  }
}
