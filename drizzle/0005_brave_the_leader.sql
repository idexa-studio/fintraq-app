CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_id` integer NOT NULL,
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
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `loans_person_id_idx` ON `loans` (`person_id`);--> statement-breakpoint
CREATE INDEX `loans_status_idx` ON `loans` (`status`);--> statement-breakpoint
CREATE INDEX `loans_currency_idx` ON `loans` (`currency`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`to_account_id` integer,
	`person_id` integer,
	`loan_id` integer,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`datetime` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "account_id", "category_id", "to_account_id", "person_id", "loan_id", "amount", "type", "datetime", "note", "created_at", "updated_at") SELECT "id", "account_id", "category_id", "to_account_id", "person_id", NULL, "amount", "type", "datetime", "note", "created_at", "updated_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `payments_account_id_idx` ON `payments` (`account_id`);--> statement-breakpoint
CREATE INDEX `payments_category_id_idx` ON `payments` (`category_id`);--> statement-breakpoint
CREATE INDEX `payments_to_account_id_idx` ON `payments` (`to_account_id`);--> statement-breakpoint
CREATE INDEX `payments_person_id_idx` ON `payments` (`person_id`);--> statement-breakpoint
CREATE INDEX `payments_datetime_idx` ON `payments` (`datetime`);--> statement-breakpoint
CREATE INDEX `payments_type_idx` ON `payments` (`type`);--> statement-breakpoint
CREATE INDEX `payments_account_datetime_idx` ON `payments` (`account_id`,`datetime`);--> statement-breakpoint
CREATE INDEX `payments_loan_id_idx` ON `payments` (`loan_id`);--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`holderName` text NOT NULL,
	`accountNumber` text NOT NULL,
	`icon` text DEFAULT 'building' NOT NULL,
	`account_type` text DEFAULT 'bank',
	`color` integer NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`income` real DEFAULT 0 NOT NULL,
	`expense` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "name", "holderName", "accountNumber", "icon", "account_type", "color", "isDefault", "currency", "balance", "income", "expense", "created_at", "updated_at") SELECT "id", "name", "holderName", "accountNumber", "icon", NULL, "color", "isDefault", "currency", "balance", "income", "expense", "created_at", "updated_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;