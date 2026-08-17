# قاعدة البيانات — Baseline / Pilot / Recovery

## لماذا تم فصل migrations القديمة؟
الملفات القديمة كانت additive وتفترض وجود قاعدة V0.5 مسبقًا. لذلك تم نقلها إلى `prisma/legacy-migrations` حتى لا يتم تشغيلها بالخطأ على قاعدة فارغة.

## Pilot / UAT فقط
على قاعدة فارغة غير Production:

```bash
npm install
cp .env.example .env
npm run pilot:bootstrap
```

هذا المسار يستخدم `prisma db push` لتسريع الـPilot ولا يعتبر migration history للإنتاج.

## إنشاء Baseline نظيف قبل Staging/Production
بعد تثبيت الحزم:

```bash
npm run db:baseline
```

الأمر يولّد SQL من Empty Database إلى `schema.prisma` الحالي. راجع الملف الناتج بالكامل ثم:

```bash
npx prisma migrate deploy
```

## النسخ الاحتياطي

```bash
DATABASE_URL='...' npm run db:backup
```

## الاستعادة

```bash
DATABASE_URL='...' npm run db:restore -- backup.dump
```

يجب اختبار Restore فعليًا قبل Go-Live، وليس الاكتفاء بوجود backup file.
