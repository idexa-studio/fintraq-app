ALTER TABLE `payments` ADD `to_account_id` integer REFERENCES accounts(id);--> statement-breakpoint
CREATE INDEX `payments_to_account_id_idx` ON `payments` (`to_account_id`);