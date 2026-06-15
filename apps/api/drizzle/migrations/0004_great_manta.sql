CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit_family` enum('weight','volume') NOT NULL,
	`base_unit` enum('g','ml') NOT NULL,
	`stock_quantity` decimal(14,3) NOT NULL DEFAULT '0.000',
	`has_history` boolean NOT NULL DEFAULT false,
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingredients_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`stock_quantity` decimal(14,3) NOT NULL DEFAULT '0.000',
	`has_history` boolean NOT NULL DEFAULT false,
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE INDEX `ingredients_name_index` ON `ingredients` (`name`);--> statement-breakpoint
CREATE INDEX `products_name_index` ON `products` (`name`);
