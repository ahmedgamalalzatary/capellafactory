ALTER TABLE `expenses` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
CREATE TABLE `expense_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expense_id` int NOT NULL,
	`amount` decimal(14,3) NOT NULL,
	`payment_method` enum('visa','vodafone_cash','cod','instapay') NOT NULL,
	`paid_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expense_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_purchase_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchase_id` int NOT NULL,
	`amount` decimal(14,3) NOT NULL,
	`payment_method` enum('visa','vodafone_cash','cod','instapay') NOT NULL,
	`paid_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_purchase_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_invoice_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_id` int NOT NULL,
	`amount` decimal(14,3) NOT NULL,
	`payment_method` enum('visa','vodafone_cash','cod','instapay') NOT NULL,
	`paid_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_invoice_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ingredient_purchases` ADD `total_amount` decimal(14,3);--> statement-breakpoint
ALTER TABLE `expense_payments` ADD CONSTRAINT `expense_payments_expense_id_expenses_id_fk` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ingredient_purchase_payments` ADD CONSTRAINT `ingredient_purchase_payments_purchase_fk` FOREIGN KEY (`purchase_id`) REFERENCES `ingredient_purchases`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales_invoice_payments` ADD CONSTRAINT `sales_invoice_payments_invoice_id_sales_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `expense_payments_expense_id_index` ON `expense_payments` (`expense_id`);--> statement-breakpoint
CREATE INDEX `expense_payments_paid_at_index` ON `expense_payments` (`paid_at`);--> statement-breakpoint
CREATE INDEX `ingredient_purchase_payments_purchase_id_index` ON `ingredient_purchase_payments` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `ingredient_purchase_payments_paid_at_index` ON `ingredient_purchase_payments` (`paid_at`);--> statement-breakpoint
CREATE INDEX `sales_invoice_payments_invoice_id_index` ON `sales_invoice_payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `sales_invoice_payments_paid_at_index` ON `sales_invoice_payments` (`paid_at`);--> statement-breakpoint
UPDATE `ingredient_purchases` AS `purchase`
SET `total_amount` = (
	SELECT COALESCE(SUM(`line_total`), 0)
	FROM `ingredient_purchase_lines`
	WHERE `ingredient_purchase_lines`.`purchase_id` = `purchase`.`id`
);--> statement-breakpoint
ALTER TABLE `ingredient_purchases` MODIFY COLUMN `total_amount` decimal(14,3) NOT NULL;--> statement-breakpoint
INSERT INTO `expense_payments` (`expense_id`, `amount`, `payment_method`, `paid_at`)
SELECT `id`, `amount`, 'cod', `occurred_at`
FROM `expenses`;--> statement-breakpoint
INSERT INTO `ingredient_purchase_payments` (`purchase_id`, `amount`, `payment_method`, `paid_at`)
SELECT `id`, `total_amount`, 'cod', `occurred_at`
FROM `ingredient_purchases`;--> statement-breakpoint
INSERT INTO `sales_invoice_payments` (`invoice_id`, `amount`, `payment_method`, `paid_at`)
SELECT `id`, `subtotal`, 'cod', `occurred_at`
FROM `sales_invoices`;
