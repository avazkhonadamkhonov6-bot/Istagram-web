import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { loadConfig } from "../src/infra/config";
import { PrismaService } from "../src/infra/prisma.service";
import { configureApp } from "../src/setup";

const prefix = `complete_${randomBytes(4).toString("hex")}`;
describe("Profile completion contract (FE-06 / FE-10)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const people: { id: string; name: string; token: string }[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (index: number) => ({
    Authorization: `Bearer ${people[index].token}`,
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApp(app, loadConfig());
    await app.listen(0);
    prisma = app.get(PrismaService);
    for (let i = 0; i < 3; i++) {
      const name = `${prefix}_${i}`;
      await http()
        .post("/Account/register")
        .set("x-forwarded-for", `10.99.10.${i + 1}`)
        .send({
          userName: name,
          fullName: "Completion QA",
          email: `${name}@test.tj`,
          password: "password123",
          confirmPassword: "password123",
        })
        .expect(200);
      const token = (
        await http()
          .post("/Account/login")
          .send({ userName: name, password: "password123" })
          .expect(200)
      ).body.data;
      const profile = (
        await http()
          .get("/UserProfile/get-my-profile")
          .set("Authorization", `Bearer ${token}`)
          .expect(200)
      ).body.data;
      people.push({ id: profile.userId, name, token });
    }
  });
  afterAll(async () => {
    if (prisma)
      await prisma.user.deleteMany({
        where: { id: { in: people.map((p) => p.id) } },
      });
    await app?.close();
  });
  it("checks public availability without exposing profile or email, normalizes uppercase", async () => {
    const result = await http()
      .get("/Account/username-available")
      .query({ UserName: people[0].name.toUpperCase() })
      .expect(200);
    expect(result.body.data).toEqual({ available: false, reason: "TAKEN" });
    const free = await http()
      .get("/Account/username-available")
      .query({ UserName: `${prefix}_free` })
      .expect(200);
    expect(free.body.data).toEqual({ available: true });
    const reserved = await http()
      .get("/Account/username-available")
      .query({ UserName: "LIVE" })
      .expect(200);
    expect(reserved.body.data).toEqual({
      available: false,
      reason: "RESERVED",
    });
    await http()
      .get("/Account/username-available")
      .query({ UserName: "..invalid" })
      .expect(400);
  });
  it("updates username/name/website, preserves omitted fields and identity", async () => {
    const renamed = `${prefix}_renamed`;
    const result = await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({
        userName: renamed.toUpperCase(),
        fullName: "Updated name",
        website: "https://example.com/me",
        about: "Updated bio",
      })
      .expect(200);
    expect(result.body.data).toMatchObject({
      userId: people[0].id,
      userName: renamed,
      fullName: "Updated name",
      website: "https://example.com/me",
      about: "Updated bio",
    });
    const partial = await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ gender: 1 })
      .expect(200);
    expect(partial.body.data).toMatchObject({
      userName: renamed,
      website: "https://example.com/me",
      about: "Updated bio",
    });
    await http()
      .post("/Account/login")
      .send({ userName: renamed, password: "password123" })
      .expect(200);
  });
  it("rejects duplicate/reserved names, unsafe website URLs and unknown fields", async () => {
    await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ userName: people[1].name.toUpperCase() })
      .expect(409);
    await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ userName: "admin" })
      .expect(400);
    await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ website: "javascript:alert(1)" })
      .expect(400);
    await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ fullName: " " })
      .expect(400);
    await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ followersCount: 1000 })
      .expect(400);
    await http()
      .put("/UserProfile/update-user-profile")
      .send({ about: "Unauthorized" })
      .expect(401);
  });
  it("handles competing renames atomically, one success and one conflict", async () => {
    const userName = `${prefix}_race`;
    const results = await Promise.all(
      [1, 2].map((i) =>
        http()
          .put("/UserProfile/update-user-profile")
          .set(auth(i))
          .send({ userName }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.user.count({ where: { userName } })).toBe(1);
  });
  it("can clear the website without clearing the bio", async () => {
    const result = await http()
      .put("/UserProfile/update-user-profile")
      .set(auth(0))
      .send({ website: null })
      .expect(200);
    expect(result.body.data.website).toBeNull();
    expect(result.body.data.about).toBe("Updated bio");
  });
});
