# نشر DTY ERP إلى GitHub / Codex

النسخة الحالية: **V1.0-RC.3**

- Branch: `agent/dty-erp-v1-rc3`
- Commit: `b11dba3 build DTY ERP V1.0 RC3`

## عندما يصبح repository ظاهرًا للـGitHub connector

1. تأكد أن repository اسمه `DTY-ERP` وأن ChatGPT GitHub app لديه وصول إليه.
2. اربط remote للمشروع المحلي:

```bash
git remote add origin <GITHUB_REPO_URL>
```

3. ادفع branch:

```bash
git push -u origin agent/dty-erp-v1-rc3
```

4. افتح Draft PR إلى `main` بعنوان:

`Build DTY ERP V1.0 RC3`

## أو باستخدام الـGit bundle

```bash
git clone DTY_ERP_V1.0_RC3_Git.bundle DTY-ERP
cd DTY-ERP
git checkout agent/dty-erp-v1-rc3
git remote add origin <GITHUB_REPO_URL>
git push -u origin agent/dty-erp-v1-rc3
```

## أول فحوصات Codex/CI بعد الرفع

```bash
npm install
npm run db:generate
npm run typecheck
npm run test:domain
npm run security:check
npm run test:prisma-structure
npm run build
```

ثم تشغيل PostgreSQL نظيف وتوليد baseline migration قبل الـPilot.
