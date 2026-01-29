-- Add openId column for OAuth compatibility
ALTER TABLE `users` ADD COLUMN `open_id` varchar(64) UNIQUE;
