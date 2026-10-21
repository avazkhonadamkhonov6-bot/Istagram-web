/**
 * Seed (Spec 00 §6, Spec 14, Spec 15): 40 user (parol: password123), ~200 post bo aksi voqe'i, ~35 reels bo video,
 * story-hoi qariban hamai user-ho (aks va video, + close friends), highlights, follow, like, comment (+ pin),
 * saved + collections, Direct (1:1 va group, paymi tahrirshuda), notes, favorites, notifications.
 * Hisobi demo: `avaz` / `password123`.
 *
 * Media az internet bor meshavad va dar UPLOAD_DIR kesh meshavad (ijroi duyum — bidun internet):
 *  - aksho: picsum.photos (Unsplash, litsenziyai ozod), avatar-ho: i.pravatar.cc
 *  - video-ho: assets.mixkit.co (Mixkit Free License)
 * Agar internet naboshad — aksi rangini PNG (seed kor mekunad).
 * Ijro: pnpm --filter api db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

if (existsSync('.env')) process.loadEnvFile('.env');
const prisma = new PrismaClient();
const uploadDir = resolve(process.env.UPLOAD_DIR ?? 'uploads');

// Zaxira: PNG-i 1x1, agar bor kardan nashud
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** Video-hoi amudii 720x1280 (Mixkit) */
const VIDEO_IDS = [1173, 1232, 34487, 39767, 34404, 39875, 50000, 34405, 39880, 42298, 43483, 45351, 47583, 49076];

// Tasodufii doimi — har ijro hamon natija
let rnd = 42;
const random = () => {
  rnd = (rnd * 1103515245 + 12345) % 2147483648;
  return rnd / 2147483648;
};
const pick = <T>(arr: readonly T[]) => arr[Math.floor(random() * arr.length)]!;
const sample = <T>(arr: readonly T[], n: number) => [...arr].sort(() => random() - 0.5).slice(0, n);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

async function download(url: string, fileName: string): Promise<string> {
  const path = join(uploadDir, fileName);
  if (existsSync(path) && statSync(path).size > 1000) return fileName;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      return fileName;
    } catch (err) {
      if (attempt === 2) console.warn(`Bor nashud (${url}): ${(err as Error).message} — PNG istifoda meshavad`);
    }
  }
  const fallback = fileName.replace(/\.\w+$/, '.png');
  writeFileSync(join(uploadDir, fallback), PNG);
  return fallback;
}

/** Bor kardani parallel bo mahdudiyat */
async function pool<T>(tasks: (() => Promise<T>)[], size = 8): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < tasks.length) {
        const k = i++;
        out[k] = await tasks[k]!();
      }
    }),
  );
  return out;
}

/** ID-hoi aksi picsum (ruyxati voqe'i az /v2/list; `/seed/` gohe javob namedihad) */
let PHOTO_IDS: string[] = Array.from({ length: 200 }, (_, i) => String(i + 10));
async function loadPhotoIds() {
  try {
    const pages = await Promise.all(
      [1, 2, 3].map((page) => fetch(`https://picsum.photos/v2/list?page=${page}&limit=100`, { signal: AbortSignal.timeout(30_000) }).then((r) => r.json() as Promise<{ id: string }[]>)),
    );
    PHOTO_IDS = pages.flat().map((p) => p.id);
  } catch {
    // ruyxati peshfarz
  }
}
/** Har seed — aksi alohida (tartibi doimi) */
const photoBySeed = new Map<string, string>();
const photo = (seed: string, w = 1080, h = 1350) => {
  if (!photoBySeed.has(seed)) photoBySeed.set(seed, PHOTO_IDS[photoBySeed.size % PHOTO_IDS.length]!);
  const id = photoBySeed.get(seed)!;
  return download(`https://picsum.photos/id/${id}/${w}/${h}`, `seed-p${id}-${w}x${h}.jpg`);
};
const avatar = (img: number) => download(`https://i.pravatar.cc/320?img=${img}`, `seed-avatar-${img}.jpg`);
const video = (id: number) => download(`https://assets.mixkit.co/videos/${id}/${id}-720.mp4`, `seed-video-${id}.mp4`);

