CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`slot_id` integer NOT NULL,
	`plate` text NOT NULL,
	`service_id` text NOT NULL,
	`mechanic_id` text,
	`status` text DEFAULT 'booked' NOT NULL,
	`note` text,
	`price` integer NOT NULL,
	`phone` text NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plate`) REFERENCES `cars`(`plate`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bookings_status" CHECK("bookings"."status" IN ('booked', 'cancelled', 'done')),
	CONSTRAINT "bookings_price_positive" CHECK("bookings"."price" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_code_unique` ON `bookings` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_car_per_slot` ON `bookings` (`slot_id`,`plate`) WHERE "bookings"."status" <> 'cancelled';--> statement-breakpoint
CREATE TABLE `cars` (
	`plate` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`model` text NOT NULL,
	`size` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cars_size" CHECK("cars"."size" IN ('small', 'big'))
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mechanics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`services` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`minutes` integer NOT NULL,
	`price` integer NOT NULL,
	`price_big` integer NOT NULL,
	CONSTRAINT "services_minutes_positive" CHECK("services"."minutes" > 0),
	CONSTRAINT "services_price_positive" CHECK("services"."price" > 0),
	CONSTRAINT "services_price_big_positive" CHECK("services"."price_big" > 0)
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`time` text NOT NULL,
	`bays` integer DEFAULT 4 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slots_day_time` ON `slots` (`day`,`time`);