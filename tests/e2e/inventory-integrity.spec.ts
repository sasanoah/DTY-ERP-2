import {expect, test, type Page} from '@playwright/test';

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'ci-demo-password-change-me';

type InventoryLot = {
  id: string;
  lotNo: string;
  availableQtyKg: string | number;
  qcStatus: string;
  warehouse?: {bins: Array<{id: string; code: string}>};
};

async function loginAsWarehouse(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    data: {username: 'warehouse', password: demoPassword},
  });
  expect(response.status()).toBe(200);
}

async function findLot(page: Page, lotNo: string): Promise<InventoryLot> {
  const response = await page.request.get('/api/inventory/lots');
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {lots: InventoryLot[]};
  const lot = body.lots.find((candidate) => candidate.lotNo === lotNo);
  expect(lot, `Expected seeded inventory lot ${lotNo}`).toBeTruthy();
  return lot!;
}

async function adjustBalance(page: Page, lotId: string, qtyKg: number, refId: string) {
  const response = await page.request.post('/api/inventory/movements', {
    data: {lotId, movementType: 'ADJUST', qtyKg, refType: 'E2E_RESET', refId},
  });
  expect(response.status()).toBe(200);
}

test.describe('inventory transaction integrity', () => {
  test.beforeEach(async ({page}) => {
    await loginAsWarehouse(page);
  });

  test('simultaneous issues return the actual serialized balances', async ({page}) => {
    const lot = await findLot(page, 'POY-2608-0001');
    const originalBalance = Number(lot.availableQtyKg);
    const refId = `E2E-CONCURRENT-SUCCESS-${Date.now()}`;

    try {
      await adjustBalance(page, lot.id, 100, `${refId}-SETUP`);
      const responses = await Promise.all([
        page.request.post('/api/inventory/movements', {
          data: {lotId: lot.id, movementType: 'ISSUE', qtyKg: 40, refType: 'E2E', refId},
        }),
        page.request.post('/api/inventory/movements', {
          data: {lotId: lot.id, movementType: 'ISSUE', qtyKg: 40, refType: 'E2E', refId},
        }),
      ]);

      expect(responses.map((response) => response.status())).toEqual([200, 200]);
      const bodies = await Promise.all(responses.map((response) => response.json()));
      expect(bodies.map((body) => Number(body.balanceKg)).sort((a, b) => a - b)).toEqual([20, 60]);
      expect(Number((await findLot(page, lot.lotNo)).availableQtyKg)).toBe(20);
    } finally {
      await adjustBalance(page, lot.id, originalBalance, `${refId}-RESTORE`);
    }
  });

  test('competing issues cannot overdraw released inventory', async ({page}) => {
    const lot = await findLot(page, 'POY-2608-0001');
    const originalBalance = Number(lot.availableQtyKg);
    const refId = `E2E-CONCURRENT-CONFLICT-${Date.now()}`;

    try {
      await adjustBalance(page, lot.id, 100, `${refId}-SETUP`);
      const responses = await Promise.all([
        page.request.post('/api/inventory/movements', {
          data: {lotId: lot.id, movementType: 'ISSUE', qtyKg: 60, refType: 'E2E', refId},
        }),
        page.request.post('/api/inventory/movements', {
          data: {lotId: lot.id, movementType: 'ISSUE', qtyKg: 60, refType: 'E2E', refId},
        }),
      ]);

      expect(responses.map((response) => response.status()).sort()).toEqual([200, 409]);
      expect(Number((await findLot(page, lot.lotNo)).availableQtyKg)).toBe(40);
    } finally {
      await adjustBalance(page, lot.id, originalBalance, `${refId}-RESTORE`);
    }
  });

  test('quality-pending inventory cannot be issued', async ({page}) => {
    const lot = await findLot(page, 'POY-2608-0010');
    expect(lot.qcStatus).toBe('PENDING');
    const before = Number(lot.availableQtyKg);

    const response = await page.request.post('/api/inventory/movements', {
      data: {
        lotId: lot.id,
        movementType: 'ISSUE',
        qtyKg: 1,
        refType: 'E2E',
        refId: `E2E-QC-GUARD-${Date.now()}`,
      },
    });

    expect(response.status()).toBe(409);
    expect(await response.json()).toMatchObject({ok: false});
    expect(Number((await findLot(page, lot.lotNo)).availableQtyKg)).toBe(before);
  });

  test('manual reconciliation accepts zero and storage moves require valid bins', async ({page}) => {
    const lot=await findLot(page,'POY-2608-0001');
    const originalBalance=Number(lot.availableQtyKg);
    const refId=`E2E-MANUAL-STOCK-${Date.now()}`;
    const bins=lot.warehouse?.bins||[];
    expect(bins.length).toBeGreaterThanOrEqual(2);

    try{
      const zero=await page.request.post('/api/inventory/movements',{
        data:{lotId:lot.id,movementType:'ADJUST',qtyKg:0,refType:'E2E',refId:`${refId}-ZERO`},
      });
      expect(zero.status()).toBe(200);
      expect(Number((await zero.json()).balanceKg)).toBe(0);
      expect(Number((await findLot(page,lot.lotNo)).availableQtyKg)).toBe(0);
    }finally{
      await adjustBalance(page,lot.id,originalBalance,`${refId}-RESTORE`);
    }

    const invalidMove=await page.request.post('/api/inventory/movements',{
      data:{lotId:lot.id,movementType:'MOVE',qtyKg:5,refType:'E2E',refId:`${refId}-INVALID`},
    });
    expect(invalidMove.status()).toBe(400);

    const validMove=await page.request.post('/api/inventory/movements',{
      data:{lotId:lot.id,movementType:'MOVE',qtyKg:5,fromBinCode:bins[0].code,toBinCode:bins[1].code,refType:'E2E',refId:`${refId}-MOVE`},
    });
    expect(validMove.status()).toBe(200);
    expect(Number((await validMove.json()).balanceKg)).toBe(originalBalance);
    expect(Number((await findLot(page,lot.lotNo)).availableQtyKg)).toBe(originalBalance);
  });

  test('warehouse traceability resolves the seeded raw-material chain', async ({page}) => {
    const response = await page.request.get('/api/traceability/lot/POY-2608-0001');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ok: true, type: 'POY', raw: {lotNo: 'POY-2608-0001'}});
    expect(Array.isArray(body.raw.movements)).toBe(true);
    expect(Array.isArray(body.raw.materialIssues)).toBe(true);

    await page.goto('/traceability?lot=POY-2608-0001');
    await expect(page.getByRole('heading',{name:'رحلة الإنتاج من POY إلى DTY والعميل'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'سجل حركات المخزون'})).toBeVisible();
    await expect(page.locator('pre')).toHaveCount(0);
  });
});
