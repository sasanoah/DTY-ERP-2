# Runbook نشر DTY ERP V1.0 RC3.1

## 1. البيئة
- Node.js 22 للبناء وPostgreSQL 16+ على private network.
- HTTPS reverse proxy / WAF أمام التطبيق.
- n8n اختياري للتنبيهات وWhatsApp/Email.

## 2. Bootstrap / CI
`package-lock.json` مخزن وCI وDocker يستخدمان تثبيتًا حتميًا:

```bash
npm ci
npm run release:gate
```

## 3. الأسرار
أنشئ `.env.production` من `.env.example` وغيّر كل `CHANGE_ME` و`replace-with`. التشغيل سيفشل مبكرًا عند فقد أو ضعف:

- `DATABASE_URL` — PostgreSQL user مخصص بأقل صلاحيات مطلوبة.
- `SESSION_SECRET` — قيمة عشوائية فريدة 32+ حرفًا.
- `LOGIN_THROTTLE_SECRET` — قيمة عشوائية مستقلة 32+ حرفًا لحماية hashes؛ يستخدم `SESSION_SECRET` إذا لم تضبط.
- `INTERNAL_JOB_TOKEN` — 32+ حرفًا عند استخدام job خارجي.
- `INTEGRATION_WEBHOOK_SECRET` — 32+ حرفًا وإلزامي عند ضبط `N8N_WEBHOOK_URL`.
- `OPENAI_API_KEY` اختياري.
- `SEED_DEMO_PASSWORD` يمرر لـseed job فقط ولا يوضع في app runtime.

## 4. Build وMigration والتشغيل
الـbaseline النظيف مخزن في `prisma/migrations`. لا تشغل `migrate dev` ولا `legacy-migrations` على Staging/Production.

```bash
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml up -d
```

خدمة `migrate` تنفذ `prisma migrate deploy`، وتبدأ `app` فقط بعد نجاحها. التطبيق يرتبط بـ`127.0.0.1:${APP_PORT:-3000}` خلف الـreverse proxy.

## 5. Smoke checks
```bash
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:3000/api/health/ready
docker compose --env-file .env.production -f compose.production.yml ps
```

## 6. ترقية قاعدة V0.6 موجودة
راجع `prisma/legacy-migrations/20260809_v10_rc_full_scope/migration.sql` على نسخة Staging وbackup أولًا. لا تنفذه مباشرة على Production بدون schema comparison وخطة رجوع.

## 7. Backup / Restore قبل Migration
```bash
DATABASE_URL='...' npm run db:backup -- /secure/backups/dty-before-release.dump
RESTORE_CONFIRM=YES DATABASE_URL='...restore-drill...' npm run db:restore -- /secure/backups/dty-before-release.dump
```

النسخة يتم التحقق منها وتكتب بـpermission `0600`. الاستعادة transaction واحدة وتتطلب تأكيدًا صريحًا.

## 8. Security Gate
- HTTPS فقط وPostgreSQL private network.
- تغيير كل كلمات مستخدمي Seed ومراجعة RBAC/Plant.
- Database-backed login throttle يعمل بين instances؛ أضف WAF/edge rate limit لمنع الإساءة قبل وصولها للتطبيق.
- Backup storage مشفر وrestore test على Staging.
- MFA للإدارة/المالية عند طبقة الهوية أو reverse proxy إلى أن يضاف Native MFA.
- AI Assistant يظل Read-only.

## 9. Pilot
ابدأ بماكينة واحدة ووردية واحدة وصالح بين ERP والورقي: POY issue، Output A/B/Waste، Downtime، OEE، QC/FG Lot، Actual Cost/kg، Stock movement.

## 10. Rollback
- أوقف النشر عند فشل readiness لأكثر من دقيقتين، HTTP 5xx > 1% لمدة 5 دقائق، فشل login/issue/run/QC، أو أي فرق مخزون غير مفسر.
- أعد نشر image digest السابق. لا تنفذ migration عكسية يدوية.
- إذا كانت migration غير متوافقة للخلف، استعد نسخة pre-deploy إلى قاعدة جديدة ثم حوّل `DATABASE_URL` بعد التحقق.

## 11. Go-Live Gate
لا يتم التعميم قبل:
1. نجاح Prisma validate/typecheck/build/CI وE2E critical flows.
2. نجاح Staging smoke/restore ومراقبة المؤشرات.
3. خمس ورديات متتالية reconciled بدون فرق جوهري.
4. إغلاق جميع Critical/High UAT issues.
5. توقيع Production + Warehouse + QC + Finance.
