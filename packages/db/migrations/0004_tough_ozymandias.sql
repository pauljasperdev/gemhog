ALTER TABLE "episode" ADD COLUMN "categories" jsonb;--> statement-breakpoint
ALTER TABLE "episode" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "episode" DROP COLUMN "category_name";