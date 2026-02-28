ALTER TABLE "episode" ALTER COLUMN "guid" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "episode" ALTER COLUMN "has_guests" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "episode" ALTER COLUMN "has_sponsors" DROP NOT NULL;