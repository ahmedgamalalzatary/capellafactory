import test from "node:test";
import assert from "node:assert/strict";
import {
  allocateSalesInvoiceLineFromLayers,
  calculateSalesInvoiceLineCostFromAllocations,
  resolveSalesInvoiceLineRevenue,
} from "../src/modules/sales-invoices/sales-invoices.allocation.js";
import {
  createSalesInvoicePaymentTotalLookup,
  mapSalesInvoiceLineRow,
  mapSalesInvoiceRowToSalesInvoice,
  mapSalesInvoiceRowsToSalesInvoices,
  normalizeSalesInvoiceSearchQuery,
} from "../src/modules/sales-invoices/sales-invoices.mappers.js";
import {
  SalesInvoiceValidationError,
  validateSalesInvoiceMinimumPrices,
  validateSalesInvoiceNotBackdated,
  validateSalesInvoiceStock,
} from "../src/modules/sales-invoices/sales-invoices.validators.js";

test("maps sales invoice lines into shared line shape", () => {
  const line = mapSalesInvoiceLineRow({
    id: 11,
    productId: 3,
    quantity: "2.000",
    sellingUnitPrice: "45.250",
    lineTotal: "90.500",
    unitCost: "30.125000",
    lineCost: "60.250",
  });

  assert.deepEqual(line, {
    id: 11,
    productId: 3,
    quantity: 2,
    sellingUnitPrice: 45.25,
    lineTotal: 90.5,
    unitCost: 30.125,
    lineCost: 60.25,
  });
});

test("maps sales invoice headers with nested lines", () => {
  const invoice = mapSalesInvoiceRowToSalesInvoice(
    {
      id: 9,
      invoiceCode: "SAL-20260524-0009",
      occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      buyerId: 4,
      baseTotal: "90.500",
      taxState: "active",
      taxType: "amount",
      taxValue: "15.000",
      taxAmount: "15.000",
      totalAfterTax: "105.500",
      discountState: "active",
      discountType: "percentage",
      discountValue: "10.000",
      discountAmount: "10.550",
      finalTotal: "94.950",
      subtotal: "90.500",
      totalCost: "60.250",
      grossProfit: "30.250",
      notes: "urgent",
      createdAt: new Date("2026-05-24T12:05:00.000Z"),
    },
    [
      {
        id: 11,
        productId: 3,
        quantity: "2.000",
        sellingUnitPrice: "45.250",
        lineTotal: "90.500",
        unitCost: "30.125000",
        lineCost: "60.250",
      },
    ],
    40,
  );

  assert.deepEqual(invoice, {
    id: 9,
    invoiceCode: "SAL-20260524-0009",
    occurredAt: "2026-05-24T12:00:00.000Z",
    baseTotal: 90.5,
    taxState: "active",
    taxType: "amount",
    taxValue: 15,
    taxAmount: 15,
    totalAfterTax: 105.5,
    discountState: "active",
    discountType: "percentage",
    discountValue: 10,
    discountAmount: 10.55,
    finalTotal: 94.95,
    buyerId: 4,
    subtotal: 90.5,
    paidAmount: 40,
    remainingAmount: 54.95,
    paymentStatus: "partial",
    totalCost: 60.25,
    grossProfit: 30.25,
    notes: "urgent",
    createdAt: "2026-05-24T12:05:00.000Z",
    lines: [
      {
        id: 11,
        productId: 3,
        quantity: 2,
        sellingUnitPrice: 45.25,
        lineTotal: 90.5,
        unitCost: 30.125,
        lineCost: 60.25,
      },
    ],
  });
});

test("maps listed sales invoice headers with batched lines by invoice id", () => {
  const invoices = mapSalesInvoiceRowsToSalesInvoices(
    [
      {
        id: 9,
        invoiceCode: "SAL-20260524-0009",
        occurredAt: new Date("2026-05-24T12:00:00.000Z"),
        buyerId: 4,
        baseTotal: "90.500",
        taxState: "inactive",
        taxType: null,
        taxValue: "0.000",
        taxAmount: "0.000",
        totalAfterTax: "90.500",
        discountState: "inactive",
        discountType: null,
        discountValue: "0.000",
        discountAmount: "0.000",
        finalTotal: "90.500",
        subtotal: "90.500",
        totalCost: "60.250",
        grossProfit: "30.250",
        notes: "urgent",
        createdAt: new Date("2026-05-24T12:05:00.000Z"),
      },
      {
        id: 10,
        invoiceCode: "SAL-20260524-0010",
        occurredAt: new Date("2026-05-24T12:10:00.000Z"),
        buyerId: 5,
        baseTotal: "30.000",
        taxState: "inactive",
        taxType: null,
        taxValue: "0.000",
        taxAmount: "0.000",
        totalAfterTax: "30.000",
        discountState: "inactive",
        discountType: null,
        discountValue: "0.000",
        discountAmount: "0.000",
        finalTotal: "30.000",
        subtotal: "30.000",
        totalCost: "20.000",
        grossProfit: "10.000",
        notes: null,
        createdAt: new Date("2026-05-24T12:15:00.000Z"),
      },
    ],
    [
      {
        invoiceId: 10,
        id: 13,
        productId: 7,
        quantity: "1.000",
        sellingUnitPrice: "30.000",
        lineTotal: "30.000",
        unitCost: "20.000000",
        lineCost: "20.000",
      },
      {
        invoiceId: 9,
        id: 11,
        productId: 3,
        quantity: "2.000",
        sellingUnitPrice: "45.250",
        lineTotal: "90.500",
        unitCost: "30.125000",
        lineCost: "60.250",
      },
    ],
  );

  assert.deepEqual(
    invoices.map((invoice) => ({
      id: invoice.id,
      notes: invoice.notes,
      lineIds: invoice.lines.map((line) => line.id),
      paymentStatus: invoice.paymentStatus,
    })),
    [
      { id: 9, notes: "urgent", lineIds: [11], paymentStatus: "unpaid" },
      { id: 10, notes: undefined, lineIds: [13], paymentStatus: "unpaid" },
    ],
  );
});

