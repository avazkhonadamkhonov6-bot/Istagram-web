/**
 * e2e baroi AC-hoi Spec 12. Talab mekunad: DATABASE_URL (migrate deploy) va JWT_SECRET.
 * Ijro: pnpm --filter api test:e2e
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/infra/config';
import { PrismaService } from '../src/infra/prisma.service';
import { configureApp } from '../src/setup';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const MP4 = Buffer.from('00000018667479706d703432', 'hex');

const tag = randomBytes(3).toString('hex');
const name = (n: string) => `e2e_${tag}_${n}`;
const PASSWORD = 'password123';

describe('API (Spec 12)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  const http = () => request(app.getHttpServer());
  const users: Record<string, { id: string; token: string }> = {};

  function register(userName: string) {
    return http()
      .post('/Account/register')
      .set('x-forwarded-for', `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
      .send({ userName, fullName: 'E2E', email: `${userName.toLowerCase()}@test.tj`, password: PASSWORD, confirmPassword: PASSWORD });
  }

  async function login(userName: string) {
    const res = await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200);
    return res.body.data as string;
  }

  const auth = (who: string) => ({ Authorization: `Bearer ${users[who]!.token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);

    for (const who of ['a', 'b', 'c']) {
      await register(name(who)).expect(200);
      const token = await login(name(who));
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { userName: { startsWith: `e2e_${tag}` } } });
    await app.close();
  });

  describe('Account', () => {
    it('AC1: username lowercase meshavad; ALI-i takrori → 409', async () => {
      const upper = name('Ali').replace('e2e_', 'E2E_');
      const res = await register(upper).expect(200);
      expect(res.body).toEqual({ data: 'User registered', errors: [], statusCode: 200 });
      const u = await prisma.user.findUnique({ where: { userName: upper.toLowerCase() } });
      expect(u).not.toBeNull();
      const dup = await http()
        .post('/Account/register')
        .send({ userName: upper.toUpperCase(), fullName: 'X', email: `other_${tag}@test.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(409);
      expect(dup.body.code).toBe('USERNAME_TAKEN');
    });

    it('2 register-i parallel → faqat 1 user', async () => {
      const n = name('race');
      const [r1, r2] = await Promise.all([register(n), register(n)]);
      expect([r1.status, r2.status].sort()).toEqual([200, 409]);
      expect(await prisma.user.count({ where: { userName: n } })).toBe(1);
    });

    it('username-i reserved → 400, parolhoi nomos → 400', async () => {
      const r = await http().post('/Account/register').send({ userName: 'explore', fullName: 'X', email: `ex_${tag}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD });
      expect(r.status).toBe(400);
      expect(r.body.code).toBe('USERNAME_RESERVED');
      const m = await http().post('/Account/register').send({ userName: name('mm'), fullName: 'X', email: `mm_${tag}@t.tj`, password: PASSWORD, confirmPassword: 'other1234' });
      expect(m.status).toBe(400);
      expect(m.body.code).toBe('PASSWORDS_DO_NOT_MATCH');
    });

    it('AC2: parol-i galat → 401, bidun token → 401', async () => {
      const r = await http().post('/Account/login').send({ userName: name('a'), password: 'wrongpass' }).expect(401);
      expect(r.body.code).toBe('INVALID_CREDENTIALS');
      await http().get('/UserProfile/get-my-profile').expect(401);
    });

    it('ChangePassword va ForgotPassword/ResetPassword', async () => {
      await http().put('/Account/ChangePassword').query({ OldPassword: 'bad', Password: 'newpass123', ConfirmPassword: 'newpass123' }).set(auth('c')).expect(400);
      await http().put('/Account/ChangePassword').query({ OldPassword: PASSWORD, Password: 'newpass123', ConfirmPassword: 'newpass123' }).set(auth('c')).expect(200);
      await http().post('/Account/login').send({ userName: name('c'), password: 'newpass123' }).expect(200);
      const f = await http().delete('/Account/ForgotPassword').query({ Email: `${name('c')}@test.tj` }).expect(200);
      expect(f.body.data).toBe('Code sent');
      await http().delete('/Account/ResetPassword').query({ Token: 'wrong', Email: `${name('c')}@test.tj`, Password: PASSWORD, ConfirmPassword: PASSWORD }).expect(400);
    });

    it('AC8: passwordHash dar javob nest', async () => {
      const r = await http().get('/User/get-users').query({ UserName: `e2e_${tag}` }).set(auth('a')).expect(200);
      expect(JSON.stringify(r.body)).not.toMatch(/password/i);
      expect(r.body.totalRecord).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Follow va profil', () => {
    it('follow 2 bor → counter 1; ba xud → 400', async () => {
      const q = { followingUserId: users.b!.id };
      await http().post('/FollowingRelationShip/add-following-relation-ship').query(q).set(auth('a')).expect(200);
      const r = await http().post('/FollowingRelationShip/add-following-relation-ship').query(q).set(auth('a')).expect(200);
      expect(r.body.data).toEqual({ isFollowing: true, isRequested: false, subscribersCount: 1 });
      await http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users.a!.id }).set(auth('a')).expect(400);
      const subs = await http().get('/FollowingRelationShip/get-subscribers').query({ UserId: users.b!.id }).set(auth('a')).expect(200);
      expect(subs.body.data.map((u: { id: string }) => u.id)).toEqual([users.a!.id]);
      const is = await http().get('/UserProfile/get-is-follow-user-profile-by-id').query({ followingUserId: users.b!.id }).set(auth('a')).expect(200);
      expect(is.body.data).toBe(true);
      const p = await http().get('/UserProfile/get-user-profile-by-id').query({ id: users.a!.id }).set(auth('b')).expect(200);
      expect(p.body.data.subscriptionsCount).toBe(1);
    });

    it('update-user-profile va avatar', async () => {
      const r = await http().put('/UserProfile/update-user-profile').send({ about: 'Dushanbe', gender: 1 }).set(auth('a')).expect(200);
      expect(r.body.data).toMatchObject({ about: 'Dushanbe', gender: 1 });
      const img = await http().put('/UserProfile/update-user-image-profile').attach('imageFile', PNG, { filename: 'a.png', contentType: 'image/png' }).set(auth('a')).expect(200);
      expect(img.body.data.image).toMatch(/\.png$/);
      await http().get(`/images/${img.body.data.image}`).expect(200);
      await http().put('/UserProfile/update-user-image-profile').attach('imageFile', Buffer.from('%PDF'), { filename: 'a.pdf', contentType: 'application/pdf' }).set(auth('a')).expect(400);
    });

    it('search history', async () => {
      await http().post('/User/add-search-history').query({ Text: 'pomir' }).set(auth('a')).expect(200);
      await http().post('/User/add-user-search-history').query({ UserSearchId: users.b!.id }).set(auth('a')).expect(200);
      const h = await http().get('/User/get-user-search-histories').set(auth('a')).expect(200);
      expect(h.body.data[0].users.id).toBe(users.b!.id);
      await http().delete('/User/delete-search-histories').set(auth('a')).expect(200);
      const s = await http().get('/User/get-search-histories').set(auth('a')).expect(200);
      expect(s.body.data).toEqual([]);
    });
  });

  describe('Post', () => {
    let postId: number;

    it('add-post bo 2 aks; 11 fayl → 400; 1 video → isReel', async () => {
      const r = await http()
        .post('/Post/add-post')
        .field('Title', 'Pomir')
        .field('Content', 'Kuhho #Tajikistan')
        .attach('Images', PNG, { filename: '1.png', contentType: 'image/png' })
        .attach('Images', PNG, { filename: '2.png', contentType: 'image/png' })
        .set(auth('b'))
        .expect(200);
      postId = r.body.data.postId;
      expect(r.body.data).toMatchObject({ userId: users.b!.id, isReel: false, postLikeCount: 0 });
      expect(r.body.data.images).toHaveLength(2);
      expect(await prisma.hashtag.findUnique({ where: { name: 'tajikistan' } })).not.toBeNull();

      let many = http().post('/Post/add-post').set(auth('b'));
      for (let i = 0; i < 11; i++) many = many.attach('Images', PNG, { filename: `${i}.png`, contentType: 'image/png' });
      expect((await many).status).toBe(400);

      const reel = await http().post('/Post/add-post').attach('Images', MP4, { filename: 'r.mp4', contentType: 'video/mp4' }).set(auth('b')).expect(200);
      expect(reel.body.data.isReel).toBe(true);
      const reels = await http().get('/Post/get-reels').set(auth('a')).expect(200);
      expect(reels.body.data.every((p: { isReel: boolean }) => p.isReel)).toBe(true);
    });

    it('AC4: like toggle; parallel like-ho counter-ro vayron namekunand', async () => {
      const like = () => http().post('/Post/like-post').query({ postId }).set(auth('a'));
      expect((await like()).body.data).toEqual({ isLiked: true, likeCount: 1 });
      expect((await like()).body.data).toEqual({ isLiked: false, likeCount: 0 });
      await Promise.all([like(), like(), like(), like()]);
      const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });
      const real = await prisma.postLike.count({ where: { postId } });
      expect(post.likeCount).toBe(real);
      expect(real).toBeLessThanOrEqual(1);
    });

    it('view, comment, favorite, feed', async () => {
      await http().post('/Post/view-post').query({ postId }).set(auth('a')).expect(200);
      const v = await http().post('/Post/view-post').query({ postId }).set(auth('a')).expect(200);
      expect(v.body.data.viewCount).toBe(1);

      const c = await http().post('/Post/add-comment').send({ postId, comment: 'Zebo!' }).set(auth('a')).expect(200);
      expect(c.body.data).toMatchObject({ postId, comment: 'Zebo!', userId: users.a!.id });
      await http().delete('/Post/delete-comment').query({ commentId: c.body.data.postCommentId }).set(auth('c')).expect(403);

      const f = await http().post('/Post/add-post-favorite').send({ postId }).set(auth('a')).expect(200);
      expect(f.body.data.isFavorite).toBe(true);
      const favs = await http().get('/UserProfile/get-post-favorites').set(auth('a')).expect(200);
      expect(favs.body.data.map((p: { postId: number }) => p.postId)).toContain(postId);

      // a → b follow kardaast: feed-i a posthoi b-ro dorad, feed-i c — ne
      const feedA = await http().get('/Post/get-following-post').set(auth('a')).expect(200);
      expect(feedA.body.data.map((p: { postId: number }) => p.postId)).toContain(postId);
      const feedC = await http().get('/Post/get-following-post').set(auth('c')).expect(200);
      expect(feedC.body.data.map((p: { postId: number }) => p.postId)).not.toContain(postId);

      const one = await http().get('/Post/get-post-by-id').query({ id: postId }).set(auth('a')).expect(200);
      expect(one.body.data).toMatchObject({ commentCount: 1, postFavorite: true, postView: 1 });
    });

    it('AC5: hazfi posti begona → 403; muallif → 200', async () => {
      await http().delete('/Post/delete-post').query({ id: postId }).set(auth('a')).expect(403);
      await http().delete('/Post/delete-post').query({ id: postId }).set(auth('b')).expect(200);
      await http().get('/Post/get-post-by-id').query({ id: postId }).set(auth('a')).expect(404);
    });
  });

  describe('Story', () => {
    it('AC7: tray faqat follow-shudaho va story-i zinda', async () => {
      await http().post('/Story/AddStories').attach('Image', PNG, { filename: 's.png', contentType: 'image/png' }).set(auth('b')).expect(200);
      await http().post('/Story/AddStories').attach('Image', PNG, { filename: 's.png', contentType: 'image/png' }).set(auth('c')).expect(200);
      const old = await prisma.story.create({ data: { userId: users.b!.id, fileName: 'old.png', expiresAt: new Date(Date.now() - 1000) } });

      const tray = await http().get('/Story/get-stories').set(auth('a')).expect(200);
      const ids = tray.body.data.map((u: { userId: string }) => u.userId);
      expect(ids).toContain(users.b!.id);
      expect(ids).not.toContain(users.c!.id);
      const b = tray.body.data.find((u: { userId: string }) => u.userId === users.b!.id);
      expect(b.hasUnseen).toBe(true);
      expect(b.stories.map((s: { id: number }) => s.id)).not.toContain(old.id);

      const storyId = b.stories[0].id;
      await http().post('/Story/add-story-view').query({ StoryId: storyId }).set(auth('a')).expect(200);
      await http().post('/Story/add-story-view').query({ StoryId: storyId }).set(auth('a')).expect(200);
      const like = await http().post('/Story/LikeStory').query({ storyId }).set(auth('a')).expect(200);
      expect(like.body.data).toBe('Liked');
      const after = await http().get(`/Story/get-user-stories/${users.b!.id}`).set(auth('a')).expect(200);
      expect(after.body.data.hasUnseen).toBe(false);
      expect(after.body.data.stories[0].viewerDto.viewCount).toBeNull();
      const mine = await http().get('/Story/get-my-stories').set(auth('b')).expect(200);
      expect(mine.body.data.stories[0].viewerDto).toMatchObject({ viewCount: 1, viewLike: 1 });

      await http().delete('/Story/DeleteStory').query({ id: storyId }).set(auth('a')).expect(403);
      await http().delete('/Story/DeleteStory').query({ id: storyId }).set(auth('b')).expect(200);
    });
  });

  describe('Chat', () => {
    it('AC6: yak chat baroi jufti user; begona → 403; socket paymro merasonad', async () => {
      const c1 = await http().post('/Chat/create-chat').query({ receiverUserId: users.b!.id }).set(auth('a')).expect(200);
      const c2 = await http().post('/Chat/create-chat').query({ receiverUserId: users.a!.id }).set(auth('b')).expect(200);
      expect(c1.body.data).toBe(c2.body.data);
      const chatId = c1.body.data as number;
      await http().get('/Chat/get-chat-by-id').query({ chatId }).set(auth('c')).expect(403);

      // Tokeni galat va JWT-i asosi (ne ticket) → qat'
      for (const token of ['bad', users.b!.token]) {
        const bad: Socket = io(baseUrl, { path: '/ws', auth: { token }, transports: ['websocket'], reconnection: false });
        await new Promise<void>((resolve) => bad.on('disconnect', () => resolve()));
      }

      const ticketRes = await http().post('/Account/ws-ticket').set(auth('b')).expect(200);
      const ticket = ticketRes.body.data as string;
      // Ticket baroi HTTP qabul nameshavad
      await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${ticket}`).expect(401);

      const sock: Socket = io(baseUrl, { path: '/ws', auth: { token: ticket }, transports: ['websocket'] });
      await new Promise<void>((resolve) => sock.on('connect', () => resolve()));
      const received = new Promise<{ messageText: string }>((resolve) => sock.on('message:new', resolve));

      const sent = await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('MessageText', 'Salom').set(auth('a')).expect(200);
      expect(sent.body.data).toMatchObject({ chatId, messageText: 'Salom', userId: users.a!.id });
      expect((await received).messageText).toBe('Salom');
      sock.close();

      const chats = await http().get('/Chat/get-chats').set(auth('b')).expect(200);
      expect(chats.body.data[0]).toMatchObject({ chatId, lastMessage: { messageText: 'Salom' } });
      await http().delete('/Chat/delete-message').query({ massageId: sent.body.data.messageId }).set(auth('b')).expect(403);
      await http().delete('/Chat/delete-message').query({ massageId: sent.body.data.messageId }).set(auth('a')).expect(200);
      await http().delete('/Chat/delete-chat').query({ chatId }).set(auth('b')).expect(200);
    });
  });

  describe('Location', () => {
    it('CRUD', async () => {
      const r = await http().post('/Location/add-Location').send({ city: 'Dushanbe', state: 'DRS', zipCode: '734000', country: 'Tajikistan' }).set(auth('a')).expect(200);
      const id = r.body.data.locationId;
      await http().put('/Location/update-Location').send({ locationId: id, city: 'Khujand', state: 'Sughd', zipCode: '735700', country: 'Tajikistan' }).set(auth('a')).expect(200);
      const list = await http().get('/Location/get-Locations').query({ City: 'khuj' }).set(auth('a')).expect(200);
      expect(list.body.data.map((l: { locationId: number }) => l.locationId)).toContain(id);
      await http().delete('/Location/delete-Location').query({ id }).set(auth('a')).expect(200);
      await http().get('/Location/get-Location-by-id').query({ id }).set(auth('a')).expect(404);
    });
  });

  it('rate limit: 6 login dar 1 daqiqa → 429', async () => {
    const ip = '10.99.99.99';
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await http().post('/Account/login').set('x-forwarded-for', ip).send({ userName: name('a'), password: 'wrongpass' });
      codes.push(r.status);
    }
    expect(codes.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(codes[5]).toBe(429);
  });

  it('health → ok', async () => {
    const r = await http().get('/health').expect(200);
    expect(r.body.db).toBe('up');
  });
});
