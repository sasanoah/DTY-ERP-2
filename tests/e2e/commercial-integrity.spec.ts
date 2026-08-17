import {expect, test, type Page} from '@playwright/test';

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'ci-demo-password-change-me';

async function login(page: Page, username: string) {
  const response = await page.request.post('/api/auth/login', {
    data: {username, password: demoPassword},
  });
  expect(response.status()).toBe(200);
}

async function restoreRawBalance(page: Page, lotId: string, qtyKg: number, refId: string) {
  await login(page, 'warehouse');
  const response = await page.request.post('/api/inventory/movements', {
    data: {lotId, movementType: 'ADJUST', qtyKg, refType: 'E2E_RESET', refId},
  });
  expect(response.status()).toBe(200);
}

test.describe('commercial transaction integrity', () => {
  test('concurrent finished-goods allocation reserves stock exactly once', async ({page}) => {
    await login(page, 'prod_mgr');
    const productionContextResponse = await page.request.get(
      '/api/production/operator-context?machine=DTY-CN-01',
    );
    expect(productionContextResponse.status()).toBe(200);
    const productionContext = (await productionContextResponse.json()) as {
      orders: Array<{id: string; orderNo: string}>;
      shifts: Array<{id: string}>;
      lots: Array<{id: string; lotNo: string; availableQtyKg: string | number}>;
      openRun: {id: string} | null;
    };
    expect(productionContext.openRun).toBeNull();
    const productionOrder = productionContext.orders.find(
      (candidate) => candidate.orderNo === 'PRD-26-000512',
    );
    const rawLot = productionContext.lots.find((candidate) => candidate.lotNo === 'POY-2608-0001');
    expect(productionOrder).toBeTruthy();
    expect(productionContext.shifts[0]).toBeTruthy();
    expect(rawLot).toBeTruthy();
    const originalRawBalance = Number(rawLot!.availableQtyKg);
    const refId = `E2E-FG-ALLOCATION-${Date.now()}`;
    let runId: string | undefined;
    let completed = false;

    try {
      const startResponse = await page.request.post('/api/production/runs/start', {
        data: {
          productionOrderId: productionOrder!.id,
          shiftId: productionContext.shifts[0].id,
          poyLotId: rawLot!.id,
          poyIssueKg: 100,
        },
      });
      expect(startResponse.status()).toBe(201);
      runId = ((await startResponse.json()) as {run: {id: string}}).run.id;

      const completeResponse = await page.request.post(`/api/production/runs/${runId}/complete`, {
        data: {gradeAKg: 98, gradeBKg: 0, wasteKg: 2, electricityKwh: 50, downtimeMin: 0},
      });
      expect(completeResponse.status()).toBe(200);
      completed = true;
      const completedBody = (await completeResponse.json()) as {
        finishedLots: Array<{id: string; productId: string; lotNo: string}>;
      };
      const finishedLot = completedBody.finishedLots[0];
      expect(finishedLot).toBeTruthy();

      await login(page, 'quality');
      const releaseResponse = await page.request.post('/api/quality/status', {
        data: {refType: 'FINISHED_LOT', refId: finishedLot.id, status: 'RELEASED'},
      });
      expect(releaseResponse.status()).toBe(200);

      await login(page, 'sales');
      const salesContextResponse = await page.request.get('/api/sales/context');
      expect(salesContextResponse.status()).toBe(200);
      const salesContext = (await salesContextResponse.json()) as {
        customers: Array<{id: string; code: string}>;
        products: Array<{id: string; code: string}>;
      };
      const customer = salesContext.customers.find((candidate) => candidate.code === 'CUST-A');
      const product = salesContext.products.find(
        (candidate) => candidate.code === 'FG-DTY-0300-096-NIM-SD',
      );
      expect(customer).toBeTruthy();
      expect(product?.id).toBe(finishedLot.productId);

      const orderResponse = await page.request.post('/api/sales/orders', {
        data: {
          customerId: customer!.id,
          currency: 'EGP',
          lines: [
            {
              productId: product!.id,
              qtyKg: 80,
              unitPrice: 120,
              requiredDate: new Date(Date.now() + 86_400_000).toISOString(),
            },
          ],
        },
      });
      expect(orderResponse.status()).toBe(201);
      const order = ((await orderResponse.json()) as {order: {id: string}}).order;
      expect((await page.request.post(`/api/sales/orders/${order.id}/confirm`)).status()).toBe(200);

      const allocationResponses = await Promise.all([
        page.request.post(`/api/sales/orders/${order.id}/allocate`),
        page.request.post(`/api/sales/orders/${order.id}/allocate`),
      ]);
      expect(allocationResponses.map((response) => response.status()).sort()).toEqual([200, 409]);

      const ordersResponse = await page.request.get('/api/sales/orders');
      expect(ordersResponse.status()).toBe(200);
      const orderAfter = ((await ordersResponse.json()) as {
        orders: Array<{
          id: string;
          status: string;
          lines: Array<{allocations: Array<{qtyKg: string | number}>}>;
        }>;
      }).orders.find((candidate) => candidate.id === order.id);
      expect(orderAfter?.status).toBe('ALLOCATED');
      const allocated = orderAfter!.lines.flatMap((line) => line.allocations)
        .reduce((total, allocation) => total + Number(allocation.qtyKg), 0);
      expect(allocated).toBe(80);

      await login(page, 'owner');
      const finishedResponse = await page.request.get('/api/inventory/finished');
      expect(finishedResponse.status()).toBe(200);
      const finishedAfter = ((await finishedResponse.json()) as {
        lots: Array<{id: string; reservedQtyKg: string | number; freeQtyKg: number}>;
      }).lots.find((candidate) => candidate.id === finishedLot.id);
      expect(Number(finishedAfter?.reservedQtyKg)).toBe(80);
      expect(Number(finishedAfter?.freeQtyKg)).toBe(18);
    } finally {
      if (runId && !completed) {
        await page.request.post(`/api/production/runs/${runId}/complete`, {
          data: {gradeAKg: 98, gradeBKg: 0, wasteKg: 2, electricityKwh: 50, downtimeMin: 0},
        });
      }
      if (runId) await restoreRawBalance(page, rawLot!.id, originalRawBalance, `${refId}-RESTORE`);
    }
  });

  test('credit override resolves its approval and writes an audit trail', async ({page}) => {
    await login(page, 'sales');
    const contextResponse = await page.request.get('/api/sales/context');
    expect(contextResponse.status()).toBe(200);
    const context = (await contextResponse.json()) as {
      customers: Array<{id: string; code: string}>;
      products: Array<{id: string; code: string}>;
    };
    const customer = context.customers.find((candidate) => candidate.code === 'CUST-B');
    const product = context.products.find((candidate) => candidate.code === 'FG-DTY-0300-096-NIM-SD');
    expect(customer).toBeTruthy();
    expect(product).toBeTruthy();

    const createResponse = await page.request.post('/api/sales/orders', {
      data: {
        customerId: customer!.id,
        currency: 'EGP',
        lines: [
          {
            productId: product!.id,
            qtyKg: 20_000,
            unitPrice: 120,
            requiredDate: new Date(Date.now() + 86_400_000).toISOString(),
          },
        ],
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as {
      order: {id: string; creditStatus: string};
      credit: {blocked: boolean};
    };
    expect(created.credit.blocked).toBe(true);
    expect(created.order.creditStatus).toBe('BLOCKED');

    const blockedConfirm = await page.request.post(`/api/sales/orders/${created.order.id}/confirm`);
    expect(blockedConfirm.status()).toBe(409);
    const approvalId = ((await blockedConfirm.json()) as {approvalId: string}).approvalId;
    expect(approvalId).toBeTruthy();

    await login(page, 'owner');
    const overrideResponse = await page.request.post(
      `/api/sales/orders/${created.order.id}/credit-override`,
    );
    expect(overrideResponse.status()).toBe(200);
    expect((await overrideResponse.json()).order.creditStatus).toBe('OVERRIDE');

    const approvalsResponse = await page.request.get('/api/approvals?status=ALL');
    expect(approvalsResponse.status()).toBe(200);
    const approval = ((await approvalsResponse.json()) as {
      approvals: Array<{id: string; status: string; decidedBy: {username: string} | null}>;
    }).approvals.find((candidate) => candidate.id === approvalId);
    expect(approval).toMatchObject({status: 'APPROVED', decidedBy: {username: 'owner'}});

    const auditResponse = await page.request.get('/api/admin/audit?entityType=SalesOrder');
    expect(auditResponse.status()).toBe(200);
    const overrideAudit = ((await auditResponse.json()) as {
      logs: Array<{entityId: string; action: string; user: {username: string}}>;
    }).logs.find(
      (entry) => entry.entityId === created.order.id && entry.action === 'CREDIT_OVERRIDE',
    );
    expect(overrideAudit).toMatchObject({user: {username: 'owner'}});

    const confirmed = await page.request.post(`/api/sales/orders/${created.order.id}/confirm`);
    expect(confirmed.status()).toBe(200);
    expect((await confirmed.json()).order).toMatchObject({status: 'CONFIRMED', creditStatus: 'OVERRIDE'});
  });

  test('concurrent supplier payments cannot overpay or duplicate the invoice balance', async ({page}) => {
    await login(page, 'owner');
    const procurementResponse = await page.request.get('/api/procurement/context');
    expect(procurementResponse.status()).toBe(200);
    const supplier = ((await procurementResponse.json()) as {
      suppliers: Array<{id: string; code: string}>;
    }).suppliers.find((candidate) => candidate.code === 'SUP-A');
    expect(supplier).toBeTruthy();

    const invoiceNo = `E2E-AP-${Date.now()}`;
    const createResponse = await page.request.post('/api/finance/payables', {
      data: {
        supplierId: supplier!.id,
        invoiceNo,
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
        totalAmount: 100,
        currency: 'EGP',
        exchangeRate: 1,
      },
    });
    expect(createResponse.status()).toBe(201);
    const invoice = ((await createResponse.json()) as {invoice: {id: string}}).invoice;
    const payment = {supplierInvoiceId: invoice.id, amount: 60, method: 'BANK'};

    const competing = await Promise.all([
      page.request.post('/api/finance/payables/payments', {
        data: {...payment, reference: `${invoiceNo}-A`},
      }),
      page.request.post('/api/finance/payables/payments', {
        data: {...payment, reference: `${invoiceNo}-B`},
      }),
    ]);
    expect(competing.map((response) => response.status()).sort()).toEqual([201, 409]);

    const partialResponse = await page.request.get('/api/finance/payables');
    expect(partialResponse.status()).toBe(200);
    const partial = ((await partialResponse.json()) as {
      rows: Array<{
        id: string;
        paid: number;
        outstanding: number;
        payments: number;
        status: string;
      }>;
    }).rows.find((candidate) => candidate.id === invoice.id);
    expect(partial).toMatchObject({paid: 60, outstanding: 40, payments: 1, status: 'PARTIAL'});

    const finalPayment = await page.request.post('/api/finance/payables/payments', {
      data: {
        supplierInvoiceId: invoice.id,
        amount: 40,
        method: 'BANK',
        reference: `${invoiceNo}-FINAL`,
      },
    });
    expect(finalPayment.status()).toBe(201);

    const overpayment = await page.request.post('/api/finance/payables/payments', {
      data: {supplierInvoiceId: invoice.id, amount: 1, method: 'BANK'},
    });
    expect(overpayment.status()).toBe(409);

    const paidResponse = await page.request.get('/api/finance/payables');
    expect(paidResponse.status()).toBe(200);
    const paid = ((await paidResponse.json()) as {
      rows: Array<{
        id: string;
        paid: number;
        outstanding: number;
        payments: number;
        status: string;
      }>;
    }).rows.find((candidate) => candidate.id === invoice.id);
    expect(paid).toMatchObject({paid: 100, outstanding: 0, payments: 2, status: 'PAID'});
  });
});
