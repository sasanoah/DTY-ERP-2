# Prisma migrations — RC.3

لا توجد baseline migration معتمدة داخل الحزمة لأن بيئة الإنشاء لم تستطع تشغيل Prisma.

في أول Codex/CI workspace متصل:
1. شغّل `npm install` ثم `npx prisma format && npx prisma validate && npx prisma generate`.
2. استخدم PostgreSQL staging فارغًا.
3. شغّل `npx prisma migrate dev --name baseline` لتوليد baseline من `schema.prisma` الحالية.
4. راجع migration SQL، شغّل الاختبارات، ثم commit مجلد baseline الناتج مع `package-lock.json`.

المجلد `prisma/legacy-migrations/` يحتوي migrations additive قديمة للمرجعية أو لترقية قواعد تجريبية قديمة فقط، ولا يجب تطبيقها على قاعدة جديدة.
