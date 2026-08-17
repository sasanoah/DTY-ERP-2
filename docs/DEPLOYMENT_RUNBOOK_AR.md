# Runbook نشر DTY ERP V1.0-RC.3

## 1. البيئة
- Node.js 22
- PostgreSQL 16+
- HTTPS reverse proxy / WAF
- n8n اختياري للتنبيهات وWhatsApp/Email

## 2. Bootstrap لأول Codex / CI workspace
الحزمة الحالية لا تحتوي `package-lock.json` لأن workspace الإنشاء لا يستطيع الوصول إلى npm.

```bash
npm install --no-audit --no-fund
# راجع package-lock.json ثم commit
npx prisma format
npx prisma validate
npx prisma generate
npm run test:prisma-structure
npm run test:domain
npm run test:structure
npm run security:check
npm run typecheck
npm run build
```

بعد commit للـlockfile غيّر Dockerfile/CI من `npm install` إلى `npm ci`.

## 3. الأسرار
أنشئ `.env` من `.env.example` وغير كل القيم الافتراضية:
- `DATABASE_URL`
- `SESSION_SECRET` — 32+ bytes random
- `INTERNAL_JOB_TOKEN`
- `INTEGRATION_WEBHOOK_SECRET`
- `OPENAI_API_KEY` اختياري
- `SEED_DEMO_PASSWORD` عند seed فقط

## 4. قاعدة بيانات جديدة
لا تستخدم additive migrations القديمة كـbaseline لقاعدة فارغة.

في Staging متصل بـPrisma:
```bash
npx prisma migrate dev --name baseline
```
راجع SQL الناتج، ثم خزنه في Git. للإنتاج:
```bash
npx prisma migrate deploy
```

بديل Pilot سريع فقط قبل وجود migration history:
```bash
npx prisma db push
npm run db:seed
```
ثم يجب توليد baseline صحيح قبل Production.

## 5. ترقية قاعدة V0.6 موجودة
راجع `prisma/legacy-migrations/20260809_v10_rc_full_scope/migration.sql` على نسخة staging وbackup أولًا. لا تنفذه مباشرة على Production بدون مقارنة schema.

## 6. Security Gate
- HTTPS فقط.
- PostgreSQL private network.
- تغيير كلمات مستخدمي Seed.
- مراجعة RBAC/Plant لكل مستخدم.
- Reverse-proxy rate limit إضافة إلى rate limit المحلي.
- Backup encrypted + restore test.
- MFA للإدارة/المالية عند طبقة الهوية أو reverse proxy إلى أن يضاف Native MFA.
- AI Assistant يظل Read-only.

## 7. Pilot
ابدأ بماكينة واحدة ووردية واحدة وصالح بين ERP والورقي:
- POY issue.
- Output A/B/Waste.
- Downtime.
- OEE.
- QC/FG Lot.
- Actual Cost/kg.
- Stock movement.

## 8. Go-Live Gate
لا يتم التعميم قبل:
1. نجاح Prisma validate/typecheck/build/CI.
2. نجاح E2E critical flows.
3. خمس ورديات متتالية reconciled بدون فرق جوهري.
4. إغلاق جميع Critical/High UAT issues.
5. توقيع Production + Warehouse + QC + Finance.
