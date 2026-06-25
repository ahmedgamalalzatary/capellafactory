CREATE TABLE `solid_assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `qty` int NOT NULL,
  `price_of_one` decimal(14,3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `solid_assets_id` PRIMARY KEY(`id`),
  CONSTRAINT `solid_assets_qty_check` CHECK (`qty` >= 1),
  CONSTRAINT `solid_assets_price_of_one_check` CHECK (`price_of_one` > 0)
);
--> statement-breakpoint
CREATE INDEX `solid_assets_name_index` ON `solid_assets` (`name`);
