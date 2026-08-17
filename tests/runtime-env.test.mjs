import assert from 'node:assert/strict';
import test from 'node:test';
import {runtimeEnvironmentErrors} from '../scripts/runtime-env.mjs';

const valid = {
  DATABASE_URL: 'postgresql://erp:secret@postgres:5432/dty?schema=public',
  SESSION_SECRET: 'a-secure-session-secret-that-is-32-chars',
};

test('accepts the minimum production runtime configuration', () => {
  assert.deepEqual(runtimeEnvironmentErrors(valid), []);
});

test('rejects missing, malformed, and weak required configuration', () => {
  assert.deepEqual(runtimeEnvironmentErrors({}), [
    'DATABASE_URL is required',
    'SESSION_SECRET is required',
  ]);
  assert.deepEqual(runtimeEnvironmentErrors({DATABASE_URL: 'mysql://db', SESSION_SECRET: 'short'}), [
    'DATABASE_URL must be a PostgreSQL URL without example credentials',
    'SESSION_SECRET must be a non-placeholder value of at least 32 characters',
  ]);
  assert.deepEqual(runtimeEnvironmentErrors({
    DATABASE_URL: 'postgresql://dtyerp:dtyerp@postgres:5432/dtyerp',
    SESSION_SECRET: 'replace-with-at-least-32-random-characters',
  }), [
    'DATABASE_URL must be a PostgreSQL URL without example credentials',
    'SESSION_SECRET must be a non-placeholder value of at least 32 characters',
  ]);
});

test('requires strong integration secrets only when integrations are enabled', () => {
  assert.deepEqual(runtimeEnvironmentErrors({...valid, N8N_WEBHOOK_URL: 'https://n8n.example/hook'}), [
    'INTEGRATION_WEBHOOK_SECRET must be a non-placeholder value of at least 32 characters when N8N_WEBHOOK_URL is configured',
  ]);
  assert.deepEqual(runtimeEnvironmentErrors({
    ...valid,
    N8N_WEBHOOK_URL: 'https://n8n.example/hook',
    INTEGRATION_WEBHOOK_SECRET: 'a-webhook-secret-that-is-long-enough',
    INTERNAL_JOB_TOKEN: 'an-internal-token-that-is-long-enough',
  }), []);
});
