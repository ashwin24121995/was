CREATE TABLE `settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` text,
	`role` enum('admin','agent') NOT NULL DEFAULT 'agent',
	`login_method` enum('password') NOT NULL DEFAULT 'password',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_signed_in` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhook_accounts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`api_key` varchar(64) NOT NULL,
	`webhook_url` text,
	`phone_number` varchar(20),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`messages_sent` int NOT NULL DEFAULT 0,
	`messages_received` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_accounts_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`agent_id` int,
	`direction` enum('inbound','outbound') NOT NULL,
	`from_number` varchar(20),
	`to_number` varchar(20),
	`message` text,
	`status` enum('pending','delivered','failed') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
