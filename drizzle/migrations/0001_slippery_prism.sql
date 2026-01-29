ALTER TABLE `users` ADD `open_id` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_open_id_unique` UNIQUE(`open_id`);