/**
 * e2e baroi AC-hoi Spec 16: zangi audio / video (signaling), paymi ovozi / video bo davomnoki, efiri mustaqim.
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadConfig } from '../src/infra/config';
import { PrismaService } from '../src/infra/prisma.service';
import { RealtimeGateway } from '../src/modules/realtime/realtime.gateway';
import { configureApp } from '../src/setup';

const tag = randomBytes(3).toString('hex');
const name = (n: string) => `s16_${tag}_${n}`;
const PASSWORD = 'password123';
const OFFER = { type: 'offer', sdp: 'v=0 test-offer' };
const ANSWER = { type: 'answer', sdp: 'v=0 test-answer' };

type Ack = { ok: boolean; code?: string; data?: unknown };

describe('API (Spec 16)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  const http = () => request(app.getHttpServer());
  const users: Record<string, { id: string; token: string }> = {};
  const auth = (who: string) => ({ Authorization: `Bearer ${users[who]!.token}` });
  const sockets: Socket[] = [];
  const socketsOf: Record<string, Socket[]> = {};

  async function connect(who: string) {
    const ticket = (await http().post('/Account/ws-ticket').set(auth(who)).expect(200)).body.data as string;
    const s = io(baseUrl, { path: '/ws', auth: { token: ticket }, transports: ['websocket'] });
    sockets.push(s);
    (socketsOf[who] ??= []).push(s);
    await new Promise<void>((resolve) => s.on('connect', () => resolve()));
    // handleConnection asinxronist — room-i user pas az verify
    await new Promise((r) => setTimeout(r, 50));
    return s;
  }
  const next = <T>(s: Socket, event: string) => new Promise<T>((resolve) => s.once(event, resolve));
  const emit = (s: Socket, event: string, body: unknown) => new Promise<Ack>((resolve) => s.emit(event, body, resolve));
  const chatWith = async (who: string, target: string) =>
    (await http().post('/Chat/create-chat').query({ receiverUserId: users[target]!.id }).set(auth(who)).expect(200)).body.data as number;
  const messages = async (who: string, chatId: number) =>
    (await http().get('/Chat/get-chat-by-id').query({ chatId }).set(auth(who)).expect(200)).body.data as {
      call: { status: string; type: string } | null;
      durationSec: number | null;
      fileType: string | null;
    }[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    RealtimeGateway.offlineGraceMs = 100;
    for (const who of ['a', 'b', 'c']) {
      const userName = name(who);
      await http()
        .post('/Account/register')
        .set('x-forwarded-for', `10.16.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
        .send({ userName, fullName: 'S16', email: `${userName}@t.tj`, password: PASSWORD, confirmPassword: PASSWORD })
        .expect(200);
      const token = (await http().post('/Account/login').send({ userName, password: PASSWORD }).expect(200)).body.data as string;
      const me = await http().get('/UserProfile/get-my-profile').set('Authorization', `Bearer ${token}`).expect(200);
      users[who] = { id: me.body.data.userId, token };
    }
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await prisma.user.deleteMany({ where: { userName: { startsWith: `s16_${tag}` } } });
    await app.close();
  });

  it('ICE servers: STUN-i peshfarz', async () => {
    const r = await http().get('/Call/get-ice-servers').set(auth('a')).expect(200);
    expect(r.body.data[0].urls).toEqual(expect.arrayContaining([expect.stringMatching(/^stun:/)]));
  });

  it('zangi video 1:1: incoming → signal → accept → answer → end; begona — 403; paymi zang dar chat', async () => {
    const chatId = await chatWith('a', 'b');
    const [sa, sb, sc] = [await connect('a'), await connect('b'), await connect('c')];

    const incoming = next<{ callId: number; type: string; status: string }>(sb, 'call:incoming');
    const call = (await http().post('/Call/start-call').send({ chatId, type: 'VIDEO' }).set(auth('a')).expect(200)).body.data;
    expect(call).toMatchObject({ type: 'VIDEO', status: 'RINGING', chatId });
    expect((await incoming).callId).toBe(call.callId);

    // Dar zang hastam → zangi digar 409
    const busy = await http().post('/Call/start-call').send({ chatId, type: 'AUDIO' }).set(auth('a')).expect(409);
    expect(busy.body.code).toBe('CALL_BUSY');

    // Begona: na signal, na dastras
    expect((await emit(sc, 'call:signal', { callId: call.callId, toUserId: users.b!.id, signal: OFFER })).code).toBe('FORBIDDEN');
    await http().get('/Call/get-call-by-id').query({ callId: call.callId }).set(auth('c')).expect(403);

    const accepted = next<{ userId: string; call: { status: string } }>(sa, 'call:accepted');
    const acc = (await http().post('/Call/accept-call').query({ callId: call.callId }).set(auth('b')).expect(200)).body.data;
    expect(acc.status).toBe('ONGOING');
    expect((await accepted).userId).toBe(users.b!.id);

    // Qabulkunanda offer mefiristad, zangzananda answer
    const gotOffer = next<{ fromUserId: string; signal: { type: string } }>(sa, 'call:signal');
    expect((await emit(sb, 'call:signal', { callId: call.callId, toUserId: users.a!.id, signal: OFFER })).ok).toBe(true);
    expect(await gotOffer).toMatchObject({ fromUserId: users.b!.id, signal: { type: 'offer' } });
    const gotAnswer = next<{ signal: { type: string } }>(sb, 'call:signal');
    await emit(sa, 'call:signal', { callId: call.callId, toUserId: users.b!.id, signal: ANSWER });
    expect((await gotAnswer).signal.type).toBe('answer');
    const ice = next<{ signal: { type: string } }>(sb, 'call:signal');
    await emit(sa, 'call:signal', { callId: call.callId, toUserId: users.b!.id, signal: { type: 'candidate', candidate: { candidate: 'candidate:1 1 udp 1 1.2.3.4 5 typ host', sdpMid: '0', sdpMLineIndex: 0 } } });
    expect((await ice).signal.type).toBe('candidate');

    const endedA = next<{ status: string }>(sa, 'call:ended');
    const msg = next<{ call: { status: string } | null }>(sb, 'message:new');
    const end = (await http().post('/Call/end-call').query({ callId: call.callId }).set(auth('b')).expect(200)).body.data;
    expect(end.status).toBe('ENDED');
    expect((await endedA).status).toBe('ENDED');
    expect((await msg).call).toMatchObject({ status: 'ENDED' });

    const last = (await messages('a', chatId)).find((m) => m.call);
    expect(last?.call).toMatchObject({ type: 'VIDEO', status: 'ENDED' });
    // Pas az anjom signal → CALL_NOT_ACTIVE
    expect((await emit(sa, 'call:signal', { callId: call.callId, toUserId: users.b!.id, signal: OFFER })).code).toBe('CALL_NOT_ACTIVE');
    const hist = (await http().get('/Call/get-calls').set(auth('b')).expect(200)).body;
    expect(hist.data[0].callId).toBe(call.callId);
  });

  it('rad kardan → DECLINED; bekor kardan az tarafi zangzananda → MISSED', async () => {
    const chatId = await chatWith('a', 'c');
    const c1 = (await http().post('/Call/start-call').send({ chatId, type: 'AUDIO' }).set(auth('a')).expect(200)).body.data;
    expect((await http().post('/Call/decline-call').query({ callId: c1.callId }).set(auth('c')).expect(200)).body.data.status).toBe('DECLINED');
    await http().post('/Call/accept-call').query({ callId: c1.callId }).set(auth('c')).expect(400);

    const c2 = (await http().post('/Call/start-call').send({ chatId, type: 'AUDIO' }).set(auth('a')).expect(200)).body.data;
    expect((await http().get('/Call/get-active-calls').set(auth('c')).expect(200)).body.data[0].callId).toBe(c2.callId);
    expect((await http().post('/Call/end-call').query({ callId: c2.callId }).set(auth('a')).expect(200)).body.data.status).toBe('MISSED');
    const statuses = (await messages('c', chatId)).filter((m) => m.call).map((m) => m.call!.status);
    expect(statuses).toEqual(expect.arrayContaining(['DECLINED', 'MISSED']));
  });

  it('user offline shud (hamai socket-ho qat\') → zang tamom', async () => {
    const chatId = await chatWith('b', 'c');
    const sb = await connect('b');
    await connect('c');
    const call = (await http().post('/Call/start-call').send({ chatId, type: 'VIDEO' }).set(auth('b')).expect(200)).body.data;
    await http().post('/Call/accept-call').query({ callId: call.callId }).set(auth('c')).expect(200);
    const ended = next<{ status: string }>(sb, 'call:ended');
    // Hamai socket-hoi c (dastgohhoi digar ham)
    socketsOf.c!.forEach((s) => s.close());
    expect((await ended).status).toBe('ENDED');
  });

  it('paymi ovozi va video: davomnoki (Duration) nigoh doshta meshavad', async () => {
    const chatId = await chatWith('a', 'b');
    const voice = await http()
      .put('/Chat/send-message')
      .field('ChatId', String(chatId))
      .field('Duration', '7')
      .attach('File', Buffer.from('OggS fake voice'), { filename: 'v.ogg', contentType: 'audio/ogg' })
      .set(auth('a'))
      .expect(200);
    expect(voice.body.data).toMatchObject({ fileType: 'audio', durationSec: 7 });
    const video = await http()
      .put('/Chat/send-message')
      .field('ChatId', String(chatId))
      .field('Duration', '12')
      .attach('File', Buffer.from('00000018667479706d703432', 'hex'), { filename: 'v.mp4', contentType: 'video/mp4' })
      .set(auth('a'))
      .expect(200);
    expect(video.body.data).toMatchObject({ fileType: 'video', durationSec: 12 });
    // Fayli qalbaki (HTML bo nomi .mp4) — 400
    await http()
      .put('/Chat/send-message')
      .field('ChatId', String(chatId))
      .attach('File', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'x.mp4', contentType: 'video/mp4' })
      .set(auth('a'))
      .expect(400);
    await http().put('/Chat/send-message').field('ChatId', String(chatId)).field('Duration', '-1').field('MessageText', 'x').set(auth('a')).expect(400);
  });

  it('efir: start → follower xabar → join → signal → comment / dil → end', async () => {
    await http().post('/FollowingRelationShip/add-following-relation-ship').query({ followingUserId: users.a!.id }).set(auth('b')).expect(200);
    const [sa, sb, sc] = [await connect('a'), await connect('b'), await connect('c')];

    const started = next<{ liveId: number }>(sb, 'live:started');
    const live = (await http().post('/Live/start-live').send({ title: 'Salom!' }).set(auth('a')).expect(200)).body.data;
    expect(live).toMatchObject({ status: 'LIVE', title: 'Salom!', viewerCount: 0 });
    expect((await started).liveId).toBe(live.liveId);
    expect((await http().post('/Live/start-live').send({}).set(auth('a')).expect(409)).body.code).toBe('LIVE_ALREADY_STARTED');
    expect((await http().get('/Live/get-lives').set(auth('b')).expect(200)).body.data.map((l: { liveId: number }) => l.liveId)).toContain(live.liveId);
    // c follow namekunad — dar ruyxat nest, lekin hisobi public → join mumkin
    expect((await http().get('/Live/get-lives').set(auth('c')).expect(200)).body.data).toHaveLength(0);
    const notif = (await http().get('/Notification/get-notifications').set(auth('b')).expect(200)).body.data;
    expect(notif.some((n: { type: string }) => n.type === 'LIVE_STARTED')).toBe(true);

    const joined = next<{ user: { id: string } }>(sa, 'live:viewer-joined');
    const j = await emit(sb, 'live:join', { liveId: live.liveId });
    expect(j.ok).toBe(true);
    expect((await joined).user.id).toBe(users.b!.id);
    expect((await emit(sc, 'live:join', { liveId: live.liveId })).ok).toBe(true);

    // Muallif → tamoshobin: offer; tamoshobin → muallif: answer; tamoshobin → tamoshobin: mamnu'
    const offer = next<{ fromUserId: string }>(sb, 'live:signal');
    expect((await emit(sa, 'live:signal', { liveId: live.liveId, toUserId: users.b!.id, signal: OFFER })).ok).toBe(true);
    expect((await offer).fromUserId).toBe(users.a!.id);
    expect((await emit(sb, 'live:signal', { liveId: live.liveId, toUserId: users.a!.id, signal: ANSWER })).ok).toBe(true);
    expect((await emit(sc, 'live:signal', { liveId: live.liveId, toUserId: users.b!.id, signal: OFFER })).code).toBe('FORBIDDEN');

    const comment = next<{ text: string }>(sc, 'live:comment');
    const toHost = next<{ text: string }>(sa, 'live:comment');
    await http().post('/Live/add-comment').send({ liveId: live.liveId, text: 'Salom az b' }).set(auth('b')).expect(200);
    expect((await comment).text).toBe('Salom az b');
    expect((await toHost).text).toBe('Salom az b');
    expect((await http().get('/Live/get-comments').query({ liveId: live.liveId }).set(auth('c')).expect(200)).body.data).toHaveLength(1);

    const heart = next<{ userId: string }>(sa, 'live:heart');
    await emit(sc, 'live:heart', { liveId: live.liveId });
    expect((await heart).userId).toBe(users.c!.id);

    const info = (await http().get('/Live/get-live-by-id').query({ liveId: live.liveId }).set(auth('a')).expect(200)).body.data;
    expect(info).toMatchObject({ viewerCount: 2, peakViewers: 2 });

    const left = next<{ userId: string }>(sa, 'live:viewer-left');
    await emit(sc, 'live:leave', { liveId: live.liveId });
    expect((await left).userId).toBe(users.c!.id);

    await http().post('/Live/end-live').query({ liveId: live.liveId }).set(auth('b')).expect(403);
    const ended = next<{ status: string }>(sb, 'live:ended');
    expect((await http().post('/Live/end-live').query({ liveId: live.liveId }).set(auth('a')).expect(200)).body.data.status).toBe('ENDED');
    expect((await ended).status).toBe('ENDED');
    expect((await emit(sc, 'live:join', { liveId: live.liveId })).code).toBe('LIVE_NOT_ACTIVE');
    await http().post('/Live/add-comment').send({ liveId: live.liveId, text: 'dir' }).set(auth('b')).expect(400);
  });

  it('efiri hisobi private — faqat follower-ho', async () => {
    await http().put('/UserProfile/update-privacy').send({ isPrivate: true }).set(auth('c')).expect(200);
    const live = (await http().post('/Live/start-live').send({}).set(auth('c')).expect(200)).body.data;
    const sa = await connect('a');
    expect((await emit(sa, 'live:join', { liveId: live.liveId })).code).toBe('LIVE_NOT_FOUND');
    await http().get('/Live/get-live-by-id').query({ liveId: live.liveId }).set(auth('a')).expect(404);
    await http().post('/Live/end-live').query({ liveId: live.liveId }).set(auth('c')).expect(200);
  });
});
