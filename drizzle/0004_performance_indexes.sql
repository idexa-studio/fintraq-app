CREATE INDEX `payments_type_idx` ON `payments` (`type`);
--> statement-breakpoint
CREATE INDEX `payments_account_datetime_idx` ON `payments` (`account_id`,`datetime`);
