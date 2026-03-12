CREATE TYPE "public"."alias_type" AS ENUM('ticker', 'abbrev', 'legal', 'colloquial');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('company', 'asset', 'industry', 'institution', 'geography', 'person', 'other');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('micro', 'macro');--> statement-breakpoint
CREATE TYPE "public"."evidentiary_basis" AS ENUM('reported_data', 'expert_opinion', 'company_statement', 'market_observation', 'speculative');--> statement-breakpoint
CREATE TYPE "public"."horizon" AS ENUM('immediate', 'near_term', 'medium_term', 'long_term', 'structural', 'not_specified');--> statement-breakpoint
CREATE TYPE "public"."position_type" AS ENUM('long', 'short', 'none_stated', 'not_mentioned');--> statement-breakpoint
CREATE TYPE "public"."ranking_tag" AS ENUM('notable_speaker', 'skin_in_game', 'high_specificity', 'catalyst_identified');--> statement-breakpoint
CREATE TYPE "public"."speaker_confidence" AS ENUM('high', 'inferred', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."speaker_role" AS ENUM('host', 'guest', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."specificity_level" AS ENUM('high', 'medium', 'low', 'background');--> statement-breakpoint
CREATE TYPE "public"."stance" AS ENUM('bullish', 'bearish', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."validation_status" AS ENUM('PASS', 'FAIL', 'REJECT');--> statement-breakpoint
CREATE TABLE "entity" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_name" text NOT NULL,
	"type" "entity_type" NOT NULL,
	"figi" text,
	"wikidata_qid" text,
	"ticker" text,
	"exchange" text,
	"description" text,
	"metadata" jsonb,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entity_canonical_name_type_unique" UNIQUE("canonical_name","type")
);
--> statement-breakpoint
CREATE TABLE "entity_alias" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"alias" text NOT NULL,
	"alias_type" "alias_type" NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entity_alias_alias_entity_id_unique" UNIQUE("alias","entity_id")
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" text PRIMARY KEY NOT NULL,
	"episode_id" text NOT NULL,
	"stance" "stance" NOT NULL,
	"ranking_score" numeric(3, 2),
	"ranking_tags" text[],
	"entity_names" text[] NOT NULL,
	"full_text" text NOT NULL,
	"embedding" vector(1536),
	"expiration_date" date,
	"status" "claim_status" DEFAULT 'active' NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"original_claim_id" text,
	"claim_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_entity" (
	"claim_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"mention_name" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claim_entity_claim_id_entity_id_pk" PRIMARY KEY("claim_id","entity_id")
);
--> statement-breakpoint
ALTER TABLE "episode" RENAME TO "podscan_episode";--> statement-breakpoint
ALTER TABLE "podcast" RENAME TO "podscan_podcast";--> statement-breakpoint
ALTER TABLE "podscan_episode" DROP CONSTRAINT "episode_podscan_episode_id_unique";--> statement-breakpoint
ALTER TABLE "podscan_podcast" DROP CONSTRAINT "podcast_podscan_podcast_id_unique";--> statement-breakpoint
ALTER TABLE "podscan_episode" DROP CONSTRAINT "episode_podcast_id_podcast_id_fk";
--> statement-breakpoint
DROP INDEX "episode_podcast_id_idx";--> statement-breakpoint
DROP INDEX "episode_podscan_episode_id_idx";--> statement-breakpoint
DROP INDEX "podcast_podscan_podcast_id_idx";--> statement-breakpoint
ALTER TABLE "entity_alias" ADD CONSTRAINT "entity_alias_entity_id_entity_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_original_claim_id_claim_id_fk" FOREIGN KEY ("original_claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_entity" ADD CONSTRAINT "claim_entity_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_canonical_name_idx" ON "entity" USING btree ("canonical_name");--> statement-breakpoint
CREATE INDEX "entity_ticker_idx" ON "entity" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "entity_alias_alias_idx" ON "entity_alias" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "claim_episode_id_idx" ON "claim" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "claim_status_idx" ON "claim" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claim_entity_entity_id_idx" ON "claim_entity" USING btree ("entity_id");--> statement-breakpoint
ALTER TABLE "podscan_episode" ADD CONSTRAINT "podscan_episode_podcast_id_podscan_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podscan_podcast"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "podscan_episode_podcast_id_idx" ON "podscan_episode" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "podscan_episode_podscan_episode_id_idx" ON "podscan_episode" USING btree ("podscan_episode_id");--> statement-breakpoint
CREATE INDEX "podscan_podcast_podscan_podcast_id_idx" ON "podscan_podcast" USING btree ("podscan_podcast_id");--> statement-breakpoint
ALTER TABLE "podscan_episode" ADD CONSTRAINT "podscan_episode_podscan_episode_id_unique" UNIQUE("podscan_episode_id");--> statement-breakpoint
ALTER TABLE "podscan_podcast" ADD CONSTRAINT "podscan_podcast_podscan_podcast_id_unique" UNIQUE("podscan_podcast_id");