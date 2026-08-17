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

  test('login throttling is atomic, shared, and returns retry guidance', async ({request}) => {
    const username=`missing-rate-limit-${Date.now()}@example.test`;
    const attempts=await Promise.all(Array.from({length:10},()=>request.post('/api/auth/login',{
      data:{username,password:'definitely-invalid'},
    })));
    expect(attempts.filter((response)=>response.status()===429)).toHaveLength(1);
    expect(attempts.filter((response)=>response.status()===401)).toHaveLength(9);

    const blocked=await request.post('/api/auth/login',{
      data:{username,password:'definitely-invalid'},
    });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);
    expect(await blocked.json()).toMatchObject({
      ok:false,
      error:'محاولات دخول كثيرة. حاول لاحقًا',
    });
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

  test('protected requests refresh user status and role assignments', async ({browser}) => {
    const ownerContext = await browser.newContext();
    const warehouseContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const warehousePage = await warehouseContext.newPage();
    await login(ownerPage, 'owner');
    await login(warehousePage, 'warehouse');

    const usersResponse = await ownerPage.request.get('/api/admin/users');
    expect(usersResponse.status()).toBe(200);
    const warehouse = ((await usersResponse.json()) as {
      users: Array<{
        id: string;
        username: string;
        fullNameAr: string;
        mobile: string | null;
        roles: Array<{role: {code: string}; plantId: string | null}>;
      }>;
    }).users.find((candidate) => candidate.username === 'warehouse');
    expect(warehouse).toBeTruthy();
    const roleCodes = [...new Set(warehouse!.roles.map((assignment) => assignment.role.code))];
    const plantId = warehouse!.roles.find((assignment) => assignment.plantId)?.plantId;
    expect(plantId).toBeTruthy();
    const updatePayload = {
      id: warehouse!.id,
      username: warehouse!.username,
      fullNameAr: warehouse!.fullNameAr,
      ...(warehouse!.mobile ? {mobile: warehouse!.mobile} : {}),
      roleCodes,
      plantId,
    };

    try {
      const disable = await ownerPage.request.post('/api/admin/users', {
        data: {...updatePayload, active: false},
      });
      expect(disable.status()).toBe(200);
      const staleSession = await warehousePage.request.get('/api/inventory/lots');
      expect(staleSession.status()).toBe(401);
      expect(await staleSession.json()).toMatchObject({ok: false, error: 'UNAUTHORIZED'});
    } finally {
      const enable = await ownerPage.request.post('/api/admin/users', {
        data: {...updatePayload, active: true},
      });
      expect(enable.status()).toBe(200);
      await ownerContext.close();
      await warehouseContext.close();
    }
  });

  test('validation errors are client errors and settings cannot target another plant', async ({page}) => {
    await login(page, 'owner');
    const invalid = await page.request.post('/api/settings', {data: {key: 'x'}});
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toMatchObject({ok: false, error: 'VALIDATION_ERROR'});
    const response = await page.request.post('/api/settings', {
      data: {key: 'E2E_SCOPE_GUARD', value: {enabled: true}, plantId: 'plant-outside-scope'},
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ok: false, error: 'المصنع غير مصرح'});
  });

  test('unexpected database errors are masked and correlated', async ({page}) => {
    const session=await login(page,'owner');
    const response=await page.request.post('/api/admin/users',{
      data:{
        username:'owner',
        fullNameAr:'اسم مكرر للاختبار',
        password:'duplicate-user-password',
        active:true,
        roleCodes:['OWNER'],
        plantId:session.user.plantId,
      },
    });
    expect(response.status()).toBe(500);
    expect(response.headers()['cache-control']).toBe('no-store');
    const body=await response.json() as {ok:boolean;error:string;errorId:string};
    expect(body).toMatchObject({ok:false,error:'INTERNAL_ERROR'});
    expect(body.errorId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers()['x-error-id']).toBe(body.errorId);
    expect(JSON.stringify(body)).not.toMatch(/Unique constraint|User_username_key|duplicate-user-password/);
  });

  test('quality holds are plant-scoped and reject foreign references', async ({page}) => {
    await login(page, 'quality');
    const rejected = await page.request.post('/api/quality/holds', {
      data: {refType: 'INVENTORY_LOT', refId: 'lot-outside-scope', reason: 'اختبار العزل'},
    });
    expect(rejected.status()).toBe(404);
    expect(await rejected.json()).toMatchObject({
      ok: false,
      error: 'Lot الجودة غير موجود داخل المصنع',
    });

    const itemsResponse = await page.request.get('/api/quality/items');
    expect(itemsResponse.status()).toBe(200);
    const rawLot = ((await itemsResponse.json()) as {
      rawLots: Array<{id: string; lotNo: string}>;
    }).rawLots.find((candidate) => candidate.lotNo === 'POY-2608-0001');
    expect(rawLot).toBeTruthy();
    const createdResponse = await page.request.post('/api/quality/holds', {
      data: {refType: 'INVENTORY_LOT', refId: rawLot!.id, reason: 'اختبار نطاق الجودة'},
    });
    expect(createdResponse.status()).toBe(201);
    const created = ((await createdResponse.json()) as {
      hold: {id: string; companyId: string | null; plantId: string | null};
    }).hold;
    expect(created.companyId).toBeTruthy();
    expect(created.plantId).toBeTruthy();

    const holdsResponse = await page.request.get('/api/quality/holds');
    expect(holdsResponse.status()).toBe(200);
    expect(((await holdsResponse.json()) as {holds: Array<{id: string}>}).holds)
      .toContainEqual(expect.objectContaining({id: created.id}));
    const releases = await Promise.all([
      page.request.post(`/api/quality/holds/${created.id}/disposition`, {
        data: {disposition: 'RELEASED', note: 'إغلاق اختبار النطاق'},
      }),
      page.request.post(`/api/quality/holds/${created.id}/disposition`, {
        data: {disposition: 'REJECTED', note: 'طلب متزامن يجب رفضه'},
      }),
    ]);
    expect(releases.map((response) => response.status()).sort()).toEqual([200, 409]);
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
