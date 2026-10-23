// Sanjishi e-mail: `pnpm --filter api mail:test you@gmail.com`
// Hamon MailService-i API-ro bo .env istifoda mebarad va xati sanjishi mefiristad.
import { loadConfig } from '../src/infra/config';
import { MailService } from '../src/infra/mail.service';

async function main() {
  const to = process.argv[2];
  if (!to) throw new Error('E-mail-ro nishon dihed: pnpm --filter api mail:test you@gmail.com');
  const mail = new MailService(loadConfig());
  mail.onModuleInit();
  if (!mail.enabled) throw new Error('E-mail tanzim nashudaast — docs/EMAIL.md-ro bined');
  const ok = await mail.send({
    to,
    subject: 'Instagram — sanjishi e-mail',
    text: 'Agar in xatro mebined, firistodani kodi ivazi parol kor mekunad.',
  });
  if (!ok) throw new Error('Firistoda nashud — xatoro dar bolo bined');
  console.log(`Firistoda shud ba ${to}. Inbox (va Spam)-ro bined.`);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
