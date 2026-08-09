CREATE TABLE `invitation_responses` (
	`invitation_id` text PRIMARY KEY NOT NULL,
	`choice` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`responded_at` integer NOT NULL,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_responses_responded_at_index` ON `invitation_responses` (`responded_at`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`public_token` text NOT NULL,
	`status_token_hash` text NOT NULL,
	`template_id` text NOT NULL,
	`from_name` text NOT NULL,
	`to_name` text NOT NULL,
	`activity` text NOT NULL,
	`custom_activity` text DEFAULT '' NOT NULL,
	`place` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_public_token_unique` ON `invitations` (`public_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_status_token_hash_unique` ON `invitations` (`status_token_hash`);--> statement-breakpoint
CREATE INDEX `invitations_expires_at_index` ON `invitations` (`expires_at`);