# V1.0-RC.3 — Release Engineering

أضيف في هذه النسخة:
- فصل legacy additive migrations عن مسار النشر الجديد.
- أمر توليد Clean Prisma Baseline من schema الحالي.
- Pilot bootstrap لقاعدة فارغة باستخدام db push خارج Production فقط.
- Liveness endpoint `/api/health`.
- Database readiness endpoint `/api/health/ready`.
- Release gate موحد.
- PostgreSQL backup/restore scripts.
- CI مع PostgreSQL 16 service.
- `package-lock.json` مخزن، وDocker/CI يستخدمان `npm ci`.
- Production startup يرفض missing/weak/placeholder secrets قبل استقبال traffic.
- Docker migrator target منفصل، runtime read-only/least-privilege، وdatabase-backed health check.
- Backup/restore drill آلي في CI مع transactional restore وcritical-count verification.

## شرط الخروج من RC
لا يتحول الإصدار إلى V1.0.0 إلا بعد نجاح:
1. `npm ci` على Registry طبيعي.
2. `npx prisma generate` و`npx prisma validate`.
3. Clean baseline migration ومراجعته.
4. `npm run typecheck`.
5. Business tests.
6. `npm run build`.
7. UAT لدورة POY → DTY → QC → Sales → Invoice → Collection، ودورة AP والجرد.
8. Backup + Restore drill آلي، ثم تكراره على Staging بـencrypted storage.
