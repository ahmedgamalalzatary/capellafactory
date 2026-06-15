CREATE TABLE `production_batch_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unit` enum('kg','g','L','ml','piece') NOT NULL,
	`normalized_quantity` decimal(14,3) NOT NULL,
	`unit_cost` decimal(14,6) NOT NULL,
	`line_cost` decimal(14,3) NOT NULL,
	CONSTRAINT `production_batch_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_code` varchar(32) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`product_id` int NOT NULL,
	`produced_quantity` decimal(14,3) NOT NULL,
	`total_cost` decimal(14,3) NOT NULL,
	`unit_cost` decimal(14,6) NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_batches_batch_code_unique` UNIQUE(`batch_code`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `average_unit_cost` decimal(14,6) DEFAULT '0.000000' NOT NULL;
--> statement-breakpoint
CREATE INDEX `production_batch_lines_batch_id_index` ON `production_batch_lines` (`batch_id`);
--> statement-breakpoint
CREATE INDEX `production_batch_lines_ingredient_id_index` ON `production_batch_lines` (`ingredient_id`);
--> statement-breakpoint
CREATE INDEX `production_batches_occurred_at_index` ON `production_batches` (`occurred_at`);
--> statement-breakpoint
CREATE INDEX `production_batches_product_id_index` ON `production_batches` (`product_id`);

