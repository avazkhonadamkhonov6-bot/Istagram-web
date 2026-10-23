import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { z } from 'zod';

/** Fayli .env (agar hast) — tagyirandahoi muhiti voqe'i afzaliyat dorand */
export function loadEnvFile(path = '.env') {
  if (!existsSync(path)) return;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(path, 'utf8')))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/** Tagyirandahoi muhit — dar start tekshirida meshavand (Spec 11 AC2). */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Yak yo chand origin bo vergul: `http://localhost:3000,https://web.onrender.com`
  WEB_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((o) => o.trim()).filter(Boolean))
    .pipe(z.array(z.string().url()).min(1)),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET boyad kamash 32 aloma boshad'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('uploads'),
  PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  // Zang va efir (Spec 16): STUN-i ozod; TURN — baroi shabakahoi mahdud (masalan turn:host:3478, bo vergul)
  STUN_URLS: z.string().default('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'),
  TURN_URLS: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_CREDENTIAL: z.string().optional(),
  // E-mail (kodi ivazi parol): Resend — https://resend.com; MAIL_FROM masalan 'Instagram <no-reply@domain.tj>'
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | undefined;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  loadEnvFile();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    // Xatoi fahmo dar start, ne dar vaqti kor
    throw new Error(`Konfiguratsiyai .env noto'g'ri ast:\n${lines.join('\n')}`);
  }
  cached = parsed.data;
  return cached;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
