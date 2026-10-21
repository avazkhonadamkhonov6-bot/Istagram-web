/**
 * Seed (Spec 00 §6): 10 user (user1…user10, parol password123), 50 post, follow, like, comment, story, chat.
 * Ijro: pnpm --filter api db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

if (existsSync('.env')) process.loadEnvFile('.env');
const prisma = new PrismaClient();
const uploadDir = resolve(process.env.UPLOAD_DIR ?? 'uploads');

// Aksi PNG-i 1x1 (rangi har post gunogun nest — baroi test kifoya ast)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const captions = ['Kuhhoi Pomir #tajikistan #mountains', 'Dushanbe dar shab #dushanbe', 'Subhi xub', 'Choy va kitob #weekend', 'Iskandarkul #lake'];

async function main() {
  mkdirSync(uploadDir, { recursive: true });
  const file = (name: string) => {
    writeFileSync(join(uploadDir, name), PNG);
    return name;
  };

  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.story.deleteMany(),
    prisma.post.deleteMany(),
    prisma.hashtag.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await argon2.hash('password123', { type: argon2.argon2id, memoryCost: 19456, timeCost: 2 });
  const users = [];
  for (let i = 1; i <= 10; i++) {
    users.push(
      await prisma.user.create({
        data: { userName: `user${i}`, email: `user${i}@example.com`, fullName: `User ${i}`, passwordHash, about: `Salom, man user${i}`, avatar: file(`seed-avatar-${i}.png`) },
      }),
    );
  }

  // Har user 3 nafari badiro follow mekunad
  for (let i = 0; i < users.length; i++) {
    for (let k = 1; k <= 3; k++) {
      const target = users[(i + k) % users.length]!;
      await prisma.follow.create({ data: { followerId: users[i]!.id, followingId: target.id } });
    }
  }
  for (const u of users) {
    const [followers, following] = await Promise.all([
      prisma.follow.count({ where: { followingId: u.id } }),
      prisma.follow.count({ where: { followerId: u.id } }),
    ]);
    await prisma.user.update({ where: { id: u.id }, data: { followersCount: followers, followingCount: following } });
  }

  // 50 post: har user 5
  let n = 0;
  for (const u of users) {
    for (let p = 0; p < 5; p++) {
      n++;
      const content = captions[n % captions.length]!;
      const post = await prisma.post.create({
        data: {
          userId: u.id,
          title: `Post ${n}`,
          content,
          createdAt: new Date(Date.now() - n * 3600_000),
          images: { create: [{ fileName: file(`seed-post-${n}.png`), order: 0 }] },
        },
      });
      for (const m of content.matchAll(/#([\p{L}\p{N}_]{1,100})/gu)) {
        const tag = await prisma.hashtag.upsert({ where: { name: m[1]!.toLowerCase() }, create: { name: m[1]!.toLowerCase() }, update: {} });
        await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: tag.id } });
      }
      const likers = users.filter((x) => x.id !== u.id).slice(0, n % 6);
      await prisma.postLike.createMany({ data: likers.map((l) => ({ userId: l.id, postId: post.id })) });
      const commenter = users[(n + 1) % users.length]!;
      await prisma.postComment.create({ data: { postId: post.id, userId: commenter.id, comment: 'Zebo!' } });
      await prisma.post.update({ where: { id: post.id }, data: { likeCount: likers.length, commentCount: 1 } });
    }
    await prisma.user.update({ where: { id: u.id }, data: { postsCount: 5 } });
  }

  // Story baroi 5 user-i avval
  for (const u of users.slice(0, 5)) {
    await prisma.story.create({ data: { userId: u.id, fileName: file(`seed-story-${u.userName}.png`), expiresAt: new Date(Date.now() + 24 * 3600_000) } });
  }

  // Chat bayni user1 va user2
  const [a, b] = [users[0]!, users[1]!];
  const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
  const chat = await prisma.chat.create({ data: { sendUserId: a.id, receiveUserId: b.id, pairKey } });
  await prisma.message.createMany({
    data: [
      { chatId: chat.id, userId: a.id, messageText: 'Salom!' },
      { chatId: chat.id, userId: b.id, messageText: 'Salom, chi xel?' },
    ],
  });

  console.log(`Seed tayyor: ${users.length} user, ${n} post, 5 story, 1 chat`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
