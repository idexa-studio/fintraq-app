CREATE TABLE `recurring_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`account_id` integer,
	`to_account_id` integer,
	`category_id` integer,
	`person_id` integer,
	`note` text DEFAULT '' NOT NULL,
	`cadence` text NOT NULL,
	`anchor_date` text NOT NULL,
	`time` text NOT NULL,
	`next_due` text NOT NULL,
	`mode` text DEFAULT 'ask' NOT NULL,
	`ends` text DEFAULT 'never' NOT NULL,
	`end_date` text,
	`end_times` integer,
	`occurrences` integer DEFAULT 0 NOT NULL,
	`paused` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `recurring_rules_next_due_idx` ON `recurring_rules` (`next_due`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `counts_as_spendable` integer;--> statement-breakpoint
ALTER TABLE `payments` ADD `recurring_rule_id` integer;--> statement-breakpoint
ALTER TABLE `payments` ADD `recurring_date` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_recurring_occurrence_idx` ON `payments` (`recurring_rule_id`,`recurring_date`);