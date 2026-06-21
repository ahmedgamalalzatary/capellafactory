ALTER TABLE `ingredient_purchases`
	ADD `base_total` decimal(14,3) NOT NULL,
	ADD `tax_state` enum('active','inactive') NOT NULL,
	ADD `tax_type` enum('amount','percentage'),
	ADD `tax_value` decimal(14,3) NOT NULL,
	ADD `tax_amount` decimal(14,3) NOT NULL,
	ADD `total_after_tax` decimal(14,3) NOT NULL,
	ADD `discount_state` enum('active','inactive') NOT NULL,
	ADD `discount_type` enum('amount','percentage'),
	ADD `discount_value` decimal(14,3) NOT NULL,
	ADD `discount_amount` decimal(14,3) NOT NULL,
	ADD `final_total` decimal(14,3) NOT NULL;--> statement-breakpoint
CREATE INDEX `ingredient_purchases_final_total_index` ON `ingredient_purchases` (`final_total`);--> statement-breakpoint

ALTER TABLE `sales_invoices`
	ADD `base_total` decimal(14,3) NOT NULL,
	ADD `tax_state` enum('active','inactive') NOT NULL,
	ADD `tax_type` enum('amount','percentage'),
	ADD `tax_value` decimal(14,3) NOT NULL,
	ADD `tax_amount` decimal(14,3) NOT NULL,
	ADD `total_after_tax` decimal(14,3) NOT NULL,
	ADD `discount_state` enum('active','inactive') NOT NULL,
	ADD `discount_type` enum('amount','percentage'),
	ADD `discount_value` decimal(14,3) NOT NULL,
	ADD `discount_amount` decimal(14,3) NOT NULL,
	ADD `final_total` decimal(14,3) NOT NULL;--> statement-breakpoint
CREATE INDEX `sales_invoices_final_total_index` ON `sales_invoices` (`final_total`);--> statement-breakpoint

ALTER TABLE `expenses`
	ADD `base_total` decimal(14,3) NOT NULL,
	ADD `tax_state` enum('active','inactive') NOT NULL,
	ADD `tax_type` enum('amount','percentage'),
	ADD `tax_value` decimal(14,3) NOT NULL,
	ADD `tax_amount` decimal(14,3) NOT NULL,
	ADD `total_after_tax` decimal(14,3) NOT NULL,
	ADD `discount_state` enum('active','inactive') NOT NULL,
	ADD `discount_type` enum('amount','percentage'),
	ADD `discount_value` decimal(14,3) NOT NULL,
	ADD `discount_amount` decimal(14,3) NOT NULL,
	ADD `final_total` decimal(14,3) NOT NULL;--> statement-breakpoint
CREATE INDEX `expenses_final_total_index` ON `expenses` (`final_total`);