const PEOPLE = [
  { userName: 'avaz', fullName: 'Avaz Adamkhonov', about: 'Developer. Dushanbe.\nInstagram clone — 4 ruz', img: 12 },
  { userName: 'abubakr', fullName: 'Abubakr Kurbonov', about: 'Frontend | Next.js', img: 13 },
  { userName: 'pamir.travel', fullName: 'Pamir Travel', about: 'Kuhhoi Pomir va roh-i Pomir\nSafarho har hafta', img: 33 },
  { userName: 'dushanbe.life', fullName: 'Dushanbe Life', about: 'Shahri mo — har ruz', img: 52 },
  { userName: 'madina.art', fullName: 'Madina Rahimova', about: 'Rassom. Aquarel va portret', img: 47 },
  { userName: 'farrukh.photo', fullName: 'Farrukh Nazarov', about: 'Photographer | Canon\nTabiat va odamon', img: 15 },
  { userName: 'zarina_style', fullName: 'Zarina Saidova', about: 'Style & fashion', img: 44 },
  { userName: 'foodie.tj', fullName: 'Foodie TJ', about: 'Taomhoi tojiki va restoranho', img: 60 },
  { userName: 'rustam.fit', fullName: 'Rustam Karimov', about: 'Coach. Sport har ruz', img: 59 },
  { userName: 'sitora.music', fullName: 'Sitora Yusufi', about: 'Musiqi va ovoz', img: 45 },
  { userName: 'bahodur.dev', fullName: 'Bahodur Olimov', about: 'Backend developer', img: 68 },
  { userName: 'nilufar.design', fullName: 'Nilufar Hakimova', about: 'UI/UX designer', img: 32 },
  { userName: 'travel.with.ali', fullName: 'Ali Valiev', about: 'Olam — kitobi kalon', img: 11 },
  { userName: 'samarkand.trip', fullName: 'Samarkand Trip', about: 'Tarix va me\'mori', img: 58 },
  { userName: 'khujand.city', fullName: 'Khujand City', about: 'Shahri qadimi dar sohili Sir', img: 53 },
  { userName: 'nature.tj', fullName: 'Nature of Tajikistan', about: 'Kuhho, kulho, darvozaho', img: 57 },
  // Spec 15: user-hoi ilovagi
  { userName: 'shahnoza.books', fullName: 'Shahnoza Rasulova', about: 'Kitob har ruz. Taqriz va iqtibos', img: 1 },
  { userName: 'jamshed.cars', fullName: 'Jamshed Sharipov', about: 'Mashinaho va safar', img: 3 },
  { userName: 'malika.makeup', fullName: 'Malika Nazarova', about: 'Makeup artist | Dushanbe', img: 5 },
  { userName: 'umed.football', fullName: 'Umed Rahimov', about: 'Futbol — zindagi', img: 8 },
  { userName: 'dilnoza.cook', fullName: 'Dilnoza Karimova', about: 'Retseptho-i oddi va lazzatnok', img: 9 },
  { userName: 'firuz.code', fullName: 'Firuz Davlatov', about: 'Full-stack | TypeScript', img: 14 },
  { userName: 'gulnora.flowers', fullName: 'Gulnora Sattorova', about: 'Gulho va guldastaho', img: 16 },
  { userName: 'behruz.drone', fullName: 'Behruz Aliev', about: 'Aksbardori az osmon', img: 20 },
  { userName: 'parvina.yoga', fullName: 'Parvina Ismoilova', about: 'Yoga va oromi', img: 21 },
  { userName: 'sherzod.art', fullName: 'Sherzod Mirzoev', about: 'Graffiti va mural', img: 23 },
  { userName: 'nigora.travel', fullName: 'Nigora Hasanova', about: 'Safar bo budjeti kam', img: 25 },
  { userName: 'davron.music', fullName: 'Davron Kodirov', about: 'Rubob va gitara', img: 26 },
  { userName: 'mehrona.style', fullName: 'Mehrona Saidova', about: 'Moda-i milli', img: 28 },
  { userName: 'faridun.photo', fullName: 'Faridun Yusupov', about: 'Street photography', img: 29 },
  { userName: 'sabrina.pets', fullName: 'Sabrina Oripova', about: 'Gurba va sag — dustoni man', img: 31 },
  { userName: 'alisher.gym', fullName: 'Alisher Nurov', about: 'Bodybuilding coach', img: 36 },
  { userName: 'madina.coffee', fullName: 'Madina Qodirova', about: 'Qahva va subh', img: 38 },
  { userName: 'rahim.history', fullName: 'Rahim Saidov', about: 'Tarixi Osiyoi Miyona', img: 41 },
  { userName: 'zebo.handmade', fullName: 'Zebo Tursunova', about: 'Suzani va kori dast', img: 43 },
  { userName: 'iskandar.hike', fullName: 'Iskandar Fayzov', about: 'Kuhnavardi har hafta', img: 48 },
  { userName: 'dushanbe.food', fullName: 'Dushanbe Food', about: 'Behtarin joyho-i xurok', img: 49 },
  { userName: 'pamir.photo', fullName: 'Pamir Photo', about: 'Pomir dar aks', img: 51 },
  { userName: 'tajik.news', fullName: 'Tajik News', about: 'Xabarho-i ruz', img: 54 },
  { userName: 'kamila.dance', fullName: 'Kamila Rajabova', about: 'Raqs-i milli va zamonavi', img: 56 },
] as const;

