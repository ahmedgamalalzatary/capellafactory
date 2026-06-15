CREATE TABLE `buyers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`where` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buyers_id` PRIMARY KEY(`id`),
	CONSTRAINT `buyers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE INDEX `buyers_name_index` ON `buyers` (`name`);
