CREATE TABLE `invitation_plans` (
	`invitation_id` text PRIMARY KEY NOT NULL,
	`activity_options` text NOT NULL,
	`selected_activity` text,
	`preferred_time` text,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