const LOCATIONS = ['Dushanbe', 'Khujand', 'Iskandarkul', 'Pamir', 'Khorog', 'Varzob', 'Samarkand', 'Istaravshan', 'Penjikent', 'Iskandarkul Lake'];
const CAPTIONS = [
  'Subhi xub az kuhho #tajikistan #mountains',
  'Shomi oromona #sunset #dushanbe',
  'Roh-i Pomir — safari orzu #pamir #roadtrip',
  'Choy va kitob, ruzi istirohat #weekend #tea',
  'Obi kul monandi oina #lake #nature',
  'Shahr dar shab #citylights #dushanbe',
  'Rangho-i tiramoh #autumn #photography',
  'Bo dustho #friends #goodvibes',
  'Kori nav, ilhomi nav #design #work',
  'Osh-i tojiki — behtarin #food #tajikfood',
  'Varzish — har subh #fitness #morning',
  'Kuhho maro mexonand #hiking #adventure',
  'Gulho-i bahor #spring #flowers',
  'Ruzi oftobi #sunny #summer',
  'Me\'mori-i qadim #architecture #history',
  'Lahzai oddi, vale zebo #moments',
];
/** Notes (Spec 15 §5) */
const NOTE_AUTHORS = ['abubakr', 'madina.art', 'pamir.travel', 'sitora.music', 'rustam.fit', 'nilufar.design', 'madina.coffee', 'iskandar.hike'];
const NOTE_TEXTS = ['Dar Pomir!', 'Kofe kist?', 'Konsert-i shanbe', 'Sport har subh', 'Dizayn-i nav tayyor', 'Qahva va kitob', 'Pagoh ba kuh', 'Kori nav sar shud'];
const COMMENTS = ['Zebo!', 'Ajoib ast', 'Kujo ast in?', 'Man ham mehoham', 'Super kadr', 'Rangho olianad', 'Ofarin!', 'Behtarin', 'Inro saqlam', 'Kay boz meravem?', 'Juda xub', 'Wow'];
const REPLIES = ['Rahmat!', 'Ha, hatman', 'Bo man biyo', 'Dar Iskandarkul', 'Hamin hafta'];

