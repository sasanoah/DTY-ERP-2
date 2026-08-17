import {expect, test, type Page} from '@playwright/test';

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'ci-demo-password-change-me';

async function login(page: Page, username: string) {
  const response = await page.request.post('/api/auth/login', {
    data: {username, password: demoPassword},
  });
  expect(response.status()).toBe(200);
  return response.json() as Promise<{
    ok: true;
    user: {username: string; roles: string[]; plantId?: string};
  }>;
}

test.describe('production security and RBAC boundaries', () => {
  test('health endpoints are public, ready, and hardened', async ({request}) => {
    const live = await request.get('/api/health');
    expect(live.status()).toBe(200);
    expect(await live.json()).toMatchObject({ok: true, status: 'live'});
    expect(live.headers()['x-content-type-options']).toBe('nosniff');
    expect(live.headers()['x-frame-options']).toBe('DENY');

    const ready = await request.get('/api/health/ready');
    expect(ready.status()).toBe(200);
    expect(await ready.json()).toMatchObject({
      ok: true,
      status: 'ready',
      database: 'up',
    });
  });

  test('unauthenticated users are redirected and APIs return 401', async ({page}) => {
    const api = await page.request.get('/api/inventory/lots');
    expect(api.status()).toBe(401);
    expect(await api.json()).toMatchObject({ok: false, error: 'UNAUTHORIZED'});

    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', {name: 'DTY ERP'})).toBeVisible();
  });

  test('invalid credentials fail and owner login reaches the full ERP', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('اسم المستخدم').fill('owner');
    await page.getByLabel('كلمة المرور').fill('incorrect-password');
    await page.getByRole('button', {name: 'دخول'}).click();
    await expect(page.getByText('بيانات الدخول غير صحيحة')).toBeVisible();

    await page.getByLabel('كلمة المرور').fill(demoPassword);
    await page.getByRole('button', {name: 'دخول'}).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('مصنع 2100 • owner')).toBeVisible();
    await expect(page.getByRole('link', {name: 'المستخدمون'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'أوامر البيع'})).toBeVisible();
  });

  test('warehouse role sees inventory but cannot access sales APIs', async ({page}) => {
    const session = await login(page, 'warehouse');
    expect(session.user.roles).toContain('WAREHOUSE');
    expect(session.user.plantId).toBeTruthy();

    const inventory = await page.request.get('/api/inventory/lots');
    expect(inventory.status()).toBe(200);
    const inventoryBody = await inventory.json();
    expect(inventoryBody.ok).toBe(true);
    expect(inventoryBody.lots.length).toBeGreaterThan(0);

    const sales = await page.request.get('/api/sales/context');
    expect(sales.status()).toBe(403);
    expect(await sales.json()).toMatchObject({ok: false, error: 'FORBIDDEN'});

    await page.goto('/');
    await expect(page.getByRole('link', {name: 'مخزون POY'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'أوامر البيع'})).toHaveCount(0);
    await expect(page.getByRole('link', {name: 'المستخدمون'})).toHaveCount(0);
  });

  test('plant selection rejects unauthorized identifiers', async ({request}) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'warehouse',
        password: demoPassword,
        plantId: 'plant-outside-user-scope',
      },
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: 'المصنع المختار غير مصرح به',
    });
  });

  test('cross-origin writes are rejected before route execution', async ({request}) => {
    const response = await request.post('/api/inventory/movements', {
      headers: {origin: 'https://attacker.example'},
      data: {},
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: 'CROSS_ORIGIN_WRITE_BLOCKED',
    });
  });

  test('forged cookies cannot authenticate API requests', async ({browser}) => {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'dty_erp_session',
        value: 'forged.invalid-signature',
        url: 'http://localhost:3000',
      },
    ]);
    const response = await context.request.get('/api/inventory/lots');
    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ok: false, error: 'UNAUTHORIZED'});
    await context.close();
  });

  test('logout clears the session and protected access is revoked', async ({page}) => {
    await login(page, 'owner');
    expect((await page.request.get('/api/sales/context')).status()).toBe(200);
    expect((await page.request.post('/api/auth/logout')).status()).toBe(200);
    expect((await page.request.get('/api/sales/context')).status()).toBe(401);
  });
});
