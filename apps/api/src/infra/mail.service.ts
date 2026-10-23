import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from './config';

/**
 * Firistodani e-mail tavassuti HTTP API-i Resend (bidun SMTP va bidun paket).
 * Agar RESEND_API_KEY yo MAIL_FROM nest — e-mail nameravad (dar dev kod dar log navishta meshavad).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get enabled() {
    return Boolean(this.config.RESEND_API_KEY && this.config.MAIL_FROM);
  }

  async send(to: string, subject: string, text: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: this.config.MAIL_FROM, to, subject, text }),
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
