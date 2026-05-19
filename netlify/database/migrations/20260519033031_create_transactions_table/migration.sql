CREATE TABLE "transactions" (
	"id" text PRIMARY KEY,
	"buyer" jsonb,
	"seller" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
