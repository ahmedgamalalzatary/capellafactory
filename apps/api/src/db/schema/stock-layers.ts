import {
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const stockLayersTable = mysqlTable(
  "stock_layers",
  {
    id: int("id").autoincrement().primaryKey(),
    domain: mysqlEnum("domain", ["ingredient", "product"]).notNull(),
    itemId: int("item_id").notNull(),
    sourceDocumentType: varchar("source_document_type", { length: 64 }).notNull(),
    sourceDocumentId: int("source_document_id").notNull(),
    sourceLineId: int("source_line_id"),
    originalQuantity: decimal("original_quantity", { precision: 14, scale: 3 }).notNull(),
    remainingQuantity: decimal("remaining_quantity", { precision: 14, scale: 3 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 14, scale: 6 }).notNull(),
    totalCost: decimal("total_cost", { precision: 14, scale: 3 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    domainItemOccurredAtIndex: index("stock_layers_domain_item_occurred_at_index").on(
      table.domain,
      table.itemId,
      table.occurredAt,
      table.id,
    ),
    sourceDocumentIndex: index("stock_layers_source_document_index").on(
      table.sourceDocumentType,
      table.sourceDocumentId,
      table.sourceLineId,
    ),
  }),
);

export const stockLayerAllocationsTable = mysqlTable(
  "stock_layer_allocations",
  {
    id: int("id").autoincrement().primaryKey(),
    domain: mysqlEnum("domain", ["ingredient", "product"]).notNull(),
    itemId: int("item_id").notNull(),
    outboundDocumentType: varchar("outbound_document_type", { length: 64 }).notNull(),
    outboundDocumentId: int("outbound_document_id").notNull(),
    outboundLineId: int("outbound_line_id"),
    stockLayerId: int("stock_layer_id")
      .notNull()
      .references(() => stockLayersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    allocatedQuantity: decimal("allocated_quantity", { precision: 14, scale: 3 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 14, scale: 6 }).notNull(),
    allocatedCost: decimal("allocated_cost", { precision: 14, scale: 3 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    outboundDocumentIndex: index("stock_layer_allocations_outbound_document_index").on(
      table.outboundDocumentType,
      table.outboundDocumentId,
      table.outboundLineId,
    ),
    stockLayerIdIndex: index("stock_layer_allocations_stock_layer_id_index").on(
      table.stockLayerId,
    ),
    domainItemOccurredAtIndex: index("stock_layer_allocations_domain_item_occurred_at_index").on(
      table.domain,
      table.itemId,
      table.occurredAt,
      table.id,
    ),
  }),
);
