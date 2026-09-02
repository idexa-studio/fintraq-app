PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer,
	`type` text NOT NULL,
	`principal` real NOT NULL,
	`currency` text NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`due_date` text,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`emi_reminder_enabled` integer DEFAULT false NOT NULL,
	`emi_reminder_day` integer,
	`emi_reminder_time` text,
	`emi_notification_ids` text,
	`due_reminder_enabled` integer DEFAULT false NOT NULL,
	`due_reminder_days_before` integer,
	`due_notification_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_loans`("id", "person_id", "type", "principal", "currency", "account_id", "category_id", "due_date", "note", "status", "emi_reminder_enabled", "emi_reminder_day", "emi_reminder_time", "emi_notification_ids", "due_reminder_enabled", "due_reminder_days_before", "due_notification_id", "created_at", "updated_at") SELECT "id", "person_id", "type", "principal", "currency", "account_id", "category_id", "due_date", "note", "status", "emi_reminder_enabled", "emi_reminder_day", "emi_reminder_time", "emi_notification_ids", "due_reminder_enabled", "due_reminder_days_before", "due_notification_id", "created_at", "updated_at" FROM `loans`;--> statement-breakpoint
DROP TABLE `loans`;--> statement-breakpoint
ALTER TABLE `__new_loans` RENAME TO `loans`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `loans_person_id_idx` ON `loans` (`person_id`);--> statement-breakpoint
CREATE INDEX `loans_status_idx` ON `loans` (`status`);--> statement-breakpoint
CREATE INDEX `loans_currency_idx` ON `loans` (`currency`);