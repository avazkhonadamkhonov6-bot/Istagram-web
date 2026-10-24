/**
 * e2e baroi "Forgot password" (Spec 12): kod ba e-mail meravad → bo kod paroli nav → paroli nav saqt,
 * paroli kuhna kor namekunad; kodi khato, kodi istifodashuda, kodi kuhna va e-mail-i nomavjud.
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/infra/config';
import { MailService, type MailMessage } from '../src/infra/mail.service';
import { PrismaService } from '../src/infra/prisma.service';
import { configureApp } from '../src/setup';

const tag = randomBytes(3).toString('hex');
const userName = `rp_${tag}`;
const email = `${userName}@t.tj`;
const OLD = 'password123';
const NEW = 'NewPassw0rd!';

/** Khatho-i firistoda — e-mail-i voqe'i nameravad */
const outbox: MailMessage[] = [];
let mailWorks = true;
const fakeMail = {
  enabled: true,
  status: () => ({ ready: true, providers: ['fake'], from: 'set', last: null }),
  send: async (m: MailMessage) => {
    if (!mailWorks) return false;
    outbox.push(m);
    return true;
  },
};

describe('API (Forgot password)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  // Har darxost az IP-i digar — throttle-i 3/daq. test-ro nabandad
  const ip = () => `10.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const login = (password: string) => http().post('/Account/login').set('x-forwarded-for', ip()).send({ userName, password });
  const forgot = (Email: string) => http().delete('/Account/ForgotPassword').set('x-forwarded-for', ip()).query({ Email });
  const reset = (Token: string, Password = NEW, Email = email) =>
    http().delete('/Account/ResetPassword').set('x-forwarded-for', ip()).query({ Token, Email, Password, ConfirmPassword: Password });
  /** Kod az matni khati oxirin */
  const lastCode = () => outbox.at(-1)!.text.match(/: ([0-9a-f]{8})/)![1]!;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(fakeMail)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    prisma = app.get(PrismaService);
    await http()
      .post('/Account/register')
      .set('x-forwarded-for', ip())
      .send({ userName, fullName: 'Reset', email, password: OLD, confirmPassword: OLD })
      .expect(200);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userName } });
    await app.close();
  });

  it('AC1: e-mail-i nomavjud — 404 EMAIL_NOT_FOUND, khat nameravad', async () => {
    const r = await forgot(`nobody_${tag}@t.tj`).expect(404);
    expect(r.body.code).toBe('EMAIL_NOT_FOUND');
    expect(outbox).toHaveLength(0);
  });

  it('AC2: kod ba e-mail-i korbar meravad', async () => {
    const r = await forgot(email.toUpperCase()).expect(200);
    expect(r.body.data).toBe('Code sent');
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.to).toBe(email);
    expect(outbox[0]!.subject).toContain(lastCode());
  });

  it('AC3: kodi khato va paroli kutoh rad meshavand, parol tagyir namekunad', async () => {
    const bad = await reset('deadbeef').expect(400);
    expect(bad.body.code).toBe('INVALID_RESET_TOKEN');
    await reset(lastCode(), 'short').expect(400);
    await login(OLD).expect(200);
  });

  it('AC4: bo kodi durust paroli nav saqt meshavad; paroli kuhna kor namekunad', async () => {
    const r = await reset(lastCode()).expect(200);
    expect(r.body.data).toBe('Password reset');
    await login(OLD).expect(401);
    const token = (await login(NEW).expect(200)).body.data as string;
    await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('AC5: kod yak bor kor mekunad', async () => {
    const again = await reset(lastCode(), 'Another1234').expect(400);
    expect(again.body.code).toBe('INVALID_RESET_TOKEN');
    await login(NEW).expect(200);
  });

  it('AC6: pas az reset hamai kodhoi digar bekor; kodi kuhnatar az 15 daq. kor namekunad', async () => {
    await forgot(email).expect(200);
    const first = lastCode();
    await forgot(email).expect(200);
    const second = lastCode();
    await reset(second, OLD).expect(200);
    await reset(first, 'Third12345').expect(400);
    await login(OLD).expect(200);

    await forgot(email).expect(200);
    await prisma.passwordResetToken.updateMany({ where: { usedAt: null, user: { userName } }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await reset(lastCode()).expect(400);
    await login(OLD).expect(200);
  });

  it('AC7: agar xat naravad — 503 EMAIL_NOT_SENT, kod nigoh doshta nameshavad', async () => {
    const before = await prisma.passwordResetToken.count({ where: { user: { userName } } });
    mailWorks = false;
    try {
      const r = await forgot(email).expect(503);
      expect(r.body.code).toBe('EMAIL_NOT_SENT');
    } finally {
      mailWorks = true;
    }
    expect(await prisma.passwordResetToken.count({ where: { user: { userName } } })).toBe(before);
  });
});
