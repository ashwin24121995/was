CREATE TABLE `agent_accounts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`account_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breaks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`time_log_id` int NOT NULL,
	`break_type` enum('lunch','short','other') NOT NULL,
	`start_at` timestamp NOT NULL,
	`end_at` timestamp,
	`duration` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `breaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_notes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`tag_name` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`customer_phone` varchar(20) NOT NULL,
	`customer_name` text,
	`last_message_at` timestamp NOT NULL DEFAULT (now()),
	`unread_count` int NOT NULL DEFAULT 0,
	`is_new` boolean NOT NULL DEFAULT true,
	`active_responder_id` int,
	`claimed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`content` text,
	`from_number` varchar(20),
	`to_number` varchar(20),
	`agent_id` int,
	`media_url` text,
	`media_type` enum('image','audio','document','sticker'),
	`status` enum('pending','sent','delivered','failed') NOT NULL DEFAULT 'pending',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quick_reply_templates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quick_reply_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `time_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`login_at` timestamp NOT NULL,
	`logout_at` timestamp,
	`total_duration` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `time_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`open_id` varchar(64),
	`name` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` text NOT NULL,
	`role` enum('admin','agent') NOT NULL DEFAULT 'agent',
	`login_method` enum('password') NOT NULL DEFAULT 'password',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_signed_in` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_open_id_unique` UNIQUE(`open_id`),
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
	`direction` enum('inbound','outbound') NOT NULL,
	`from_number` varchar(20),
	`to_number` varchar(20),
	`message` text,
	`status` enum('received','sent','failed') NOT NULL DEFAULT 'received',
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
