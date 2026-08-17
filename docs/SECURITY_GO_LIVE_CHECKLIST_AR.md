# DTY ERP — Security & Go-Live Checklist — RC.3

## مطبق في RC.3
- [x] Signed HTTP-only session cookie + SameSite Lax.
- [x] Scrypt password hashing.
- [x] Role/permission checks على المعاملات.
- [x] Company/Plant checks على critical write flows.
- [x] Same-origin blocking للـbrowser cross-origin writes.
- [x] X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy.
- [x] Database-backed distributed login rate limit مع atomic claims وhashed identifiers.
- [x] Password timing equalization للحسابات غير الموجودة.
- [x] Production seed password guard.
- [x] AI Assistant read-only.
- [x] Audit Log للعمليات الحساسة.
- [x] إعادة التحقق من active user والأدوار الحالية من قاعدة البيانات لكل protected request.
- [x] Password reset يرفع session version ويلغي كل الجلسات السابقة فورًا عبر جميع instances.
- [x] Company/Plant scope على quality holds وtraceability وsettings وapproval decisions مع backfill migration.

## إلزامي قبل Production
- [ ] `SESSION_SECRET` قوي وفريد.
- [x] Generate+commit package-lock ثم CI بـ`npm ci`.
- [x] Prisma validate/generate + clean baseline migration.
- [x] Full semantic typecheck + Next build + E2E.
- [ ] HTTPS/WAF/reverse proxy.
- [x] Distributed rate limit مشترك بين كل instances عبر PostgreSQL. يبقى WAF edge limit مطلوبًا للحماية الشاملة.
- [ ] MFA للإدارة العليا والمالية.
- [ ] PostgreSQL private + least privilege DB user.
- [x] Backup/restore drill آلي في CI. تشفير storage/KMS يضبط في بيئة النشر.
- [ ] CSP نهائي بعد اختبار Next assets.
- [ ] مراجعة RBAC لكل مستخدم وPlant.
- [ ] n8n webhook secret + network restriction.
- [x] API 5xx redaction مع correlation ID وsafe structured log metadata.
- [ ] Central monitoring/alerting للـ5xx/DB/outbox failures وربط `errorId` بمنصة الرصد.

## سلامة البيانات
- [x] Lot traceability API integration test. يبقى UAT الميداني.
- [x] PENDING/HOLD يمنع issue وتوجد guards للـallocation/dispatch. يبقى UAT الميداني.
- [x] Stock count conflict integration test.
- [x] Concurrent inventory issue وfinished-goods allocation integration tests. يبقى UAT الميداني.
- [x] Mass balance integration test. يبقى UAT الميداني.
- [x] Credit override approval/audit integration test. يبقى UAT الميداني.
- [x] Supplier concurrent overpayment rejection integration test. يبقى UAT الميداني.
- [x] Live user deactivation وquality/settings plant isolation integration tests.
- [x] Concurrent document-number وintegration-outbox claim integration tests.
- [x] Atomic workflow claim tests لتحويل الخطط والشحن والفوترة ومنع الـduplicate posting.
- [x] Atomic operational posting tests للتشغيل والتوقف والجرد والصيانة والجودة والاعتمادات.
- [x] Customer adjustment reference isolation integration test.
