const { PrismaClient } = require("@prisma/client");
const argon = require("argon2");
const fs = require("node:fs");
(async () => {
  if (
    process.env.NODE_ENV !== "test" ||
    !/(test|qa)/i.test(new URL(process.env.DATABASE_URL).pathname)
  )
    throw new Error("Use NODE_ENV=test and a dedicated test/QA database");
  const db = new PrismaClient();
  const hash = await argon.hash("password123");
  const users = [];
  for (const name of ["user1", "user2", "avaz", "abubakr"])
    users.push(
      await db.user.upsert({
        where: { userName: name },
        update: {},
        create: {
          userName: name,
          email: name + "@qa.local",
          fullName:
            name === "user1" ? "User 1" : name === "user2" ? "User 2" : name,
          passwordHash: hash,
        },
      }),
    );
  for (const u of users)
    for (const v of users)
      if (u.id !== v.id)
        await db.follow.upsert({
          where: {
            followerId_followingId: { followerId: u.id, followingId: v.id },
          },
          update: {},
          create: { followerId: u.id, followingId: v.id },
        });
  fs.mkdirSync(process.env.UPLOAD_DIR || "/tmp/instagram-qa-uploads", {
    recursive: true,
  });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  fs.writeFileSync(
    require("node:path").join(
      process.env.UPLOAD_DIR || "/tmp/instagram-qa-uploads",
      "qa.png",
    ),
    png,
  );
  for (const u of users) {
    if (!(await db.post.count({ where: { userId: u.id } })))
      await db.post.create({
        data: {
          userId: u.id,
          content: "QA seed #qa",
          images: { create: [{ fileName: "qa.png", order: 0 }] },
        },
      });
    await db.user.update({
      where: { id: u.id },
      data: {
        postsCount: await db.post.count({ where: { userId: u.id } }),
        followersCount: 3,
        followingCount: 3,
      },
    });
  }
  if (
    !(await db.story.count({
      where: { userId: users[0].id, expiresAt: { lt: new Date() } },
    }))
  )
    await db.story.create({
      data: {
        userId: users[0].id,
        fileName: "qa.png",
        createdAt: new Date(Date.now() - 48 * 3600000),
        expiresAt: new Date(Date.now() - 24 * 3600000),
      },
    });
  // The legacy UI suite follows an account outside the initial mutual group.
  await db.user.upsert({ where: { userName: "user10" }, update: {}, create: { userName: "user10", email: "user10@qa.local", fullName: "User 10", passwordHash: hash } });
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
