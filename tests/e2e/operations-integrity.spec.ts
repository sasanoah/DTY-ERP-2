import {expect, test, type Page} from '@playwright/test';

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'ci-demo-password-change-me';

async function login(page: Page, username: string) {
  const response = await page.request.post('/api/auth/login', {
    data: {username, password: demoPassword},
  });
  expect(response.status()).toBe(200);
}

async function adjustBalance(page: Page, lotId: string, qtyKg: number, refId: string) {
  await login(page, 'warehouse');
  const response = await page.request.post('/api/inventory/movements', {
    data: {lotId, movementType: 'ADJUST', qtyKg, refType: 'E2E_RESET', refId},
  });
  expect(response.status()).toBe(200);
}

test.describe('operational posting integrity', () => {
  test('competing plan conversions claim workflows once and allocate unique order numbers', async ({page}) => {
    await login(page, 'prod_mgr');
    const contextResponse = await page.request.get('/api/production/plans');
    expect(contextResponse.status()).toBe(200);
    const context = (await contextResponse.json()) as {
      products: Array<{id: string}>;
      machines: Array<{id: string}>;
    };
    expect(context.products[0]).toBeTruthy();
    expect(context.machines[0]).toBeTruthy();

    const start = new Date(Date.now() + 2 * 86_400_000);
    const end = new Date(start.getTime() + 2 * 86_400_000);
    const lines = [0, 1].map((offset) => ({
      productId: context.products[0].id,
      machineId: context.machines[0].id,
      plannedQtyKg: 10 + offset,
      plannedStart: new Date(start.getTime() + offset * 3_600_000).toISOString(),
      plannedEnd: new Date(start.getTime() + (offset + 1) * 3_600_000).toISOString(),
      priority: 'NORMAL',
    }));
    const createPlan = async (notes: string) => {
      const response = await page.request.post('/api/production/plans', {
        data: {startDate: start.toISOString(), endDate: end.toISOString(), notes, lines},
      });
      expect(response.status()).toBe(201);
      return ((await response.json()) as {plan: {id: string}}).plan;
    };
    const [first, second] = await Promise.all([
      createPlan(`E2E-CONVERSION-A-${Date.now()}`),
      createPlan(`E2E-CONVERSION-B-${Date.now()}`),
    ]);
    for (const plan of [first, second]) {
      const response = await page.request.post(`/api/production/plans/${plan.id}/action`, {
        data: {action: 'APPROVE'},
      });
      expect(response.status()).toBe(200);
    }

    const conversions = await Promise.all([
      page.request.post(`/api/production/plans/${first.id}/action`, {data: {action: 'CONVERT'}}),
      page.request.post(`/api/production/plans/${first.id}/action`, {data: {action: 'CONVERT'}}),
      page.request.post(`/api/production/plans/${second.id}/action`, {data: {action: 'CONVERT'}}),
    ]);
    expect(conversions.map((response) => response.status()).sort()).toEqual([200, 200, 409]);
    const successful = conversions.filter((response) => response.status() === 200);
    const orderNumbers = (await Promise.all(successful.map(async (response) =>
      ((await response.json()) as {orders: Array<{orderNo: string}>}).orders)))
      .flat()
      .map((order) => order.orderNo);
    expect(orderNumbers).toHaveLength(4);
    expect(new Set(orderNumbers).size).toBe(4);
    expect(orderNumbers.every((orderNo) => /^PRD-\d{2}-\d{6}$/.test(orderNo))).toBe(true);
  });

  test('stock counts require all lines and reject posting after stock changes', async ({page}) => {
    await login(page, 'warehouse');
    const inventoryResponse = await page.request.get('/api/inventory/lots');
    expect(inventoryResponse.status()).toBe(200);
    const inventory = (await inventoryResponse.json()) as {
      lots: Array<{
        id: string;
        lotNo: string;
        availableQtyKg: string | number;
        warehouse: {id: string};
      }>;
    };
    const lot = inventory.lots.find((candidate) => candidate.lotNo === 'POY-2608-0004');
    expect(lot).toBeTruthy();
    const originalBalance = Number(lot!.availableQtyKg);
    const refId = `E2E-STOCK-COUNT-${Date.now()}`;
    let stockChanged = false;

    try {
      const createResponse = await page.request.post('/api/inventory/counts', {
        data: {warehouseId: lot!.warehouse.id, notes: refId},
      });
      expect(createResponse.status()).toBe(201);
      const created = (await createResponse.json()) as {
        count: {
          id: string;
          lines: Array<{id: string; inventoryLotId: string; systemQtyKg: string | number}>;
        };
      };
      expect(created.count.lines.length).toBeGreaterThan(1);

      const incompleteResponse = await page.request.post(
        `/api/inventory/counts/${created.count.id}/action`,
        {
          data: {
            action: 'SUBMIT',
            lines: [
              {
                lineId: created.count.lines[0].id,
                countedQtyKg: Number(created.count.lines[0].systemQtyKg),
              },
            ],
          },
        },
      );
      expect(incompleteResponse.status()).toBe(400);

      const listResponse = await page.request.get('/api/inventory/counts');
      expect(listResponse.status()).toBe(200);
      const listed = (await listResponse.json()) as {
        counts: Array<{id: string; status: string}>;
      };
      expect(listed.counts.find((count) => count.id === created.count.id)?.status).toBe('COUNTING');

      const submitResponse = await page.request.post(
        `/api/inventory/counts/${created.count.id}/action`,
        {
          data: {
            action: 'SUBMIT',
            lines: created.count.lines.map((line) => ({
              lineId: line.id,
              countedQtyKg: Number(line.systemQtyKg),
            })),
          },
        },
      );
      expect(submitResponse.status()).toBe(200);

      const approveResponse = await page.request.post(
        `/api/inventory/counts/${created.count.id}/action`,
        {data: {action: 'APPROVE'}},
      );
      expect(approveResponse.status()).toBe(200);

      const issueResponse = await page.request.post('/api/inventory/movements', {
        data: {lotId: lot!.id, movementType: 'ISSUE', qtyKg: 1, refType: 'E2E', refId},
      });
      expect(issueResponse.status()).toBe(200);
      stockChanged = true;

      const postResponse = await page.request.post(
        `/api/inventory/counts/${created.count.id}/action`,
        {data: {action: 'POST'}},
      );
      expect(postResponse.status()).toBe(409);
      expect((await postResponse.json()).error).toContain('تغير رصيد');
    } finally {
      if (stockChanged) await adjustBalance(page, lot!.id, originalBalance, `${refId}-RESTORE`);
    }
  });

  test('production runs cannot close with an unbalanced material total', async ({page}) => {
    await login(page, 'prod_mgr');
    const contextResponse = await page.request.get('/api/production/operator-context?machine=DTY-CN-02');
    expect(contextResponse.status()).toBe(200);
    const context = (await contextResponse.json()) as {
      orders: Array<{id: string; orderNo: string}>;
      shifts: Array<{id: string}>;
      lots: Array<{id: string; lotNo: string; availableQtyKg: string | number}>;
      openRun: {id: string} | null;
    };
    expect(context.openRun).toBeNull();
    const order = context.orders.find((candidate) => candidate.orderNo === 'PRD-26-000513');
    const lot = context.lots.find((candidate) => candidate.lotNo === 'POY-2608-0001');
    expect(order).toBeTruthy();
    expect(context.shifts[0]).toBeTruthy();
    expect(lot).toBeTruthy();
    const originalBalance = Number(lot!.availableQtyKg);
    const refId = `E2E-MASS-BALANCE-${Date.now()}`;
    let runId: string | undefined;
    let completed = false;

    try {
      const startResponse = await page.request.post('/api/production/runs/start', {
        data: {
          productionOrderId: order!.id,
          shiftId: context.shifts[0].id,
          poyLotId: lot!.id,
          poyIssueKg: 100,
        },
      });
      expect(startResponse.status()).toBe(201);
      const started = (await startResponse.json()) as {run: {id: string}};
      runId = started.run.id;

      const invalidClose = await page.request.post(`/api/production/runs/${runId}/complete`, {
        data: {gradeAKg: 90, gradeBKg: 0, wasteKg: 0, electricityKwh: 50, downtimeMin: 0},
      });
      expect(invalidClose.status()).toBe(409);
      expect((await invalidClose.json()).error).toContain('ميزان الكتلة');

      const afterRejectedClose = await page.request.get(
        '/api/production/operator-context?machine=DTY-CN-02',
      );
      expect(afterRejectedClose.status()).toBe(200);
      expect((await afterRejectedClose.json()).openRun?.id).toBe(runId);

      const validClose = await page.request.post(`/api/production/runs/${runId}/complete`, {
        data: {gradeAKg: 98, gradeBKg: 0, wasteKg: 2, electricityKwh: 50, downtimeMin: 0},
      });
      expect(validClose.status()).toBe(200);
      completed = true;
    } finally {
      if (runId && !completed) {
        await page.request.post(`/api/production/runs/${runId}/complete`, {
          data: {gradeAKg: 98, gradeBKg: 0, wasteKg: 2, electricityKwh: 50, downtimeMin: 0},
        });
      }
      if (runId) await adjustBalance(page, lot!.id, originalBalance, `${refId}-RESTORE`);
    }
  });
});
