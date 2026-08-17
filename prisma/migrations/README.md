# Prisma migrations — DTY ERP V1.0 RC.3

هذا المجلد هو سلسلة migrations المعتمدة للنشر بالترتيب التالي:

1. `000000000000_baseline` — schema الأساسية الكاملة.
2. `20260817172000_scope_quality_holds` — company/plant scope للجودة مع backfill.
3. `20260817180000_harden_sequences_and_outbox` — document sequences وoutbox leases.
4. `20260817193000_distributed_login_throttle` — distributed login throttling.
5. `20260817200000_password_reset_session_revocation` — session versioning وإبطال الجلسات عند تغيير كلمة المرور.

على Staging وProduction شغّل فقط:

```bash
npx prisma migrate deploy
```

لا تستخدم `prisma migrate dev` أو `prisma db push` في بيئات النشر. المجلد `prisma/legacy-migrations/` يحتوي SQL قديمًا للمرجعية أو لترقية قواعد تجريبية سابقة فقط، ولا يدخل في سلسلة `migrate deploy` الحالية.
