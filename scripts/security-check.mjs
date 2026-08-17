import fs from 'node:fs';import path from 'node:path';
const root=new URL('..',import.meta.url),base=new URL('.',root).pathname,issues=[],checks=[];const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const textFiles=[];function walk(p){for(const f of fs.readdirSync(p)){if(['node_modules','.next','.git'].includes(f))continue;const q=path.join(p,f),st=fs.statSync(q);if(st.isDirectory())walk(q);else if(/\.(ts|tsx|js|mjs|json|env|example|md)$/.test(f)||f==='.env.example')textFiles.push(q)}}walk(base);
for(const f of textFiles){const s=fs.readFileSync(f,'utf8'),rel=path.relative(base,f);if(rel==='src/components/LoginForm.tsx'&&/DevOnly123|defaultValue=.*password/i.test(s))issues.push('Default demo password in login UI');if(/OPENAI_API_KEY\s*=\s*["'][^"']{10,}["']/.test(s))issues.push(`Hard-coded OpenAI key in ${rel}`);if(/SESSION_SECRET\s*=\s*["'][^"']{10,}["']/.test(s)&&rel!=='.env.example')issues.push(`Hard-coded session secret in ${rel}`)}
checks.push('no-default-password-in-login','no-hardcoded-api-keys');
const seed=read('prisma/seed.ts');if(/console\.log\([^\n]*demoPassword/.test(seed))issues.push('Seed logs demo password');if(!seed.includes('SEED_DEMO_PASSWORD_REQUIRED'))issues.push('Production seed password guard missing');checks.push('no-seed-password-log','production-seed-password-guard');
const middleware=read('middleware.ts');for(const marker of ['sameOrigin','X-Content-Type-Options','X-Frame-Options','Referrer-Policy'])if(!middleware.includes(marker))issues.push(`Middleware security marker missing: ${marker}`);checks.push('same-origin-write-protection','secure-response-headers');
const login=read('src/app/api/auth/login/route.ts');for(const marker of ['rateCheck','companyId:user.companyId','allowed=roles.includes'])if(!login.includes(marker))issues.push(`Login security marker missing: ${marker}`);checks.push('login-rate-limit','plant-selection-authorization');
const criticalScope={
 'src/app/api/production/orders/route.ts':['machine.findFirst','plantId:s.plantId','companyId:s.companyId'],
 'src/app/api/production/runs/start/route.ts':['shift.findFirst','warehouse:{plantId:s.plantId}','BOM'],
 'src/app/api/inventory/movements/route.ts':['warehouse:{plantId:s.plantId}','inventory.count'],
 'src/app/api/sales/orders/[id]/allocate/route.ts':['plantId:s.plantId','productionRun:{productionOrder:{machine:{plantId:s.plantId'],
 'src/app/api/sales/orders/[id]/confirm/route.ts':['findFirst','plantId:s.plantId','companyId:s.companyId'],
 'src/app/api/sales/orders/[id]/dispatch/route.ts':['plantId:s.plantId','updateMany','qcStatus:\'RELEASED\''],
 'src/app/api/finance/collections/route.ts':['customer:{companyId:s.companyId}'],
 'src/app/api/finance/payables/payments/route.ts':['companyId:s.companyId','updateMany','paidAmount:{increment'],
 'src/app/api/procurement/orders/[id]/approve/route.ts':['plantId:s.plantId','supplier:{companyId:s.companyId}'],
 'src/app/api/quality/holds/[id]/disposition/route.ts':['warehouse:{plantId:s.plantId}','product:{companyId:s.companyId}'],
 'src/app/api/master-data/[entity]/route.ts':['companyId:s.companyId','plantId:s.plantId']
};
for(const [file,markers] of Object.entries(criticalScope)){const s=read(file);for(const m of markers)if(!s.includes(m))issues.push(`Tenant/scope marker missing in ${file}: ${m}`)}checks.push('critical-write-tenant-isolation','sales-confirmation-tenant-isolation','atomic-supplier-payment-reservation');
const apiRoot=new URL('src/app/api',root).pathname;const writeRoutes=[];function routes(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f),st=fs.statSync(p);if(st.isDirectory())routes(p);else if(f==='route.ts'){const s=fs.readFileSync(p,'utf8');if(/export async function (POST|PUT|PATCH|DELETE)/.test(s))writeRoutes.push([path.relative(base,p),s])}}}routes(apiRoot);
for(const [rel,s] of writeRoutes){if(rel.startsWith('src/app/api/auth/'))continue;if(!s.includes('requirePermission')&&!s.includes('requireUser'))issues.push(`Write route without auth helper: ${rel}`)}checks.push('write-routes-authenticated');
const assistant=read('src/app/api/assistant/route.ts');if(/prisma\.[a-zA-Z]+\.(create|update|delete|upsert)\(/.test(assistant))issues.push('AI Assistant contains direct database write');checks.push('ai-assistant-read-only');
if(issues.length){console.error(JSON.stringify({ok:false,issues,checks},null,2));process.exit(1)}console.log(JSON.stringify({ok:true,checks,writeRoutesScanned:writeRoutes.length},null,2));
