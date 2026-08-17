import assert from 'node:assert/strict';
import test from 'node:test';
import {z} from 'zod';
import {apiError} from '../src/lib/rbac';

test('preserves intentional client errors without caching them',async()=>{
  const response=apiError(Object.assign(new Error('رصيد غير كافٍ'),{status:409}));
  assert.equal(response.status,409);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{ok:false,error:'رصيد غير كافٍ'});
});

test('returns structured validation errors',async()=>{
  const parsed=z.object({qty:z.number().positive()}).safeParse({qty:'not-a-number'});
  assert.equal(parsed.success,false);
  if(parsed.success)return;
  const response=apiError(parsed.error);
  const body=await response.json() as {ok:boolean;error:string;issues:unknown[]};
  assert.equal(response.status,400);
  assert.equal(body.error,'VALIDATION_ERROR');
  assert.ok(body.issues.length>0);
});

test('masks server and upstream details and logs only safe metadata',async()=>{
  const original=console.error;
  const logs:unknown[][]=[];
  console.error=(...values:unknown[])=>{logs.push(values)};
  try{
    const secret='postgresql://erp:super-secret@database.internal:5432/dty';
    const response=apiError(Object.assign(new Error(secret),{status:502,code:'P2002'}));
    const body=await response.json() as {ok:boolean;error:string;errorId:string};
    assert.equal(response.status,502);
    assert.equal(body.error,'INTERNAL_ERROR');
    assert.match(body.errorId,/^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get('x-error-id'),body.errorId);
    assert.doesNotMatch(JSON.stringify(body),/super-secret|database\.internal/);
    assert.doesNotMatch(JSON.stringify(logs),/super-secret|database\.internal/);
    assert.match(JSON.stringify(logs),/P2002/);
  }finally{
    console.error=original;
  }
});

test('does not accept invalid status values as client errors',async()=>{
  const original=console.error;
  console.error=()=>{};
  try{
    const response=apiError(Object.assign(new Error('must-not-leak'),{status:200}));
    assert.equal(response.status,500);
    assert.equal((await response.json() as {error:string}).error,'INTERNAL_ERROR');
  }finally{
    console.error=original;
  }
});
