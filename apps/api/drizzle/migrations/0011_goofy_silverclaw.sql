CREATE TABLE `stock_layer_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` enum('ingredient','product') NOT NULL,
	`item_id` int NOT NULL,
	`outbound_document_type` varchar(64) NOT NULL,
	`outbound_document_id` int NOT NULL,
	`outbound_line_id` int,
	`stock_layer_id` int NOT NULL,
	`allocated_quantity` decimal(14,3) NOT NULL,
	`unit_cost` decimal(14,6) NOT NULL,
	`allocated_cost` decimal(14,3) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_layer_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` enum('ingredient','product') NOT NULL,
	`item_id` int NOT NULL,
	`source_document_type` varchar(64) NOT NULL,
	`source_document_id` int NOT NULL,
	`source_line_id` int,
	`original_quantity` decimal(14,3) NOT NULL,
	`remaining_quantity` decimal(14,3) NOT NULL,
	`unit_cost` decimal(14,6) NOT NULL,
	`total_cost` decimal(14,3) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `stock_layer_allocations_outbound_document_index` ON `stock_layer_allocations` (`outbound_document_type`,`outbound_document_id`,`outbound_line_id`);--> statement-breakpoint
CREATE INDEX `stock_layer_allocations_stock_layer_id_index` ON `stock_layer_allocations` (`stock_layer_id`);--> statement-breakpoint
CREATE INDEX `stock_layer_allocations_domain_item_occurred_at_index` ON `stock_layer_allocations` (`domain`,`item_id`,`occurred_at`,`id`);--> statement-breakpoint
CREATE INDEX `stock_layers_domain_item_occurred_at_index` ON `stock_layers` (`domain`,`item_id`,`occurred_at`,`id`);--> statement-breakpoint
CREATE INDEX `stock_layers_source_document_index` ON `stock_layers` (`source_document_type`,`source_document_id`,`source_line_id`);