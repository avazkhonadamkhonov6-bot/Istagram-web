# packages/shared — kontrakti API

**Ma'sul:** Avaz (yagona nafare ki tagyir medihad) · **Istifoda:** `apps/api`, `apps/web`

Kontrakt dar BE-02 navishta meshavad (Ruzi 1, to 12:30). Hozir faqat struktura hast.

```
packages/shared/
└─ src/
   ├─ index.ts              eksporti umumi
   ├─ error-codes.ts        kodhoi xato (Spec 00 §2)
   └─ schemas/              Zod: request + response baroi har modul
      ├─ common.ts          UserPreview, Media, pagination
      ├─ auth.ts            Spec 01
      ├─ users.ts           Spec 02
      ├─ media.ts           Spec 03
      ├─ posts.ts           Spec 04
      ├─ feed.ts            Spec 05
      ├─ stories.ts         Spec 06
      ├─ direct.ts          Spec 08
      └─ notifications.ts   Spec 09
```

Agar Abubakr maydoni nav lozim donad — comment dar Issue, Avaz ilova mekunad.
