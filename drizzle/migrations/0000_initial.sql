-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` serial PRIMARY KEY,
  `name` text NOT NULL,
  `email` varchar(320) NOT NULL UNIQUE,
  `password` text,
  `role` enum('admin', 'agent') NOT NULL DEFAULT 'agent',
  `login_method` enum('password') NOT NULL DEFAULT 'password',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_signed_in` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create webhook_accounts table
CREATE TABLE IF NOT EXISTS `webhook_accounts` (
  `id` serial PRIMARY KEY,
  `name` text NOT NULL,
  `api_key` varchar(64) NOT NULL UNIQUE,
  `webhook_url` text,
  `phone_number` varchar(20),
  `status` enum('active', 'inactive') NOT NULL DEFAULT 'active',
  `messages_sent` int NOT NULL DEFAULT 0,
  `messages_received` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` serial PRIMARY KEY,
  `account_id` int NOT NULL,
  `agent_id` int,
  `direction` enum('inbound', 'outbound') NOT NULL,
  `from_number` varchar(20),
  `to_number` varchar(20),
  `message` text,
  `status` enum('pending', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
  `metadata` text,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS `settings` (
  `id` serial PRIMARY KEY,
  `key` varchar(255) NOT NULL UNIQUE,
  `value` text,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
