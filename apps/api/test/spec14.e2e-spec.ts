/**
 * e2e baroi AC-hoi Spec 14 (funksiyahoi purrai Instagram): private, block, restrict, comment like, mention,
 * archive, pin, close friends, highlights, group chat, like-i paym.
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
const tag = randomBytes(3).toString('hex');
const name = (n: string) => `s14_${tag}_${n}`;
const PASSWORD = 'password123';

describe('API (Spec 14)', () => {
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
  async function story(who: string, closeFriends = false) {
    await http().post('/Story/AddStories').query({ CloseFriends: String(closeFriends) }).attach('Image', PNG, { filename: 's.png', contentType: 'image/png' }).set(auth(who)).expect(200);
    const mine = (await http().get('/Story/get-my-stories').set(auth(who)).expect(200)).body.data;
    return mine.stories[mine.stories.length - 1].id as number;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    for (const who of ['a', 'b', 'c', 'd']) {
      const userName = name(who);
      await http()
        .post('/Account/register')
        .set('x-forwarded-for', `10.14.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
        .send({ userName, fullName: 'S14', email: `${userName}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(200);
      const token = (await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200)).body.data as string;
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await prisma.user.deleteMany({ where: { userName: { startsWith: `s14_${tag}` } } });
    await app.close();
  });

  it('AC1: private → darxost, postho xoli; accept → namoyon', async () => {
    const r = await http().put('/UserProfile/update-privacy').send({ isPrivate: true }).set(auth('b')).expect(200);
    expect(r.body.data.isPrivate).toBe(true);
    await post('b', 'Private post');
    const f = await follow('a', 'b');
    expect(f.body.data).toMatchObject({ isFollowing: false, isRequested: true });
    expect((await http().get('/UserProfile/get-follow-status').query({ userId: users.b!.id }).set(auth('a'))).body.data).toBe('requested');
    expect((await http().get('/Post/get-posts').query({ UserId: users.b!.id }).set(auth('a'))).body.data).toHaveLength(0);

    const reqs = (await http().get('/FollowingRelationShip/get-follow-requests').set(auth('b')).expect(200)).body.data;
    expect(reqs.map((u: { id: string }) => u.id)).toEqual([users.a!.id]);
    await http().post('/FollowingRelationShip/accept-follow-request').query({ userId: users.a!.id }).set(auth('b')).expect(200);
    expect((await http().get('/Post/get-posts').query({ UserId: users.b!.id }).set(auth('a'))).body.data).toHaveLength(1);
    const notifs = (await http().get('/Notification/get-notifications').set(auth('a'))).body.data;
    expect(notifs.some((n: { type: string }) => n.type === 'FOLLOW_ACCEPTED')).toBe(true);
    await http().put('/UserProfile/update-privacy').send({ isPrivate: false }).set(auth('b')).expect(200);
  });

  it('AC2: block → follow-i har du taraf nest, profil 404, paym 403', async () => {
    await follow('c', 'd');
    await follow('d', 'c');
    await http().post('/User/block-user').query({ userId: users.d!.id }).set(auth('c')).expect(200);
    expect(await prisma.follow.count({ where: { OR: [{ followerId: users.c!.id, followingId: users.d!.id }, { followerId: users.d!.id, followingId: users.c!.id }] } })).toBe(0);
    await http().get('/UserProfile/get-user-profile-by-id').query({ id: users.c!.id }).set(auth('d')).expect(404);
    await http().post('/Chat/create-chat').query({ receiverUserId: users.c!.id }).set(auth('d')).expect(403);
    await http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users.c!.id }).set(auth('d')).expect(403);
    const blocked = (await http().get('/User/get-blocked-users').set(auth('c'))).body.data;
    expect(blocked.map((u: { id: string }) => u.id)).toEqual([users.d!.id]);
    const status = (await http().get('/User/get-relation-status').query({ userId: users.d!.id }).set(auth('c'))).body.data;
    expect(status.isBlocked).toBe(true);
    await http().delete('/User/unblock-user').query({ userId: users.d!.id }).set(auth('c')).expect(200);
    await http().get('/UserProfile/get-user-profile-by-id').query({ id: users.c!.id }).set(auth('d')).expect(200);
  });

  it('AC3: comment-i restrict-shuda baroi user-i seyum namoyon nest', async () => {
    const postId = await post('a', 'Restrict test');
    await http().post('/User/restrict-user').query({ userId: users.c!.id }).set(auth('a')).expect(200);
    await http().post('/Post/add-comment').send({ postId, comment: 'restricted' }).set(auth('c')).expect(200);
    const get = (who: string) => http().get('/Post/get-comments').query({ postId }).set(auth(who)).expect(200);
    expect((await get('d')).body.data).toHaveLength(0);
    expect((await get('c')).body.data).toHaveLength(1);
    const own = (await get('a')).body.data;
    expect(own[0]).toMatchObject({ isRestricted: true });
  });

  it('AC4: like-i comment toggle; @mention → notification MENTION', async () => {
    const postId = await post('a', `Salom @${name('b')}`);
    const c = (await http().post('/Post/add-comment').send({ postId, comment: `@${name('d')} bin` }).set(auth('b')).expect(200)).body.data;
    let r = await http().post('/Post/like-comment').query({ commentId: c.postCommentId }).set(auth('a')).expect(200);
    expect(r.body.data).toEqual({ isLiked: true, likeCount: 1 });
    const list = (await http().get('/Post/get-comments').query({ postId }).set(auth('a'))).body.data;
    expect(list[0]).toMatchObject({ isLiked: true, likeCount: 1 });
    r = await http().post('/Post/like-comment').query({ commentId: c.postCommentId }).set(auth('a')).expect(200);
    expect(r.body.data).toEqual({ isLiked: false, likeCount: 0 });
    expect(await prisma.notification.count({ where: { recipientId: users.b!.id, type: 'MENTION' } })).toBe(1);
    expect(await prisma.notification.count({ where: { recipientId: users.d!.id, type: 'MENTION' } })).toBe(1);
  });

  it('AC5–AC6: archive pinhon mekunad; pin-i 4-um → PIN_LIMIT; tag, location, edit', async () => {
    const ids = [await post('d', 'p1'), await post('d', 'p2'), await post('d', 'p3'), await post('d', 'p4')];
    await http().post('/Post/archive-post').query({ postId: ids[0] }).set(auth('d')).expect(200);
    const profile = (await http().get('/Post/get-posts').query({ UserId: users.d!.id }).set(auth('a'))).body.data;
    expect(profile.map((p: { postId: number }) => p.postId)).not.toContain(ids[0]);
    const archived = (await http().get('/Post/get-archived-posts').set(auth('d'))).body.data;
    expect(archived.map((p: { postId: number }) => p.postId)).toEqual([ids[0]]);
    await http().get('/Post/get-post-by-id').query({ id: ids[0] }).set(auth('a')).expect(404);

    for (const id of ids.slice(1)) await http().post('/Post/pin-post').query({ postId: id }).set(auth('d')).expect(200);
    await http().post('/Post/archive-post').query({ postId: ids[0] }).set(auth('d')).expect(200);
    const res = await http().post('/Post/pin-post').query({ postId: ids[0] }).set(auth('d')).expect(400);
    expect(res.body.errors[0]).toBeDefined();
    const pinnedFirst = (await http().get('/Post/get-posts').query({ UserId: users.d!.id }).set(auth('d'))).body.data;
    expect(pinnedFirst.slice(0, 3).every((p: { isPinned: boolean }) => p.isPinned)).toBe(true);

    const tagged = await http()
      .post('/Post/add-post')
      .field('Content', 'Tag test')
      .field('Location', 'Dushanbe')
      .field('Tags', JSON.stringify([{ userName: name('a'), x: 0.5, y: 0.5, imageIndex: 0 }]))
      .attach('Images', PNG, { filename: 'a.png', contentType: 'image/png' })
      .set(auth('d'))
      .expect(200);
    expect(tagged.body.data).toMatchObject({ location: 'Dushanbe', tags: [{ userId: users.a!.id, x: 0.5 }] });
    const taggedList = (await http().get('/Post/get-tagged-posts').query({ UserId: users.a!.id }).set(auth('b'))).body.data;
    expect(taggedList.map((p: { postId: number }) => p.postId)).toContain(tagged.body.data.postId);
    const loc = (await http().get('/Post/get-location-posts').query({ Name: 'dushanbe' }).set(auth('b'))).body.data;
    expect(loc.length).toBeGreaterThanOrEqual(1);

    const edited = await http()
      .put('/Post/update-post')
      .send({ postId: tagged.body.data.postId, content: 'Nav #edited', commentsDisabled: true, hideLikeCount: true })
      .set(auth('d'))
      .expect(200);
    expect(edited.body.data).toMatchObject({ content: 'Nav #edited', commentsDisabled: true, hideLikeCount: true });
    await http().post('/Post/add-comment').send({ postId: tagged.body.data.postId, comment: 'x' }).set(auth('a')).expect(403);
    await http().put('/Post/update-post').send({ postId: tagged.body.data.postId, content: 'x' }).set(auth('a')).expect(403);
  });

  it('collections: add → post saved; ruyxat va postho', async () => {
    const postId = await post('b', 'Collection test');
    const col = (await http().post('/Collection/add-collection').send({ name: 'Safar' }).set(auth('a')).expect(200)).body.data;
    await http().post('/Collection/add-to-collection').send({ collectionId: col.id, postId }).set(auth('a')).expect(200);
    const list = (await http().get('/Collection/get-collections').set(auth('a'))).body.data;
    expect(list[0]).toMatchObject({ name: 'Safar', postsCount: 1 });
    const posts = (await http().get('/Collection/get-collection-posts').query({ collectionId: col.id }).set(auth('a'))).body.data;
    expect(posts[0]).toMatchObject({ postId, postFavorite: true });
    await http().get('/Collection/get-collection-posts').query({ collectionId: col.id }).set(auth('b')).expect(404);
  });

  it('AC7–AC8: story-i close friends; highlights; javob ba story → Direct', async () => {
    await follow('b', 'a');
    await follow('c', 'a');
    await http().post('/User/add-close-friend').query({ userId: users.b!.id }).set(auth('a')).expect(200);
    const sid = await story('a', true);
    const ofB = (await http().get(`/Story/get-user-stories/${users.a!.id}`).set(auth('b'))).body.data;
    const ofC = (await http().get(`/Story/get-user-stories/${users.a!.id}`).set(auth('c'))).body.data;
    expect(ofB.stories.map((s: { id: number }) => s.id)).toContain(sid);
    expect(ofB.hasCloseFriends).toBe(true);
    expect(ofC.stories.map((s: { id: number }) => s.id)).not.toContain(sid);

    const normal = await story('a');
    await prisma.story.update({ where: { id: normal }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const hid = (await http().post('/Highlight/add-highlight').send({ title: 'Safar', storyIds: [normal] }).set(auth('a')).expect(200)).body.data;
    const hl = (await http().get('/Highlight/get-highlights').query({ UserId: users.a!.id }).set(auth('c'))).body.data;
    expect(hl[0]).toMatchObject({ id: hid, title: 'Safar', storiesCount: 1 });
    const hs = (await http().get('/Highlight/get-highlight-stories').query({ id: hid }).set(auth('c'))).body.data;
    expect(hs.map((s: { id: number }) => s.id)).toEqual([normal]);
    await http().post('/Highlight/add-highlight').send({ title: 'x', storyIds: [normal] }).set(auth('c')).expect(403);
    const archive = (await http().get('/Story/get-story-archive').set(auth('a'))).body.data;
    expect(archive.length).toBeGreaterThanOrEqual(2);

    const reply = (await http().post('/Story/reply-story').send({ storyId: sid, text: 'Zebo!' }).set(auth('b')).expect(200)).body.data;
    expect(reply).toMatchObject({ messageText: 'Zebo!', story: { storyId: sid } });
  });

  it('AC9–AC10: group chat — paym ba hama; like-i paym → message:updated; reply; audio', async () => {
    const chatId = (await http().post('/Chat/create-group').send({ title: 'Dustho', userIds: [users.b!.id, users.c!.id] }).set(auth('a')).expect(200))
      .body.data as number;
    const [sb, sc] = [await connect('b'), await connect('c')];
    const inB = next<{ messageText: string }>(sb, 'message:new');
    const inC = next<{ messageText: string }>(sc, 'message:new');
    const m = (await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('MessageText', 'Salom hama').set(auth('a')).expect(200)).body.data;
    expect((await inB).messageText).toBe('Salom hama');
    expect((await inC).messageText).toBe('Salom hama');

    const chats = (await http().get('/Chat/get-chats').set(auth('b'))).body.data;
    const g = chats.find((c: { chatId: number }) => c.chatId === chatId);
    expect(g).toMatchObject({ isGroup: true, title: 'Dustho', unreadCount: 1 });
    expect(g.members).toHaveLength(3);

    const upd = next<{ likes: string[] }>(sb, 'message:updated');
    await http().post('/Chat/like-message').query({ messageId: m.messageId }).set(auth('c')).expect(200);
    expect((await upd).likes).toEqual([users.c!.id]);

    const r = await http()
      .put('/Chat/send-message')
      .field('ChatId', String(chatId))
      .field('ReplyToMessageId', String(m.messageId))
      .attach('File', Buffer.from('OggS-fake-audio'), { filename: 'v.weba', contentType: 'audio/webm' })
      .set(auth('b'))
      .expect(200);
    expect(r.body.data).toMatchObject({ fileType: 'audio', replyTo: { messageId: m.messageId } });

    await http().delete('/Chat/leave-group').query({ chatId }).set(auth('c')).expect(200);
    await http().get('/Chat/get-chat-by-id').query({ chatId }).set(auth('c')).expect(403);
    await http().get('/Chat/get-chat-by-id').query({ chatId }).set(auth('d')).expect(403);
  });

  it('mute: postho dar feed nestand; report — yak satr', async () => {
    await follow('d', 'b');
    const postId = await post('b', 'Mute test');
    const feed = async () => (await http().get('/Post/get-following-post').set(auth('d'))).body.data.map((p: { postId: number }) => p.postId);
    expect(await feed()).toContain(postId);
    await http().post('/User/mute-user').query({ userId: users.b!.id, Posts: 'true', Stories: 'false' }).set(auth('d')).expect(200);
    expect(await feed()).not.toContain(postId);
    await http().post('/Report/add-report').send({ targetType: 'POST', targetId: String(postId), reason: 'spam' }).set(auth('d')).expect(200);
    await http().post('/Report/add-report').send({ targetType: 'POST', targetId: String(postId), reason: 'spam 2' }).set(auth('d')).expect(200);
    expect(await prisma.report.count({ where: { userId: users.d!.id } })).toBe(1);
  });
});
