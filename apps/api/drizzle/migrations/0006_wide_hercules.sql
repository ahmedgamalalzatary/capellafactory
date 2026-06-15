CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('rent','food','water','gas','electricity','internet','salary','other') NOT NULL,
	`amount` decimal(14,3) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`notes` text,
	`employee_name` varchar(255),
	`other_label` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `expenses_type_index` ON `expenses` (`type`);--> statement-breakpoint
CREATE INDEX `expenses_occurred_at_index` ON `expenses` (`occurred_at`);
