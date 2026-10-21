/**
 * e2e baroi AC-hoi Spec 15: remove follower, favorites + feed, pin-i comment, liked posts, user reels,
 * tahriri paym, notes, "Active now"; Spec 03 `process-image` (WebP 1080 / 640 / 320).
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/infra/config';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../src/infra/prisma.service';
import { StorageService } from '../src/infra/storage.service';
import { configureApp } from '../src/setup';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const tag = randomBytes(3).toString('hex');
const name = (n: string) => `s15_${tag}_${n}`;
const PASSWORD = 'password123';

describe('API (Spec 15)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  const http = () => request(app.getHttpServer());
  const users: Record<string, { id: string; token: string }> = {};
  const auth = (who: string) => ({ Authorization: `Bearer ${users[who]!.token}` });
  const sockets: Socket[] = [];

  async function connect(who: string) {
    const ticket = (await http().post('/Account/ws-ticket').set(auth(who)).expect(200)).body.data as string;
    const s = io(baseUrl, { path: '/ws', auth: { token: ticket }, transports: ['websocket'] });
    sockets.push(s);
    await new Promise<void>((resolve) => s.on('connect', () => resolve()));
    return s;
  }
  const next = <T>(s: Socket, event: string) => new Promise<T>((resolve) => s.once(event, resolve));
  const follow = (who: string, target: string) =>
    http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users[target]!.id }).set(auth(who)).expect(200);
  async function post(who: string, content: string) {
    const r = await http().post('/Post/add-post').field('Content', content).attach('Images', PNG, { filename: 'a.png', contentType: 'image/png' }).set(auth(who)).expect(200);
    return r.body.data.postId as number;
  }
  async function comment(who: string, postId: number, text: string) {
    const r = await http().post('/Post/add-comment').send({ postId, comment: text }).set(auth(who)).expect(200);
    return r.body.data.postCommentId as number;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    for (const who of ['a', 'b', 'c']) {
      const userName = name(who);
      await http()
        .post('/Account/register')
        .set('x-forwarded-for', `10.15.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
        .send({ userName, fullName: 'S15', email: `${userName}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(200);
      const token = (await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200)).body.data as string;
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await prisma.user.deleteMany({ where: { userName: { startsWith: `s15_${tag}` } } });
    await app.close();
  });

  it('AC1: remove follower → follow nest, counter-ho durust', async () => {
    await follow('b', 'a');
    expect((await http().get('/UserProfile/get-my-profile').set(auth('a'))).body.data.subscribersCount).toBe(1);
    await http().delete('/FollowingRelationShip/remove-follower').query({ userId: users.b!.id }).set(auth('a')).expect(200);
    const subs = (await http().get('/FollowingRelationShip/get-subscribers').query({ UserId: users.a!.id }).set(auth('a'))).body.data;
    expect(subs).toHaveLength(0);
    expect((await http().get('/UserProfile/get-my-profile').set(auth('a'))).body.data.subscribersCount).toBe(0);
    expect((await http().get('/UserProfile/get-my-profile').set(auth('b'))).body.data.subscriptionsCount).toBe(0);
  });

  it('AC2: favorites → feed-i Favorites faqat postho-i onho; relation-status.isFavorite', async () => {
    const pb = await post('b', 'Favorite post');
    await post('c', 'Not favorite');
    await http().post('/User/add-favorite').query({ userId: users.b!.id }).set(auth('a')).expect(200);
    expect((await http().get('/User/get-favorites').set(auth('a'))).body.data.map((u: { id: string }) => u.id)).toEqual([users.b!.id]);
    expect((await http().get('/User/get-relation-status').query({ userId: users.b!.id }).set(auth('a'))).body.data.isFavorite).toBe(true);
    const feed = (await http().get('/Post/get-favorites-feed').set(auth('a')).expect(200)).body.data;
    expect(feed.map((p: { postId: number }) => p.postId)).toEqual([pb]);
    await http().delete('/User/remove-favorite').query({ userId: users.b!.id }).set(auth('a')).expect(200);
    expect((await http().get('/Post/get-favorites-feed').set(auth('a'))).body.data).toHaveLength(0);
  });

  it('AC3: pin-i comment — faqat muallif, pin-shuda avval, maks. 3', async () => {
    const p = await post('a', 'Pin test');
    const ids = [];
    for (let i = 0; i < 4; i++) ids.push(await comment('b', p, `c${i}`));
    await http().post('/Post/pin-comment').query({ commentId: ids[0] }).set(auth('b')).expect(403);
    for (const id of ids.slice(0, 3)) {
      expect((await http().post('/Post/pin-comment').query({ commentId: id }).set(auth('a')).expect(200)).body.data.value).toBe(true);
    }
    const r = await http().post('/Post/pin-comment').query({ commentId: ids[3] }).set(auth('a')).expect(400);
    expect(r.body.code).toBe('COMMENT_PIN_LIMIT');
    const list = (await http().get('/Post/get-comments').query({ postId: p }).set(auth('c'))).body.data;
    expect(list.slice(0, 3).every((c: { isPinned: boolean }) => c.isPinned)).toBe(true);
    expect(list[3].isPinned).toBe(false);
  });

  it('AC4: liked posts (nav avval) va reels-i user', async () => {
    const p1 = await post('c', 'L1');
    const p2 = await post('c', 'L2');
    await http().post('/Post/like-post').query({ postId: p1 }).set(auth('a')).expect(200);
    await http().post('/Post/like-post').query({ postId: p2 }).set(auth('a')).expect(200);
    const liked = (await http().get('/Post/get-liked-posts').set(auth('a')).expect(200)).body.data;
    expect(liked.map((p: { postId: number }) => p.postId).slice(0, 2)).toEqual([p2, p1]);
    const reels = await http().get('/Post/get-user-reels').query({ UserId: users.c!.id }).set(auth('a')).expect(200);
    expect(reels.body.data).toHaveLength(0);
  });

  it('AC5: tahriri paym → editedAt, tarafi digar message:updated; begona → 403', async () => {
    const chatId = (await http().post('/Chat/create-chat').query({ receiverUserId: users.b!.id }).set(auth('a')).expect(200)).body.data as number;
    const sent = (await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('MessageText', 'Salom').set(auth('a')).expect(200)).body.data;
    const sb = await connect('b');
    const updated = next<{ messageId: number; messageText: string; editedAt: string }>(sb, 'message:updated');
    const r = await http().put('/Chat/edit-message').send({ messageId: sent.messageId, text: 'Salom, chi xel?' }).set(auth('a')).expect(200);
    expect(r.body.data.editedAt).toBeTruthy();
    expect((await updated).messageText).toBe('Salom, chi xel?');
    await http().put('/Chat/edit-message').send({ messageId: sent.messageId, text: 'x' }).set(auth('b')).expect(403);
    await prisma.message.update({ where: { id: sent.messageId }, data: { createdAt: new Date(Date.now() - 16 * 60_000) } });
    const late = await http().put('/Chat/edit-message').send({ messageId: sent.messageId, text: 'y' }).set(auth('a')).expect(400);
    expect(late.body.code).toBe('EDIT_WINDOW_EXPIRED');
  });

  it('AC6: note — faqat mutual mebinad; close friends — faqat close friends; delete', async () => {
    await follow('a', 'c');
    await follow('c', 'a');
    await follow('b', 'c');
    const n = (await http().post('/Note/add-note').send({ text: 'Dar kuh!' }).set(auth('c')).expect(200)).body.data;
    expect(n.text).toBe('Dar kuh!');
    const seenBy = async (who: string) => (await http().get('/Note/get-notes').set(auth(who)).expect(200)).body.data.map((x: { userId: string }) => x.userId);
    expect(await seenBy('a')).toContain(users.c!.id);
    expect(await seenBy('b')).not.toContain(users.c!.id);
    await http().post('/Note/add-note').send({ text: 'CF', closeFriends: true }).set(auth('c')).expect(200);
    expect(await seenBy('a')).not.toContain(users.c!.id);
    await http().post('/User/add-close-friend').query({ userId: users.a!.id }).set(auth('c')).expect(200);
    expect(await seenBy('a')).toContain(users.c!.id);
    await http().post('/Note/add-note').send({ text: 'x'.repeat(61) }).set(auth('c')).expect(400);
    await http().delete('/Note/delete-note').set(auth('c')).expect(200);
    expect(await seenBy('a')).not.toContain(users.c!.id);
  });

  it('AC7: "Active now" — online bo socket; begona namebinad', async () => {
    const sc = await connect('c');
    const st = (await http().get('/User/get-activity-status').query({ userId: users.c!.id }).set(auth('a')).expect(200)).body.data;
    expect(st).toMatchObject({ isOnline: true });
    expect(st.lastActiveAt).toBeTruthy();
    sc.close();
    await new Promise((r) => setTimeout(r, 200));
    expect((await http().get('/User/get-activity-status').query({ userId: users.c!.id }).set(auth('a'))).body.data.isOnline).toBe(false);
    // b va a — na follow, na chat (pas az AC1) → pinhon; chat-i a–b dar AC5 sohta shud → namoyon
    const chats = (await http().get('/Chat/get-chats').set(auth('a'))).body.data;
    expect(chats[0]).toHaveProperty('peerIsOnline');
    expect(chats[0]).toHaveProperty('peerLastActiveAt');
  });

  it('Spec 03: aks → WebP 1080 + 640 / 320; fayli galat bo mime-i aks → 400', async () => {
    const root = app.get(StorageService).root;
    const id = await post('a', 'WebP');
    const file = (await http().get('/Post/get-post-by-id').query({ id }).set(auth('a')).expect(200)).body.data.images[0] as string;
    expect(file).toMatch(/.webp$/);
    for (const f of [file, file.replace('.webp', '-640.webp'), file.replace('.webp', '-320.webp')]) expect(existsSync(join(root, f))).toBe(true);
    // Disk pok shud (restart-i Render) → fayl az DB (MediaFile) bargardonida meshavad
    unlinkSync(join(root, file));
    await http().get(`/images/${file}`).expect(200);
    expect(existsSync(join(root, file))).toBe(true);
    await http().get('/images/..%2Fpackage.json').expect(404);
    const bad = await http()
      .post('/Post/add-post')
      .field('Content', 'fake')
      .attach('Images', Buffer.from('not an image at all'), { filename: 'x.png', contentType: 'image/png' })
      .set(auth('a'))
      .expect(400);
    expect(bad.body.code).toBe('MEDIA_TYPE_NOT_ALLOWED');
  });
});
