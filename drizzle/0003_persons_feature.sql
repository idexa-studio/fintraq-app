CREATE TABLE `persons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`designation` text,
	`company` text,
	`color` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `persons_name_idx` ON `persons` (`name`);
--> statement-breakpoint
ALTER TABLE `payments` ADD `person_id` integer REFERENCES persons(id);
--> statement-breakpoint
CREATE INDEX `payments_person_id_idx` ON `payments` (`person_id`);