async function main() {
  mkdirSync(uploadDir, { recursive: true });
  console.log('Media bor meshavad (bori avval ~1–3 daqiqa)...');
  await loadPhotoIds();

  const avatars = await pool(PEOPLE.map((p) => () => avatar(p.img)));
  const videos = await pool(VIDEO_IDS.map((id) => () => video(id)), 3);
  const mp4 = videos.filter((f) => f.endsWith('.mp4'));

  // Postho: har user 4–6, har chorumi — carousel
  type PlannedPost = { owner: number; images: (() => Promise<string>)[]; caption: string; location: string | null; hoursAgo: number };
  const planned: PlannedPost[] = [];
  let n = 0;
  PEOPLE.forEach((_, owner) => {
    const count = 4 + Math.floor(random() * 3);
    for (let p = 0; p < count; p++) {
      n++;
      const pics = n % 4 === 0 ? 2 + Math.floor(random() * 3) : 1;
      planned.push({
        owner,
        images: Array.from({ length: pics }, (_, k) => {
          const seed = `ig${n}x${k}`;
          return () => photo(seed);
        }),
        caption: pick(CAPTIONS),
        location: random() < 0.6 ? pick(LOCATIONS) : null,
        hoursAgo: Math.floor(random() * 24 * 30) + 1,
      });
    }
  });
  const postFiles = await pool(planned.map((p) => () => Promise.all(p.images.map((f) => f()))));
  const storyFiles = await pool(Array.from({ length: 80 }, (_, i) => () => photo(`story${i}`, 1080, 1920)));
  // Nusxai media dar DB (MediaFile): server-i Render faylhoro az DB bargardonad
  const used = new Set([...avatars, ...videos, ...postFiles.flat(), ...storyFiles]);
  const stored = new Set((await prisma.mediaFile.findMany({ where: { name: { in: [...used] } }, select: { name: true } })).map((f) => f.name));
  for (const name of used) {
    if (!stored.has(name)) await prisma.mediaFile.create({ data: { name, data: readFileSync(join(uploadDir, name)) } });
  }
  console.log('Media tayyor. DB pur meshavad...');

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.highlight.deleteMany(),
    prisma.story.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.post.deleteMany(),
    prisma.hashtag.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id, memoryCost: 19456, timeCost: 2 });
  const users = [];
  for (const [i, p] of PEOPLE.entries()) {
    users.push(
      await prisma.user.create({
        data: {
          userName: p.userName,
          email: `${p.userName.replace(/[._]/g, '')}@example.com`,
          fullName: p.fullName,
          about: p.about,
          passwordHash,
          avatar: avatars[i],
          isPrivate: p.userName === 'zarina_style',
          createdAt: hoursAgo(24 * 60),
        },
      }),
    );
  }
  const U = Object.fromEntries(users.map((u) => [u.userName, u]));
  const avaz = U['avaz']!;

  // Follow: avaz → hama (gayr az zarina — darxost), har kas 5–9 nafar; ba avaz — nimi onho
  const follows = new Set<string>();
  const addFollow = (a: string, b: string) => a !== b && follows.add(`${a}|${b}`);
  for (const u of users) {
    if (u.id === avaz.id) users.filter((x) => x.userName !== 'zarina_style').forEach((x) => addFollow(u.id, x.id));
    else sample(users, 5 + Math.floor(random() * 5)).forEach((x) => x.userName !== 'zarina_style' && addFollow(u.id, x.id));
    if (u.id !== avaz.id && random() < 0.7) addFollow(u.id, avaz.id);
  }
  addFollow(U['madina.art']!.id, U['zarina_style']!.id);
  // Muallifoni note-ho bo avaz mutual hastand (Spec 15 §5)
  for (const n of NOTE_AUTHORS) addFollow(U[n]!.id, avaz.id);
  await prisma.follow.createMany({ data: [...follows].map((k) => ({ followerId: k.split('|')[0]!, followingId: k.split('|')[1]! })) });
  await prisma.followRequest.create({ data: { requesterId: avaz.id, targetId: U['zarina_style']!.id } });
  await prisma.followRequest.create({ data: { requesterId: U['bahodur.dev']!.id, targetId: U['zarina_style']!.id } });

  // Postho
  const posts: { id: number; userId: string; createdAt: Date }[] = [];
  for (const [i, p] of planned.entries()) {
    const owner = users[p.owner]!;
    const mention = random() < 0.15 ? ` @${pick(users).userName}` : '';
    const post = await prisma.post.create({
      data: {
        userId: owner.id,
        content: p.caption + mention,
        location: p.location,
        createdAt: hoursAgo(p.hoursAgo),
        images: { create: postFiles[i]!.map((fileName, order) => ({ fileName, order })) },
      },
    });
    posts.push({ id: post.id, userId: owner.id, createdAt: post.createdAt });
    for (const m of (p.caption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((t) => t.slice(1).toLowerCase())) {
      const tag = await prisma.hashtag.upsert({ where: { name: m }, create: { name: m }, update: {} });
      await prisma.postHashtag.createMany({ data: [{ postId: post.id, hashtagId: tag.id }], skipDuplicates: true });
    }
  }

  // Reels — video-hoi amudi
  const REEL_OWNERS = [
    'pamir.travel', 'nature.tj', 'sitora.music', 'rustam.fit', 'dushanbe.life', 'farrukh.photo', 'travel.with.ali', 'behruz.drone',
    'kamila.dance', 'davron.music', 'alisher.gym', 'iskandar.hike', 'dilnoza.cook', 'sabrina.pets', 'pamir.photo', 'avaz', 'abubakr',
  ];
  const REEL_CAPTIONS = [
    'Lahzai kutoh #reels #nature', 'Tamosho kuned to oxir #reels', 'Ruzi man dar 15 soniya #reels #vlog', 'Rang va harakat #reels #art',
    'Shahr zinda ast #reels #city', 'Az osmon #reels #drone', 'Subhi kuhi #reels #mountains', 'Trend-i nav #reels #trending',
  ];
  // Har video chand bor, az user-hoi gunogun (~35 reel)
  const reelFiles = mp4.length ? Array.from({ length: Math.max(35, mp4.length) }, (_, i) => mp4[i % mp4.length]!) : [];
  for (const [i, file] of reelFiles.entries()) {
    const owner = U[REEL_OWNERS[i % REEL_OWNERS.length]!]!;
    const post = await prisma.post.create({
      data: {
        userId: owner.id,
        content: pick(REEL_CAPTIONS),
        isReel: true,
        viewCount: 200 + Math.floor(random() * 5000),
        location: random() < 0.4 ? pick(LOCATIONS) : null,
        createdAt: hoursAgo(2 + i * 5),
        images: { create: [{ fileName: file, order: 0 }] },
      },
    });
    posts.push({ id: post.id, userId: owner.id, createdAt: post.createdAt });
  }

  // Tag-i odam dar chand post
  for (const p of sample(posts, 10)) {
    const target = pick(users);
    if (target.id === p.userId) continue;
    await prisma.postTag.createMany({ data: [{ postId: p.id, userId: target.id, x: 0.3 + random() * 0.4, y: 0.3 + random() * 0.4 }], skipDuplicates: true });
  }

  // Like, comment, reply, like-i comment
  for (const p of posts) {
    const likers = sample(users.filter((u) => u.id !== p.userId), Math.floor(random() * 12));
    await prisma.postLike.createMany({ data: likers.map((l) => ({ userId: l.id, postId: p.id })) });
    const commenters = sample(users.filter((u) => u.id !== p.userId), Math.floor(random() * 4));
    let commentCount = 0;
    for (const c of commenters) {
      const comment = await prisma.postComment.create({
        data: { postId: p.id, userId: c.id, comment: pick(COMMENTS), createdAt: new Date(p.createdAt.getTime() + 3600_000) },
      });
      commentCount++;
      if (random() < 0.35) {
        await prisma.postComment.create({
          data: { postId: p.id, userId: p.userId, parentId: comment.id, comment: `@${c.userName} ${pick(REPLIES)}`, createdAt: new Date(p.createdAt.getTime() + 7200_000) },
        });
        await prisma.postComment.update({ where: { id: comment.id }, data: { replyCount: 1 } });
        commentCount++;
      }
      const cl = sample(users, Math.floor(random() * 4));
      await prisma.commentLike.createMany({ data: cl.map((u) => ({ userId: u.id, commentId: comment.id })) });
      await prisma.postComment.update({ where: { id: comment.id }, data: { likeCount: cl.length } });
    }
    await prisma.post.update({ where: { id: p.id }, data: { likeCount: likers.length, commentCount } });
  }

  // Counter-hoi user
  for (const u of users) {
    const [followers, following, postsCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: u.id } }),
      prisma.follow.count({ where: { followerId: u.id } }),
      prisma.post.count({ where: { userId: u.id } }),
    ]);
    await prisma.user.update({ where: { id: u.id }, data: { followersCount: followers, followingCount: following, postsCount } });
  }

  // Pin: 1 posti avaz
  const avazPosts = posts.filter((p) => p.userId === avaz.id);
  if (avazPosts[0]) await prisma.post.update({ where: { id: avazPosts[0].id }, data: { pinnedAt: new Date() } });

  // Saved + collections baroi avaz
  const saved = sample(posts.filter((p) => p.userId !== avaz.id), 12);
  await prisma.postFavorite.createMany({ data: saved.map((p) => ({ userId: avaz.id, postId: p.id })) });
  const travel = await prisma.collection.create({ data: { userId: avaz.id, name: 'Safar' } });
  const food = await prisma.collection.create({ data: { userId: avaz.id, name: 'Taomho' } });
  await prisma.collectionItem.createMany({ data: saved.slice(0, 5).map((p) => ({ collectionId: travel.id, postId: p.id })) });
  await prisma.collectionItem.createMany({ data: saved.slice(5, 8).map((p) => ({ collectionId: food.id, postId: p.id })) });

  // Close friends
  for (const name of ['abubakr', 'madina.art', 'bahodur.dev']) {
    await prisma.userRelation.create({ data: { ownerId: avaz.id, targetId: U[name]!.id, type: 'CLOSE_FRIEND' } });
  }
  await prisma.userRelation.create({ data: { ownerId: U['pamir.travel']!.id, targetId: avaz.id, type: 'CLOSE_FRIEND' } });
  await prisma.userRelation.create({ data: { ownerId: U['madina.coffee']!.id, targetId: avaz.id, type: 'CLOSE_FRIEND' } });

  // Favorites-i avaz (Spec 15 §1)
  await prisma.userRelation.createMany({
    data: ['abubakr', 'pamir.travel', 'madina.art', 'nature.tj'].map((n) => ({ ownerId: avaz.id, targetId: U[n]!.id, type: 'FAVORITE' as const })),
  });

  // Pin-i comment (Spec 15 §2): dar har panjumi post — comment-i avval
  for (const p of posts.filter((_, i) => i % 5 === 0)) {
    const c = await prisma.postComment.findFirst({ where: { postId: p.id, parentId: null }, orderBy: { createdAt: 'asc' } });
    if (c) await prisma.postComment.update({ where: { id: c.id }, data: { pinnedAt: new Date(c.createdAt.getTime() + 60_000) } });
  }

  // Story: qariban hamai user-ho (har 10-um — bidun story), 1–4 story; har sevum — story-i video; close friends
  const storyOwners = PEOPLE.map((p) => p.userName as string).filter((_, i) => i % 10 !== 9);
  let s = 0;
  for (const [k, name] of storyOwners.entries()) {
    const owner = U[name]!;
    const count = 1 + Math.floor(random() * 4);
    for (let j = 0; j < count; j++) {
      const isVideo = k % 3 === 1 && j === 0 && mp4.length > 0;
      const created = hoursAgo(1 + Math.floor(random() * 20));
      const story = await prisma.story.create({
        data: {
          userId: owner.id,
          fileName: isVideo ? mp4[k % mp4.length]! : storyFiles[s++ % storyFiles.length]!,
          closeFriends: (name === 'pamir.travel' || name === 'madina.coffee') && j === count - 1 && count > 1,
          createdAt: created,
          expiresAt: new Date(created.getTime() + 24 * 3600_000),
        },
      });
      const viewers = sample(users.filter((u) => u.id !== owner.id && u.id !== avaz.id), Math.floor(random() * 8));
      await prisma.storyView.createMany({ data: viewers.map((v) => ({ storyId: story.id, viewerId: v.id })) });
      await prisma.storyLike.createMany({ data: viewers.slice(0, 2).map((v) => ({ storyId: story.id, userId: v.id })) });
    }
  }

  // Highlights — az story-hoi guzashta
  const HIGHLIGHTS: [string, string[]][] = [
    ['avaz', ['Safar', 'Kor', 'Dustho']],
    ['pamir.travel', ['Pamir', 'Wakhan', 'Kul']],
    ['foodie.tj', ['Osh', 'Choyxona']],
    ['nature.tj', ['Bahor', 'Zimiston']],
  ];
  for (const [name, titles] of HIGHLIGHTS) {
    const owner = U[name]!;
    for (const title of titles) {
      const ids = [];
      for (let j = 0; j < 2 + Math.floor(random() * 2); j++) {
        const created = hoursAgo(24 * (10 + Math.floor(random() * 60)));
        const st = await prisma.story.create({
          data: { userId: owner.id, fileName: storyFiles[s++ % storyFiles.length]!, createdAt: created, expiresAt: new Date(created.getTime() + 24 * 3600_000) },
        });
        ids.push(st.id);
      }
      await prisma.highlight.create({ data: { userId: owner.id, title, stories: { create: ids.map((storyId) => ({ storyId })) } } });
    }
  }

  // Direct: avaz bo 5 nafar + group
  const pair = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const DIALOGS: [string, [boolean, string][]][] = [
    ['abubakr', [[false, 'Salom! Front chi xel?'], [true, 'Salom, feed tayyor, reels-ro sar kardam'], [false, 'Ofarin. Pagoh integratsiya'], [true, 'Xub, man tayyor']]],
    ['madina.art', [[false, 'Rasmi navro didi?'], [true, 'Ha, juda zebo shudaast'], [false, 'Rahmat!']]],
    ['pamir.travel', [[false, 'Safar ba Pomir kay?'], [true, 'Moh-i oyanda. Biyo bo mo'], [false, 'Hatman meoyam']]],
    ['bahodur.dev', [[true, 'API-ro didi?'], [false, 'Ha, e2e hama sabz'], [true, 'Super']]],
    ['sitora.music', [[false, 'Konsert dar shanbe'], [true, 'Kujo?']]],
  ];
  for (const [i, [name, lines]] of DIALOGS.entries()) {
    const other = U[name]!;
    const start = hoursAgo(48 - i * 6);
    const chat = await prisma.chat.create({
      data: { sendUserId: avaz.id, receiveUserId: other.id, pairKey: pair(avaz.id, other.id), lastMessageAt: start },
    });
    let t = start.getTime();
    for (const [fromOther, text] of lines) {
      t += 7 * 60_000;
      await prisma.message.create({ data: { chatId: chat.id, userId: fromOther ? other.id : avaz.id, messageText: text, createdAt: new Date(t) } });
    }
    // Ohirin paym az digar — naxonda baroi avaz (gayr az chat-i avval)
    const last = new Date(t);
    await prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageAt: last, receiveUserReadAt: last, sendUserReadAt: i === 0 ? last : new Date(t - 60_000) },
    });
  }
  const group = await prisma.chat.create({
    data: {
      isGroup: true,
      title: 'Instagram clone',
      sendUserId: avaz.id,
      receiveUserId: avaz.id,
      pairKey: 'group:seed-instagram-clone',
      lastMessageAt: hoursAgo(1),
      members: { create: ['avaz', 'abubakr', 'bahodur.dev', 'nilufar.design'].map((name) => ({ userId: U[name]!.id, readAt: hoursAgo(3) })) },
    },
  });
  const GROUP_LINES: [string, string][] = [
    ['avaz', 'Salom hama! Demo pagoh soati 10'],
    ['abubakr', 'Man tayyor'],
    ['nilufar.design', 'Dizayn-i login-ro navsozi kardam'],
    ['bahodur.dev', 'Backend freeze shud'],
  ];
  for (const [i, [name, text]] of GROUP_LINES.entries()) {
    await prisma.message.create({ data: { chatId: group.id, userId: U[name]!.id, messageText: text, createdAt: hoursAgo(2 - i * 0.25) } });
  }

  // Paymi tahrirshuda (Spec 15 §3)
  const lastGroup = await prisma.message.findFirst({ where: { chatId: group.id }, orderBy: { createdAt: 'desc' } });
  if (lastGroup) {
    await prisma.message.update({ where: { id: lastGroup.id }, data: { messageText: 'Backend freeze shud, Spec 15 ham tayyor', editedAt: hoursAgo(1) } });
  }

  // Notes (Spec 15 §5); yaktoash — close friends
  for (const [i, n] of [...NOTE_AUTHORS, 'avaz'].entries()) {
    const created = hoursAgo(1 + i * 2);
    await prisma.note.create({
      data: {
        userId: U[n]!.id,
        text: n === 'avaz' ? 'Instagram clone — demo pagoh' : NOTE_TEXTS[i % NOTE_TEXTS.length]!,
        closeFriends: n === 'madina.coffee',
        createdAt: created,
        expiresAt: new Date(created.getTime() + 24 * 3600_000),
      },
    });
  }

  // "Active now" (Spec 15 §4): vaqti oxirini faoliyat
  for (const u of users) {
    await prisma.user.update({ where: { id: u.id }, data: { lastActiveAt: hoursAgo(random() * 30) } });
  }

  // Notifications baroi avaz
  const recent = posts.filter((p) => p.userId === avaz.id);
  const others = users.filter((u) => u.id !== avaz.id);
  let k = 0;
  for (const actor of sample(others, 8)) {
    const p = recent[k++ % Math.max(recent.length, 1)];
    if (!p) break;
    await prisma.notification.createMany({
      data: [{ key: `LIKE:${actor.id}:${p.id}`, type: 'LIKE', actorId: actor.id, recipientId: avaz.id, postId: p.id, createdAt: hoursAgo(k * 7) }],
      skipDuplicates: true,
    });
  }
  for (const actor of sample(others, 5)) {
    await prisma.notification.createMany({
      data: [{ key: `FOLLOW:${actor.id}:${avaz.id}`, type: 'FOLLOW', actorId: actor.id, recipientId: avaz.id, createdAt: hoursAgo(24 * (1 + k++)) }],
      skipDuplicates: true,
    });
  }
  const avazComments = await prisma.postComment.findMany({ where: { post: { userId: avaz.id }, userId: { not: avaz.id }, parentId: null }, take: 4 });
  for (const c of avazComments) {
    await prisma.notification.create({
      data: { key: `COMMENT:${c.id}`, type: 'COMMENT', actorId: c.userId, recipientId: avaz.id, postId: c.postId, commentId: c.id, createdAt: c.createdAt },
    });
  }

  const reels = await prisma.post.count({ where: { isReel: true } });
  const stories = await prisma.story.count();
  const notes = await prisma.note.count();
  console.log(`Seed tayyor: ${users.length} user, ${posts.length} post (${reels} reel), ${stories} story, ${notes} note, ${DIALOGS.length + 1} chat. Login: avaz / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
