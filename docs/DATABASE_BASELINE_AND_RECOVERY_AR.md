# قاعدة البيانات — Baseline / Pilot / Recovery

## لماذا تم فصل migrations القديمة؟
الملفات القديمة additive وتفترض وجود قاعدة V0.5 مسبقًا. لذلك نقلت إلى `prisma/legacy-migrations` حتى لا تنفذ بالخطأ على قاعدة فارغة.

## Pilot / UAT فقط
على قاعدة فارغة غير Production:

```bash
npm ci
cp .env.example .env
npm run pilot:bootstrap
```

هذا المسار يستخدم `prisma db push` لتسريع Pilot ولا يعتبر migration history للإنتاج.

## Staging / Production
الـbaseline النظيف موجود في `prisma/migrations/000000000000_baseline`. يستخدم Staging/Production فقط:

```bash
npx prisma migrate deploy
```

ويمكن تنفيذه بالـmigrator image في `compose.production.yml` قبل بدء التطبيق.

## النسخ الاحتياطي

```bash
DATABASE_URL='...' npm run db:backup -- /secure/backups/dty-erp.dump
```

السكربت يرفض الكتابة فوق ملف موجود، يكتب بـpermission `0600`، ويتحقق من dump catalog قبل اعتبار النسخة ناجحة.

## الاستعادة

```bash
RESTORE_CONFIRM=YES DATABASE_URL='...' npm run db:restore -- /secure/backups/dty-erp.dump
```

الاستعادة تتحقق من dump وتنفذ كـtransaction واحدة، وتطلب `RESTORE_CONFIRM=YES` لمنع تنفيذها بالخطأ.

## Restore drill آلي

```bash
SOURCE_DATABASE_URL='...' \
RESTORE_ADMIN_URL='postgresql://.../postgres' \
RESTORE_DATABASE_NAME='dty_erp_restore_drill' \
RESTORE_DATABASE_URL='postgresql://.../dty_erp_restore_drill?schema=public' \
npm run db:drill
```

يرفض السكربت أي target لا ينتهي بـ`_restore_drill`، ويقارن أعداد Company/Plant/User/InventoryLot وmigration history بعد الاستعادة. CI يشغل هذا الاختبار مع كل PR.

قبل Go-Live يجب تكرار الـdrill على Staging مع encrypted production-like backup storage، وتسجيل RPO/RTO الفعليين.
