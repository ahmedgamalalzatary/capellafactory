import type { SalesInvoice, SalesInvoiceInput } from "@capella/shared/sales-invoices/sales-invoice.types";
import { additionalPaymentInputSchema } from "@capella/shared/payments/payment.schema";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  buyersTable,
  productsTable,
  salesInvoiceLinesTable,
  salesInvoicePaymentsTable,
  salesInvoicesTable,
  stockLayerAllocationsTable,
  stockLayersTable,
} from "../../db/schema/index.js";
import { buildSalesInvoiceCode } from "../../services/invoice-code.service.js";
import { recalculateStockBalances } from "../../services/stock-costing.service.js";
import { StockLedgerConflictError } from "../../utils/stock-ledger.js";
import {
  allocateSalesInvoiceLineFromLayers,
  resolveSalesInvoiceLineRevenue,
} from "./sales-invoices.allocation.js";
import {
  mapSalesInvoiceRowToSalesInvoice,
  mapSalesInvoiceRowsToSalesInvoices,
  createSalesInvoicePaymentTotalLookup,
  normalizeSalesInvoiceSearchQuery,
} from "./sales-invoices.mappers.js";
import {
  SalesInvoiceValidationError,
  validateSalesInvoiceMinimumPrices,
  validateSalesInvoiceNotBackdated,
  validateSalesInvoiceStock,
} from "./sales-invoices.validators.js";

