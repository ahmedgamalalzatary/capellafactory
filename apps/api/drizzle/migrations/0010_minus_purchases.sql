CREATE TABLE `purchase_correction_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`correction_id` int NOT NULL,
	`source_purchase_line_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(14,3) NOT NULL,
	`unit` enum('kg','g','L','ml','piece') NOT NULL,
	`unit_price` decimal(14,3) NOT NULL,
	`line_total` decimal(14,3) NOT NULL,
	`normalized_quantity` decimal(14,3) NOT NULL,
	CONSTRAINT `purchase_correction_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_purchase_id` int NOT NULL,
	`reason` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `purchase_correction_lines_correction_id_index` ON `purchase_correction_lines` (`correction_id`);--> statement-breakpoint
CREATE INDEX `purchase_correction_lines_source_purchase_line_id_index` ON `purchase_correction_lines` (`source_purchase_line_id`);--> statement-breakpoint
CREATE INDEX `purchase_correction_lines_ingredient_id_index` ON `purchase_correction_lines` (`ingredient_id`);--> statement-breakpoint
CREATE INDEX `purchase_corrections_source_purchase_id_index` ON `purchase_corrections` (`source_purchase_id`);