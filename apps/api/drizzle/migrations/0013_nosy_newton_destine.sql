ALTER TABLE `buyers` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredient_purchase_lines` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredient_purchases` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `ingredients` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `production_batch_lines` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `production_batches` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ingredient_purchase_lines` ADD CONSTRAINT `ingredient_purchase_lines_purchase_id_ingredient_purchases_id_fk` FOREIGN KEY (`purchase_id`) REFERENCES `ingredient_purchases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ingredient_purchase_lines` ADD CONSTRAINT `ingredient_purchase_lines_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ingredient_purchases` ADD CONSTRAINT `ingredient_purchases_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `production_batch_lines` ADD CONSTRAINT `production_batch_lines_batch_id_production_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batches`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `production_batch_lines` ADD CONSTRAINT `production_batch_lines_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `production_batches` ADD CONSTRAINT `production_batches_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `purchase_correction_lines` ADD CONSTRAINT `fk_purchase_correction_lines_correction` FOREIGN KEY (`correction_id`) REFERENCES `purchase_corrections`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `purchase_correction_lines` ADD CONSTRAINT `fk_purchase_correction_lines_source_line` FOREIGN KEY (`source_purchase_line_id`) REFERENCES `ingredient_purchase_lines`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `purchase_correction_lines` ADD CONSTRAINT `purchase_correction_lines_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `purchase_corrections` ADD CONSTRAINT `fk_purchase_corrections_source_purchase` FOREIGN KEY (`source_purchase_id`) REFERENCES `ingredient_purchases`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `stock_layer_allocations` ADD CONSTRAINT `stock_layer_allocations_stock_layer_id_stock_layers_id_fk` FOREIGN KEY (`stock_layer_id`) REFERENCES `stock_layers`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD CONSTRAINT `sales_invoices_buyer_id_buyers_id_fk` FOREIGN KEY (`buyer_id`) REFERENCES `buyers`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales_invoice_lines` ADD CONSTRAINT `sales_invoice_lines_invoice_id_sales_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales_invoice_lines` ADD CONSTRAINT `sales_invoice_lines_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;
