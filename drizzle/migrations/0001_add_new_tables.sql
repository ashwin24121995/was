-- Add new tables for complete WASender functionality

CREATE TABLE IF NOT EXISTS `agent_accounts` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `agent_id` int NOT NULL,
  `account_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `agent_accounts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversations` (
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

CREATE TABLE IF NOT EXISTS `messages` (
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

CREATE TABLE IF NOT EXISTS `time_logs` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `agent_id` int NOT NULL,
  `login_at` timestamp NOT NULL,
  `logout_at` timestamp,
  `total_duration` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `time_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `breaks` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `time_log_id` int NOT NULL,
  `break_type` enum('lunch','short','other') NOT NULL,
  `start_at` timestamp NOT NULL,
  `end_at` timestamp,
  `duration` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `breaks_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `quick_reply_templates` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `agent_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `quick_reply_templates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversation_notes` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `conversation_id` int NOT NULL,
  `agent_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `conversation_notes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversation_tags` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `conversation_id` int NOT NULL,
  `tag_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `conversation_tags_id` PRIMARY KEY(`id`)
);

-- Update webhook_logs to match new schema (remove agentId column if it exists)
ALTER TABLE `webhook_logs` 
  MODIFY COLUMN `status` enum('received','sent','failed') NOT NULL DEFAULT 'received';
