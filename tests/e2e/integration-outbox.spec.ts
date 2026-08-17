import {createServer} from 'node:http';
import {expect, test, type Page} from '@playwright/test';

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'ci-demo-password-change-me';

async function login(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    data: {username: 'owner', password: demoPassword},
  });
  expect(response.status()).toBe(200);
}

test('concurrent outbox workers claim an integration event only once', async ({page}) => {
  let fail = true;
  let webhookRequests = 0;
  let webhookSecret: string | undefined;
  const server = createServer((request, response) => {
    webhookRequests++;
    webhookSecret = request.headers['x-dty-erp-secret'] as string | undefined;
    response.statusCode = fail ? 503 : 200;
    response.end(fail ? 'retry' : 'ok');
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(4010, '0.0.0.0', resolve);
  });

  try {
    await login(page);
    const initial = await page.request.post('/api/integrations/outbox/dispatch?test=1');
    expect(initial.status()).toBe(200);
    const initialResult = await initial.json() as {
      sent: number; failed: number; skipped: boolean; eventId: string;
    };
    expect(initialResult).toMatchObject({sent: 0, failed: 1, skipped: false});
    expect(initialResult.eventId).toBeTruthy();
    expect(webhookRequests).toBe(1);

    fail = false;
    const competing = await Promise.all([
      page.request.post(`/api/integrations/outbox/dispatch?eventId=${initialResult.eventId}`),
      page.request.post(`/api/integrations/outbox/dispatch?eventId=${initialResult.eventId}`),
    ]);
    expect(competing.map((response) => response.status())).toEqual([200, 200]);
    const results = await Promise.all(competing.map((response) => response.json() as Promise<{sent: number}>));
    expect(results.reduce((total, result) => total + result.sent, 0)).toBe(1);
    expect(webhookRequests).toBe(2);
    expect(webhookSecret).toBe('ci-integration-webhook-secret-change-me');

    const statusResponse = await page.request.get('/api/integrations/outbox/dispatch');
    expect(statusResponse.status()).toBe(200);
    const status = (await statusResponse.json()) as {
      recent: Array<{eventType: string; status: string; attempts: number; lockedAt: string | null}>;
    };
    const event = status.recent.find((candidate) => candidate.eventType === 'INTEGRATION_TEST');
    expect(event).toMatchObject({status: 'SENT', attempts: 2, lockedAt: null});
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()));
  }
});
