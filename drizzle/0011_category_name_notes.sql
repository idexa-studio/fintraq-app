-- Until 2.1.0 a transaction saved with no note had its category's name stored as its note. That copy
-- went stale when the category was changed or renamed, and lists kept showing the old name. A blank
-- note is now stored blank and named by its category as it is; these clear the copies already saved.
-- Nothing shown changes: such a note read exactly as the category's name does now.
UPDATE `payments` SET `note` = '' WHERE `note` = (SELECT `name` FROM `categories` WHERE `categories`.`id` = `payments`.`category_id`);
--> statement-breakpoint
UPDATE `recurring_rules` SET `note` = '' WHERE `note` = (SELECT `name` FROM `categories` WHERE `categories`.`id` = `recurring_rules`.`category_id`);
