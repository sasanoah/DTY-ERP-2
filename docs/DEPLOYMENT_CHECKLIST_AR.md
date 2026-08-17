# Checklist نشر DTY ERP V1.0 RC3.1

**الحالة:** البوابات الآلية ناجحة؛ Staging/Pilot والتوقيعات التشغيلية مطلوبة قبل Production.

## قبل النشر
- [x] GitHub CI ناجح: migrations/seed/domain/security/typecheck/build/E2E.
- [x] Baseline migration مخزن ومجرب على PostgreSQL 16 فارغ.
- [x] Backup/restore drill مؤتمت ويقارن critical counts وmigration history.
- [x] Production image يرفض placeholder/weak secrets ويعمل read-only بدون Linux capabilities.
- [ ] Review approval على Draft PR.
- [ ] إنشاء secrets فريدة وتخزينها في secret manager.
- [ ] PostgreSQL private/least-privilege وencrypted backup storage.
- [x] Database-backed distributed login rate limiting داخل التطبيق.
- [ ] HTTPS reverse proxy/WAF مع edge rate limiting.
- [ ] تثبيت immutable app/migrator image digests وimage digest السابق للـrollback.
- [ ] أخذ pre-deploy backup وإثات restore على Staging.

## Staging
- [ ] تنفيذ migrator مرة واحدة والتحقق من `migrate deploy`.
- [ ] `/api/health` = 200 و`/api/health/ready` = 200.
- [ ] Smoke: login، POY issue، production run، mass balance، QC، traceability، allocation، invoice/collection، AP payment.
- [ ] التحقق من RBAC/Plant لمستخدمي Warehouse/Operator/QC/Sales/Finance.
- [ ] التحقق من CSP/assets خلف الـreverse proxy.
- [ ] مراقبة 5xx، latency، DB connections، failed login، outbox failures.

## Pilot / Production
- [ ] خمس ورديات reconciled متتالية بدون فرق جوهري.
- [ ] إغلاق Critical/High UAT issues.
- [ ] توقيع Production + Warehouse + QC + Finance.
- [ ] Canary أو ماكينة/وردية واحدة قبل التعميم.
- [ ] مراقبة مكثفة 15 دقيقة ثم حتى نهاية أول وردية.

## Rollback triggers المتفق عليها مسبقًا
- readiness غير ناجح لأكثر من دقيقتين.
- HTTP 5xx > 1% لمدة 5 دقائق أو P95 > 2s لمدة 10 دقائق.
- فشل مسار login، inventory issue، production close، QC release/hold، أو invoice/payment.
- أي negative stock، double allocation/payment، أو فرق مخزون/إنتاج غير مفسر.
- DB errors مستمرة، migration failure، أو outbox failure rate > 5%.
