CREATE TABLE `sales_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_code` varchar(32) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`buyer_id` int NOT NULL,
	`subtotal` decimal(14,3) NOT NULL,
	`total_cost` decimal(14,3) NOT NULL,
	`gross_profit` decimal(14,3) NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_invoices_invoice_code_unique` UNIQUE(`invoice_code`)
);
--> statement-breakpoint
CREATE TABLE `sales_invoice_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_id` int NOT NULL,
	`product_id` int NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`selling_unit_price` decimal(14,3) NOT NULL,
	`line_total` decimal(14,3) NOT NULL,
	`unit_cost` decimal(14,6) NOT NULL,
	`line_cost` decimal(14,3) NOT NULL,
	CONSTRAINT `sales_invoice_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sales_invoices_occurred_at_index` ON `sales_invoices` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `sales_invoices_buyer_id_index` ON `sales_invoices` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_lines_invoice_id_index` ON `sales_invoice_lines` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_lines_product_id_index` ON `sales_invoice_lines` (`product_id`);