test("creates sales invoice payment total lookup from grouped payment rows", () => {
  const lookup = createSalesInvoicePaymentTotalLookup([
    { invoiceId: 1, paidAmount: "1000.000" },
    { invoiceId: 2, paidAmount: null },
  ]);

  assert.equal(lookup.get(1), 1000);
  assert.equal(lookup.get(2), 0);
});

test("derives sales invoice line total from quantity and selling unit price", () => {
  assert.deepEqual(resolveSalesInvoiceLineRevenue({ quantity: 3, sellingUnitPrice: 12.5 }), {
    sellingUnitPrice: 12.5,
    lineTotal: 37.5,
  });
});

test("calculates sales invoice line cost from fifo product allocations", () => {
  assert.deepEqual(
    calculateSalesInvoiceLineCostFromAllocations([
      { allocatedQuantity: 2, allocatedCost: 60 },
      { allocatedQuantity: 1, allocatedCost: 40 },
    ]),
    {
      quantity: 3,
      lineCost: 100,
      unitCost: 33.333333,
    },
  );
});

test("allocates a sales invoice product line across multiple fifo layers", () => {
  assert.deepEqual(
    allocateSalesInvoiceLineFromLayers(
      {
        productId: 3,
        invoiceId: 9,
        invoiceLineId: 11,
        quantity: 3,
        occurredAt: new Date("2026-05-24T12:00:00.000Z"),
      },
      [
        { id: 101, remainingQuantity: 2, unitCost: 30 },
        { id: 102, remainingQuantity: 5, unitCost: 40 },
      ],
    ),
    {
      allocations: [
        {
          domain: "product",
          itemId: 3,
          outboundDocumentType: "sales-invoice",
          outboundDocumentId: 9,
          outboundLineId: 11,
          stockLayerId: 101,
          allocatedQuantity: "2.000",
          unitCost: "30.000000",
          allocatedCost: "60.000",
          occurredAt: new Date("2026-05-24T12:00:00.000Z"),
        },
        {
          domain: "product",
          itemId: 3,
          outboundDocumentType: "sales-invoice",
          outboundDocumentId: 9,
          outboundLineId: 11,
          stockLayerId: 102,
          allocatedQuantity: "1.000",
          unitCost: "40.000000",
          allocatedCost: "40.000",
          occurredAt: new Date("2026-05-24T12:00:00.000Z"),
        },
      ],
      lineCost: 100,
      unitCost: 33.333333,
    },
  );
});

test("stock validation rejects insufficient product quantity and names it", () => {
  assert.throws(
    () =>
      validateSalesInvoiceStock([
        {
          productId: 2,
          productName: "كرتونة 500مم",
          requestedQuantity: 12,
          availableQuantity: 8,
        },
      ]),
    (error: unknown) =>
      error instanceof SalesInvoiceValidationError &&
      error.message === "المخزون غير كافٍ من: كرتونة 500مم (متاح 8، مطلوب 12)",
  );
});

test("stock validation lists every insufficient product and skips sufficient ones", () => {
  assert.throws(
    () =>
      validateSalesInvoiceStock([
        {
          productId: 1,
          productName: "كيك",
          requestedQuantity: 2,
          availableQuantity: 5,
        },
        {
          productId: 2,
          productName: "بسكويت",
          requestedQuantity: 12,
          availableQuantity: 8,
        },
        {
          productId: 3,
          productName: "معمول",
          requestedQuantity: 7,
          availableQuantity: 1,
        },
      ]),
    (error: unknown) =>
      error instanceof SalesInvoiceValidationError &&
      error.message === "المخزون غير كافٍ من: بسكويت (متاح 8، مطلوب 12)؛ معمول (متاح 1، مطلوب 7)",
  );
});

test("sales invoice minimum price validation rejects selling below product unit cost", () => {
  assert.throws(
    () =>
      validateSalesInvoiceMinimumPrices([
        {
          productId: 2,
          productName: "بسكويت",
          sellingUnitPrice: 39,
          minimumUnitPrice: 40,
        },
      ]),
    (error: unknown) =>
      error instanceof SalesInvoiceValidationError &&
      error.message === "سعر بيع المنتج بسكويت أقل من سعر الوحدة: السعر 39، الحد الأدنى 40",
  );
});

test("sales invoices cannot be backdated", () => {
  assert.throws(
    () =>
      validateSalesInvoiceNotBackdated(
        "2026-05-24T11:00:00.000Z",
        new Date("2026-05-24T12:00:00.000Z"),
      ),
    (error: unknown) =>
      error instanceof SalesInvoiceValidationError &&
      error.message === "لا يمكن إدخال فاتورة بيع بتاريخ سابق",
  );
});

test("normalizes sales invoice search query", () => {
  assert.equal(normalizeSalesInvoiceSearchQuery(undefined), undefined);
  assert.equal(normalizeSalesInvoiceSearchQuery(""), undefined);
  assert.equal(normalizeSalesInvoiceSearchQuery("   "), undefined);
  assert.equal(normalizeSalesInvoiceSearchQuery("  SAL  "), "SAL");
});
