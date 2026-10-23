/**
 * e2e baroi AC-hoi Spec 17: Instants — faqat mutual / close friends, yak bor didan, undo, archive, 24 soat.
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { SocketEvent } from '@repo/shared';
import { io } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/infra/config';
import { PrismaService } from '../src/infra/prisma.service';
import { configureApp } from '../src/setup';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const tag = randomBytes(3).toString('hex');
const name = (n: string) => `s17_${tag}_${n}`;
const PASSWORD = 'password123';

describe('API (Spec 17)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const users: Record<string, { id: string; token: string }> = {};
  const auth = (who: string) => ({ Authorization: `Bearer ${users[who]!.token}` });
  const follow = (who: string, target: string) =>
    http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users[target]!.id }).set(auth(who)).expect(200);
  async function instant(who: string, closeFriends = false) {
    const r = await http()
      .post('/Instant/add-instant')
      .query({ CloseFriends: String(closeFriends) })
      .attach('Image', PNG, { filename: 'i.png', contentType: 'image/png' })
      .set(auth(who))
      .expect(200);
    return r.body.data as { id: number; viewCount: number | null };
  }
  const inbox = async (who: string) =>
    (await http().get('/Instant/get-instants').set(auth(who)).expect(200)).body.data.map((x: { id: number }) => x.id) as number[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    prisma = app.get(PrismaService);
    for (const who of ['a', 'b', 'c']) {
      const userName = name(who);
      await http()
        .post('/Account/register')
        .set('x-forwarded-for', `10.17.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
        .send({ userName, fullName: 'S17', email: `${userName}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(200);
      const token = (await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200)).body.data as string;
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
    // a <-> c mutual; b faqat c-ro follow mekunad
    await follow('a', 'c');
    await follow('c', 'a');
    await follow('b', 'c');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userName: { startsWith: `s17_${tag}` } } });
    await app.close();
  });

  it('AC1: faqat mutual mebinad; muallif viewCount mebinad', async () => {
    const i = await instant('c');
    expect(i.viewCount).toBe(0);
    expect(await inbox('a')).toContain(i.id);
    expect(await inbox('b')).not.toContain(i.id);
    expect(await inbox('c')).not.toContain(i.id);
  });

  it('AC2: yak bor didan — ba\'d az view nopadid; archive viewCount = 1', async () => {
    const [id] = await inbox('a');
    await http().post('/Instant/view-instant').query({ id }).set(auth('a')).expect(200);
    expect(await inbox('a')).not.toContain(id);
    const archive = (await http().get('/Instant/get-instant-archive').set(auth('c')).expect(200)).body.data;
    expect(archive.find((x: { id: number }) => x.id === id).viewCount).toBe(1);
  });

  it('AC3: close friends — faqat close friends', async () => {
    const i = await instant('c', true);
    expect(await inbox('a')).not.toContain(i.id);
    await http().post('/User/add-close-friend').query({ userId: users.a!.id }).set(auth('c')).expect(200);
    expect(await inbox('a')).toContain(i.id);
  });

  it('AC4: undo — faqat muallif; begona 404', async () => {
    const i = await instant('c');
    await http().delete('/Instant/delete-instant').query({ id: i.id }).set(auth('a')).expect(404);
    await http().delete('/Instant/delete-instant').query({ id: i.id }).set(auth('c')).expect(200);
    expect(await inbox('a')).not.toContain(i.id);
  });

  it('AC5: 24 soat ba\'d nopadid; be fayl → 400', async () => {
    const i = await instant('c');
    await prisma.instant.update({ where: { id: i.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await inbox('a')).not.toContain(i.id);
    await http().post('/Instant/add-instant').set(auth('c')).expect(400);
  });

  it('AC6: real-time — mutual `instant:new` megirad, begona ne', async () => {
    const baseUrl = await app.getUrl();
    const connect = async (who: string) => {
      const ticket = (await http().post('/Account/ws-ticket').set(auth(who)).expect(200)).body.data as string;
      const s = io(baseUrl, { path: '/ws', auth: { token: ticket }, transports: ['websocket'] });
      await new Promise<void>((resolve) => s.on('connect', () => resolve()));
      // handleConnection asinxronist — room-i user pas az verify
      await new Promise((r) => setTimeout(r, 50));
      return s;
    };
    const [sa, sb] = [await connect('a'), await connect('b')];
    let bGot = false;
    sb.on(SocketEvent.INSTANT_NEW, () => (bGot = true));
    try {
      const got = new Promise<{ id: number; userName: string }>((resolve) => sa.once(SocketEvent.INSTANT_NEW, resolve));
      const i = await instant('c');
      const e = await got;
      expect(e.id).toBe(i.id);
      expect(e.userName).toBe(name('c'));
      await new Promise((r) => setTimeout(r, 300));
      expect(bGot).toBe(false);
    } finally {
      sa.close();
      sb.close();
    }
  });
});
