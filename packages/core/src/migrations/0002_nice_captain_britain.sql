CREATE TABLE "episode" (
	"id" text PRIMARY KEY NOT NULL,
	"podscan_episode_id" text NOT NULL,
	"podcast_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"image_url" text NOT NULL,
	"audio_url" text NOT NULL,
	"duration" integer NOT NULL,
	"word_count" integer NOT NULL,
	"posted_at" text,
	"category_id" text,
	"category_name" text,
	"transcript" text NOT NULL,
	"fully_processed" boolean NOT NULL,
	"guid" text NOT NULL,
	"has_guests" boolean NOT NULL,
	"has_sponsors" boolean NOT NULL,
	"permalink" text,
	"metadata" jsonb,
	"topics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "episode_podscan_episode_id_unique" UNIQUE("podscan_episode_id")
);
--> statement-breakpoint
CREATE TABLE "podcast" (
	"id" text PRIMARY KEY NOT NULL,
	"podscan_podcast_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "podcast_podscan_podcast_id_unique" UNIQUE("podscan_podcast_id")
);
--> statement-breakpoint
ALTER TABLE "episode" ADD CONSTRAINT "episode_podcast_id_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcast"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "episode_podcast_id_idx" ON "episode" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "episode_podscan_episode_id_idx" ON "episode" USING btree ("podscan_episode_id");--> statement-breakpoint
CREATE INDEX "podcast_podscan_podcast_id_idx" ON "podcast" USING btree ("podscan_podcast_id");