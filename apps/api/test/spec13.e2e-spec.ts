/**
 * e2e baroi AC-hoi Spec 13 (ilovaho ba Spec 12): notifications, explore, hashtag, replies, Direct (Seen, unread, typing, share).
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
const name = (n: string) => `s13_${tag}_${n}`;
const PASSWORD = 'password123';

describe('API (Spec 13)', () => {
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

  async function post(who: string, content: string) {
    const r = await http().post('/Post/add-post').field('Content', content).attach('Images', PNG, { filename: 'a.png', contentType: 'image/png' }).set(auth(who)).expect(200);
    return r.body.data.postId as number;
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
        .set('x-forwarded-for', `10.13.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
        .send({ userName, fullName: 'S13', email: `${userName}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(200);
      const token = (await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200)).body.data as string;
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await prisma.user.deleteMany({ where: { userName: { startsWith: `s13_${tag}` } } });
    await app.close();
  });

  it('AC1/AC2: like → notification:new realtime; unlike → nest; xud → nest; read-all → 0', async () => {
    const postId = await post('b', 'Notif test');
    const sock = await connect('b');
    const incoming = next<{ type: string; actor: { id: string }; post: { postId: number } }>(sock, 'notification:new');
    await http().post('/Post/like-post').query({ postId }).set(auth('a')).expect(200);
    const n = await incoming;
    expect(n).toMatchObject({ type: 'LIKE', actor: { id: users.a!.id }, post: { postId } });

    let list = (await http().get('/Notification/get-notifications').set(auth('b')).expect(200)).body;
    expect(list.data.filter((x: { type: string }) => x.type === 'LIKE')).toHaveLength(1);
    expect((await http().get('/Notification/get-unread-count').set(auth('b'))).body.data.count).toBeGreaterThanOrEqual(1);

    // unlike → hazf; like-i dubora → baz yak (takror nest)
    await http().post('/Post/like-post').query({ postId }).set(auth('a')).expect(200);
    list = (await http().get('/Notification/get-notifications').set(auth('b')).expect(200)).body;
    expect(list.data.filter((x: { type: string }) => x.type === 'LIKE')).toHaveLength(0);
    await http().post('/Post/like-post').query({ postId }).set(auth('a')).expect(200);
    await http().post('/Post/like-post').query({ postId }).set(auth('a')).expect(200);
    await http().post('/Post/like-post').query({ postId }).set(auth('a')).expect(200);
    list = (await http().get('/Notification/get-notifications').set(auth('b')).expect(200)).body;
    expect(list.data.filter((x: { type: string }) => x.type === 'LIKE')).toHaveLength(1);

    // like-i posti xud → nest
    await http().post('/Post/like-post').query({ postId }).set(auth('b')).expect(200);
    expect(await prisma.notification.count({ where: { actorId: users.b!.id } })).toBe(0);

    await http().put('/Notification/read-all').set(auth('b')).expect(200);
    expect((await http().get('/Notification/get-unread-count').set(auth('b'))).body.data.count).toBe(0);
  });

  it('follow → FOLLOW bo isFollowing (Follow back), unfollow → hazf', async () => {
    await http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users.c!.id }).set(auth('a')).expect(200);
    let list = (await http().get('/Notification/get-notifications').set(auth('c')).expect(200)).body.data;
    expect(list[0]).toMatchObject({ type: 'FOLLOW', actor: { id: users.a!.id, isFollowing: false }, post: null });
    await http().delete('/FollowingRelationShip/delete-following-relation-ship').query({ followingUserId: users.c!.id }).set(auth('a')).expect(200);
    list = (await http().get('/Notification/get-notifications').set(auth('c')).expect(200)).body.data;
    expect(list.filter((x: { type: string }) => x.type === 'FOLLOW')).toHaveLength(0);
  });

  it('AC5: replies — 1 sath, get-comments/replies, hazf bo javobho, notifications', async () => {
    const postId = await post('b', 'Replies');
    const top = (await http().post('/Post/add-comment').send({ postId, comment: 'Avval' }).set(auth('a')).expect(200)).body.data;
    expect(top).toMatchObject({ parentId: null, replyCount: 0 });
    const r1 = (await http().post('/Post/add-comment').send({ postId, comment: 'Javob 1', parentId: top.postCommentId }).set(auth('c')).expect(200)).body.data;
    await http().post('/Post/add-comment').send({ postId, comment: 'Javob 2', parentId: top.postCommentId }).set(auth('b')).expect(200);
    // Reply ba reply → 400
    const bad = await http().post('/Post/add-comment').send({ postId, comment: 'x', parentId: r1.postCommentId }).set(auth('a')).expect(400);
    expect(bad.body.code).toBe('INVALID_PARENT_COMMENT');

    const comments = (await http().get('/Post/get-comments').query({ postId }).set(auth('a')).expect(200)).body;
    expect(comments.totalRecord).toBe(1);
    expect(comments.data[0]).toMatchObject({ postCommentId: top.postCommentId, replyCount: 2 });
    const replies = (await http().get('/Post/get-comment-replies').query({ commentId: top.postCommentId }).set(auth('a')).expect(200)).body.data;
    expect(replies.map((r: { comment: string }) => r.comment)).toEqual(['Javob 1', 'Javob 2']);

    // Notification: COMMENT ba b, COMMENT_REPLY ba a (az c)
    const nb = (await http().get('/Notification/get-notifications').set(auth('b')).expect(200)).body.data;
    expect(nb.some((n: { type: string; commentText: string }) => n.type === 'COMMENT' && n.commentText === 'Avval')).toBe(true);
    const na = (await http().get('/Notification/get-notifications').set(auth('a')).expect(200)).body.data;
    expect(na.some((n: { type: string }) => n.type === 'COMMENT_REPLY')).toBe(true);

    let p = (await http().get('/Post/get-post-by-id').query({ id: postId }).set(auth('a')).expect(200)).body.data;
    expect(p.commentCount).toBe(3);
    expect(p.comments).toHaveLength(1);
    await http().delete('/Post/delete-comment').query({ commentId: top.postCommentId }).set(auth('a')).expect(200);
    p = (await http().get('/Post/get-post-by-id').query({ id: postId }).set(auth('a')).expect(200)).body.data;
    expect(p.commentCount).toBe(0);
    const left = (await http().get('/Notification/get-notifications').set(auth('a')).expect(200)).body.data;
    expect(left.some((n: { type: string }) => n.type === 'COMMENT_REPLY')).toBe(false);
  });

  it('AC3/AC4: explore bidun xud va follow-shudaho; hashtag search va posts', async () => {
    await http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users.b!.id }).set(auth('a')).expect(200);
    const cPost = await post('c', `Kuhho #Pamir${tag}`);
    const bPost = await post('b', 'az b');
    const aPost = await post('a', 'az a');
    // Hamai sahifaho (tartib — populyarnoki, posti nav dar oxir)
    const all: { postId: number; userId: string; postLikeCount: number; commentCount: number }[] = [];
    for (let page = 1; ; page++) {
      const r = (await http().get('/Post/get-explore-posts').query({ PageSize: 50, PageNumber: page }).set(auth('a')).expect(200)).body;
      all.push(...r.data);
      if (page >= r.totalPage) break;
    }
    const ids = all.map((x) => x.postId);
    expect(ids).toContain(cPost);
    expect(ids).not.toContain(bPost);
    expect(ids).not.toContain(aPost);
    expect(new Set(ids).size).toBe(ids.length);
    expect(all.every((x) => x.userId !== users.a!.id && x.userId !== users.b!.id)).toBe(true);
    const scores = all.map((x) => x.postLikeCount + 2 * x.commentCount);
    expect(scores).toEqual([...scores].sort((p, q) => q - p));

    const found = (await http().get('/Hashtag/search').query({ Query: `#PAMIR${tag}` }).set(auth('a')).expect(200)).body.data;
    expect(found).toEqual([{ name: `pamir${tag}`, postsCount: 1 }]);
    const tagged = (await http().get('/Hashtag/get-posts').query({ Name: `pamir${tag}` }).set(auth('a')).expect(200)).body;
    expect(tagged.data.map((x: { postId: number }) => x.postId)).toEqual([cPost]);
  });

  it('suggestions: na xud, na follow-shudaho', async () => {
    const s = (await http().get('/User/get-suggestions').query({ Limit: 30 }).set(auth('a')).expect(200)).body.data;
    const ids = s.map((u: { id: string }) => u.id);
    expect(ids).not.toContain(users.a!.id);
    expect(ids).not.toContain(users.b!.id);
    expect(s.length).toBeGreaterThan(0);
  });

  it('AC6/AC7/AC8: unread, read-chat → Seen, typing, share post', async () => {
    const chatId = (await http().post('/Chat/create-chat').query({ receiverUserId: users.b!.id }).set(auth('a')).expect(200)).body.data as number;
    const sockA = await connect('a');
    const sockB = await connect('b');
    const sockC = await connect('c');

    await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('MessageText', 'Salom').set(auth('a')).expect(200);
    let chatsB = (await http().get('/Chat/get-chats').set(auth('b')).expect(200)).body.data;
    expect(chatsB.find((c: { chatId: number }) => c.chatId === chatId).unreadCount).toBe(1);
    expect((await http().get('/Chat/get-unread-count').set(auth('b'))).body.data.count).toBe(1);
    // Firistanda paymi xudro naxonda namebinad
    const chatsA = (await http().get('/Chat/get-chats').set(auth('a')).expect(200)).body.data;
    expect(chatsA.find((c: { chatId: number }) => c.chatId === chatId).unreadCount).toBe(0);

    const seen = next<{ chatId: number; userId: string; readAt: string }>(sockA, 'chat:read');
    await http().post('/Chat/read-chat').query({ chatId }).set(auth('b')).expect(200);
    expect(await seen).toMatchObject({ chatId, userId: users.b!.id });
    chatsB = (await http().get('/Chat/get-chats').set(auth('b')).expect(200)).body.data;
    expect(chatsB.find((c: { chatId: number }) => c.chatId === chatId).unreadCount).toBe(0);
    const peer = (await http().get('/Chat/get-chats').set(auth('a')).expect(200)).body.data.find((c: { chatId: number }) => c.chatId === chatId);
    expect(peer.peerReadAt).not.toBeNull();

    // Typing: a → b merasad; c (begona) → hech kas
    const typing = next<{ chatId: number; userId: string; isTyping: boolean }>(sockB, 'typing');
    sockA.emit('typing', { chatId, isTyping: true });
    expect(await typing).toEqual({ chatId, userId: users.a!.id, isTyping: true });
    let leaked = false;
    sockB.once('typing', () => (leaked = true));
    sockC.emit('typing', { chatId, isTyping: true });
    await new Promise((r) => setTimeout(r, 300));
    expect(leaked).toBe(false);

    // Share post
    const postId = await post('c', 'Share me');
    const shared = (await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('SharedPostId', String(postId)).set(auth('a')).expect(200)).body.data;
    expect(shared.sharedPost).toMatchObject({ postId, userName: name('c') });
    await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('SharedPostId', '999999999').set(auth('a')).expect(404);
  });
});
