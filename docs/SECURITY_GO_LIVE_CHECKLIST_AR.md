# DTY ERP — Security & Go-Live Checklist — RC.3

## مطبق في RC.3
- [x] Signed HTTP-only session cookie + SameSite Lax.
- [x] Scrypt password hashing.
- [x] Role/permission checks على المعاملات.
- [x] Company/Plant checks على critical write flows.
- [x] Same-origin blocking للـbrowser cross-origin writes.
- [x] X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy.
- [x] Basic in-process login rate limit.
- [x] Production seed password guard.
- [x] AI Assistant read-only.
- [x] Audit Log للعمليات الحساسة.

## إلزامي قبل Production
- [ ] `SESSION_SECRET` قوي وفريد.
- [x] Generate+commit package-lock ثم CI بـ`npm ci`.
- [x] Prisma validate/generate + clean baseline migration.
- [x] Full semantic typecheck + Next build + E2E.
- [ ] HTTPS/WAF/reverse proxy.
- [ ] Distributed rate limit (Redis/Gateway) إذا أكثر من instance.
- [ ] MFA للإدارة العليا والمالية.
- [ ] PostgreSQL private + least privilege DB user.
- [x] Backup/restore drill آلي في CI. تشفير storage/KMS يضبط في بيئة النشر.
- [ ] CSP نهائي بعد اختبار Next assets.
- [ ] مراجعة RBAC لكل مستخدم وPlant.
- [ ] n8n webhook secret + network restriction.
- [ ] Secret/log redaction وmonitoring للـ5xx/DB/outbox failures.

## سلامة البيانات
- [x] Lot traceability API integration test. يبقى UAT الميداني.
- [x] PENDING/HOLD يمنع issue وتوجد guards للـallocation/dispatch. يبقى UAT الميداني.
- [x] Stock count conflict integration test.
- [x] Concurrent inventory issue integration tests. يبقى concurrent allocation UAT/test.
- [x] Mass balance integration test. يبقى UAT الميداني.
- [ ] Credit override audit UAT.
- [ ] Supplier overpayment rejection UAT.