export async function listSalesInvoices(query?: string) {
  const normalizedQuery = normalizeSalesInvoiceSearchQuery(query);
  const rows = await db
    .select({
      id: salesInvoicesTable.id,
      invoiceCode: salesInvoicesTable.invoiceCode,
      occurredAt: salesInvoicesTable.occurredAt,
      buyerId: salesInvoicesTable.buyerId,
      subtotal: salesInvoicesTable.subtotal,
      totalCost: salesInvoicesTable.totalCost,
      grossProfit: salesInvoicesTable.grossProfit,
      notes: salesInvoicesTable.notes,
      createdAt: salesInvoicesTable.createdAt,
    })
    .from(salesInvoicesTable)
    .innerJoin(buyersTable, eq(salesInvoicesTable.buyerId, buyersTable.id))
    .where(
      and(
        normalizedQuery
          ? or(
              like(salesInvoicesTable.invoiceCode, `%${normalizedQuery}%`),
              like(buyersTable.name, `%${normalizedQuery}%`),
              like(salesInvoicesTable.notes, `%${normalizedQuery}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(salesInvoicesTable.occurredAt), asc(salesInvoicesTable.id));

  if (rows.length === 0) {
    return [];
  }

  const lines = await db
    .select()
    .from(salesInvoiceLinesTable)
    .where(inArray(salesInvoiceLinesTable.invoiceId, rows.map((row) => row.id)))
    .orderBy(asc(salesInvoiceLinesTable.invoiceId), asc(salesInvoiceLinesTable.id));

  const paymentTotals = await getSalesInvoicePaymentTotals(rows.map((row) => row.id));

  return mapSalesInvoiceRowsToSalesInvoices(rows, lines, paymentTotals);
}

export async function getSalesInvoiceById(id: number) {
  const row = await db.query.salesInvoicesTable.findFirst({
    where: eq(salesInvoicesTable.id, id),
  });

  if (!row) {
    return null;
  }

  const lines = await db
    .select()
    .from(salesInvoiceLinesTable)
    .where(eq(salesInvoiceLinesTable.invoiceId, id))
    .orderBy(asc(salesInvoiceLinesTable.id));

  const paymentTotals = await getSalesInvoicePaymentTotals([id]);

  return mapSalesInvoiceRowToSalesInvoice(
    row,
    lines,
    paymentTotals.get(id) ?? Number(row.subtotal),
  );
}

export async function createSalesInvoice(input: SalesInvoiceInput) {
  validateSalesInvoiceNotBackdated(input.occurredAt);
  const relationState = await validateSalesInvoiceRelations(input);
  const preparedLines = input.lines.map((line) => {
    const product = relationState.productsById.get(line.productId);

    if (!product) {
      throw new SalesInvoiceValidationError("One or more products were not found");
    }

    const revenue = resolveSalesInvoiceLineRevenue(line);

    return {
      ...line,
      ...revenue,
      availableQuantity: Number(product.stockQuantity),
      minimumUnitPrice: Number(product.averageUnitCost),
      productName: product.name,
    };
  });

  validateSalesInvoiceMinimumPrices(
    preparedLines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      sellingUnitPrice: line.sellingUnitPrice,
      minimumUnitPrice: line.minimumUnitPrice,
    })),
  );

  validateSalesInvoiceStock(
    preparedLines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      requestedQuantity: line.quantity,
      availableQuantity: line.availableQuantity,
    })),
  );

  try {
    const insertedId = await db.transaction(async (tx) => {
      const occurredAt = new Date(input.occurredAt);
      const inserted = await tx
        .insert(salesInvoicesTable)
        .values({
          invoiceCode: "",
          occurredAt,
          buyerId: input.buyerId,
          subtotal: "0.000",
          totalCost: "0.000",
          grossProfit: "0.000",
          notes: input.notes,
        })
        .$returningId();

      const invoiceId = inserted[0]?.id;

      if (!invoiceId) {
        throw new Error("Failed to create sales invoice");
      }

      await tx
        .update(salesInvoicesTable)
        .set({ invoiceCode: buildSalesInvoiceCode(occurredAt, invoiceId) })
        .where(eq(salesInvoicesTable.id, invoiceId));

      await tx.insert(salesInvoiceLinesTable).values(
        preparedLines.map((line) => ({
          invoiceId,
          productId: line.productId,
          quantity: line.quantity.toFixed(3),
          sellingUnitPrice: line.sellingUnitPrice.toFixed(3),
          lineTotal: line.lineTotal.toFixed(3),
          unitCost: "0.000000",
          lineCost: "0.000",
        })),
      );

      const insertedLines = await tx
        .select()
        .from(salesInvoiceLinesTable)
        .where(eq(salesInvoiceLinesTable.invoiceId, invoiceId))
        .orderBy(asc(salesInvoiceLinesTable.id));

      let subtotal = 0;
      let totalCost = 0;

      for (const line of insertedLines) {
        subtotal += Number(line.lineTotal);

        const openLayers = await tx
          .select()
          .from(stockLayersTable)
          .where(and(eq(stockLayersTable.domain, "product"), eq(stockLayersTable.itemId, line.productId)))
          .orderBy(asc(stockLayersTable.occurredAt), asc(stockLayersTable.id));

        const allocationResult = allocateSalesInvoiceLineFromLayers(
          {
            productId: line.productId,
            invoiceId,
            invoiceLineId: line.id,
            quantity: Number(line.quantity),
            occurredAt,
          },
          openLayers.map((layer) => ({
            id: layer.id,
            remainingQuantity: Number(layer.remainingQuantity),
            unitCost: Number(layer.unitCost),
          })),
        );

        const allocatedQuantity = allocationResult.allocations.reduce(
          (sum, allocation) => sum + Number(allocation.allocatedQuantity),
          0,
        );

        if (allocatedQuantity < Number(line.quantity)) {
          throw new StockLedgerConflictError(
            line.productId,
            `Insufficient product stock in chronological history for product ${line.productId}`,
          );
        }

        await tx.insert(stockLayerAllocationsTable).values(allocationResult.allocations);

        for (const allocation of allocationResult.allocations) {
          const layer = openLayers.find((candidate) => candidate.id === allocation.stockLayerId);
          if (!layer) {
            throw new Error(`Allocation references unknown layer ${allocation.stockLayerId}`);
          }

          const nextRemaining = Number(layer.remainingQuantity) - Number(allocation.allocatedQuantity);
          await tx
            .update(stockLayersTable)
            .set({ remainingQuantity: nextRemaining.toFixed(3) })
            .where(eq(stockLayersTable.id, layer.id));
        }

        await tx
          .update(salesInvoiceLinesTable)
          .set({
            unitCost: allocationResult.unitCost.toFixed(6),
            lineCost: allocationResult.lineCost.toFixed(3),
          })
          .where(eq(salesInvoiceLinesTable.id, line.id));

        totalCost += allocationResult.lineCost;
      }

      await tx
        .update(salesInvoicesTable)
        .set({
          subtotal: subtotal.toFixed(3),
          totalCost: totalCost.toFixed(3),
          grossProfit: (subtotal - totalCost).toFixed(3),
        })
        .where(eq(salesInvoicesTable.id, invoiceId));

      if (input.paidAmount > 0 && input.paymentMethod && input.paidAt) {
        await tx.insert(salesInvoicePaymentsTable).values({
          invoiceId,
          amount: input.paidAmount.toFixed(3),
          paymentMethod: input.paymentMethod,
          paidAt: new Date(input.paidAt),
        });
      }

      await recalculateStockBalances(tx);

      return invoiceId;
    });

    const invoice = await getSalesInvoiceById(insertedId);

    if (!invoice) {
      throw new Error(`Failed to load created sales invoice with id ${insertedId}`);
    }

    return invoice;
  } catch (error) {
    if (error instanceof StockLedgerConflictError) {
      const conflicting = preparedLines.find((line) => line.productId === error.ingredientId);
      const productLabel = conflicting ? conflicting.productName : `#${error.ingredientId}`;
      throw new SalesInvoiceValidationError(
        `Saving this invoice would make product stock negative for ${productLabel}`,
      );
    }

    throw error;
  }
}

export async function addSalesInvoicePayment(id: number, input: AdditionalPaymentInput) {
  const invoice = await getSalesInvoiceById(id);

  if (!invoice) {
    return null;
  }

  const result = additionalPaymentInputSchema.safeParse({
    ...input,
    remainingAmount: invoice.remainingAmount,
  });

  if (!result.success) {
    throw new SalesInvoiceValidationError(result.error.issues[0]?.message ?? "Invalid payment");
  }

  await db.insert(salesInvoicePaymentsTable).values({
    invoiceId: id,
    amount: input.amount.toFixed(3),
    paymentMethod: input.paymentMethod,
    paidAt: new Date(input.paidAt),
  });

  return getSalesInvoiceById(id);
}

async function getSalesInvoicePaymentTotals(invoiceIds: number[]) {
  if (invoiceIds.length === 0) {
    return new Map<number, number>();
  }

  const rows = await db
    .select({
      invoiceId: salesInvoicePaymentsTable.invoiceId,
      paidAmount: sql<string | null>`sum(${salesInvoicePaymentsTable.amount})`,
    })
    .from(salesInvoicePaymentsTable)
    .where(inArray(salesInvoicePaymentsTable.invoiceId, invoiceIds))
    .groupBy(salesInvoicePaymentsTable.invoiceId);

  return createSalesInvoicePaymentTotalLookup(rows);
}

export async function buyerHasSalesInvoiceHistory(buyerId: number) {
  const invoice = await db.query.salesInvoicesTable.findFirst({
    where: eq(salesInvoicesTable.buyerId, buyerId),
  });

  return Boolean(invoice);
}

async function validateSalesInvoiceRelations(input: SalesInvoiceInput) {
  const buyer = await db.query.buyersTable.findFirst({
    where: eq(buyersTable.id, input.buyerId),
  });

  if (!buyer) {
    throw new SalesInvoiceValidationError("Buyer not found");
  }

  const productIds = [...new Set(input.lines.map((line) => line.productId))];
  const products = await db
    .select()
    .from(productsTable)
    .where(or(...productIds.map((id) => eq(productsTable.id, id))));

  if (products.length !== productIds.length) {
    throw new SalesInvoiceValidationError("One or more products were not found");
  }

  for (const product of products) {
    if (product.isArchived) {
      throw new SalesInvoiceValidationError(`Product ${product.name} is archived`);
    }
  }

  return {
    productsById: new Map(products.map((product) => [product.id, product])),
  };
}
