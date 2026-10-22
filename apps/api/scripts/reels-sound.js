// Render: reel-hoi kuhnai seed (video-hoi Mixkit bidun ovoz, `seed-video-<id>.mp4`) ba video-hoi bo ovoz ivaz meshavand.
// Yakbora: agar reel-i kuhna namonad — hech kor namekunad. Post-ho, like-ho va comment-ho nigoh doshta meshavand.
const { PrismaClient } = require('@prisma/client');
const { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const REEL_VIDEOS = require('./reel-videos.js');

if (existsSync('.env')) process.loadEnvFile('.env');
const uploadDir = resolve(process.env.UPLOAD_DIR ?? 'uploads');
const OLD = /^seed-video-\d+\.mp4$/;

async function download({ url, file }) {
  const path = join(uploadDir, file);
  if (existsSync(path) && statSync(path).size > 1000) return file;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      return file;
    } catch (err) {
      if (attempt === 2) console.warn(`Bor nashud (${url}): ${err.message}`);
    }
  }
  return null;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const images = await prisma.postImage.findMany({
      where: { post: { isReel: true }, fileName: { startsWith: 'seed-video-' } },
      orderBy: { postId: 'asc' },
      select: { id: true, fileName: true },
    });
    const old = images.filter((i) => OLD.test(i.fileName));
    if (!old.length) return console.log('Reels: hama bo ovoz ast');

    mkdirSync(uploadDir, { recursive: true });
    const files = [];
    for (const v of REEL_VIDEOS) {
      const file = await download(v);
      if (!file) continue;
      // Nusxa dar DB: disk-i Render pas az har deploy pok meshavad
      const stored = await prisma.mediaFile.findUnique({ where: { name: file }, select: { name: true } });
      if (!stored) await prisma.mediaFile.create({ data: { name: file, data: readFileSync(join(uploadDir, file)) } });
      files.push(file);
    }
    if (!files.length) return console.warn('Reels: video-hoi bo ovoz bor nashudand, keyin boz kushish meshavad');

    for (const [i, img] of old.entries()) {
      await prisma.postImage.update({ where: { id: img.id }, data: { fileName: files[i % files.length] } });
    }
    console.log(`Reels: ${old.length} reel ba video-i bo ovoz ivaz shud`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(`Reels-sound nashud: ${err.message}`);
});
