import fs from 'node:fs';
const schema=fs.readFileSync(new URL('../prisma/schema.prisma',import.meta.url),'utf8');
const models=[...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(m=>({name:m[1],body:m[2]}));
const enums=new Set([...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map(m=>m[1]));
const modelNames=new Set(models.map(m=>m.name));
const scalars=new Set(['String','Int','BigInt','Float','Decimal','Boolean','DateTime','Json','Bytes']);
const missingTargets=[];const duplicateFields=[];
for(const model of models){const seen=new Set();for(const raw of model.body.split('\n')){const line=raw.trim();if(!line||line.startsWith('//')||line.startsWith('@@'))continue;const parts=line.split(/\s+/);if(parts.length<2||parts[0].startsWith('@'))continue;const field=parts[0],type=parts[1].replace(/[?\[\]]/g,'');if(seen.has(field))duplicateFields.push(`${model.name}.${field}`);seen.add(field);if(/^[A-Z]/.test(type)&&!scalars.has(type)&&!enums.has(type)&&!modelNames.has(type)&&type!=='Unsupported')missingTargets.push(`${model.name}.${field}->${type}`)}}
const result={ok:missingTargets.length===0&&duplicateFields.length===0,models:models.length,enums:enums.size,missingTypeTargets:missingTargets,duplicateFields};
console.log(JSON.stringify(result,null,2));if(!result.ok)process.exit(1);
