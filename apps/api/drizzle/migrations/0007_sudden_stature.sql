ALTER TABLE `ingredients` ADD `average_unit_cost` decimal(14,6) NOT NULL DEFAULT '0.000000';
--> statement-breakpoint
CREATE TABLE `ingredient_purchases` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`invoice_code` varchar(32) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`supplier_id` int,
	`supplier_name` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_purchase_lines` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`purchase_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unit` enum('kg','g','L','ml','piece') NOT NULL,
	`unit_price` decimal(14,3) NOT NULL,
	`line_total` decimal(14,3) NOT NULL,
	`normalized_quantity` decimal(14,3) NOT NULL,
	CONSTRAINT `ingredient_purchase_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredient_purchases_invoice_code_unique` ON `ingredient_purchases` (`invoice_code`);--> statement-breakpoint
CREATE INDEX `ingredient_purchases_occurred_at_index` ON `ingredient_purchases` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `ingredient_purchases_supplier_id_index` ON `ingredient_purchases` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `ingredient_purchase_lines_purchase_id_index` ON `ingredient_purchase_lines` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `ingredient_purchase_lines_ingredient_id_index` ON `ingredient_purchase_lines` (`ingredient_id`);
