CREATE TABLE "homelands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"normalized_name" varchar(180) NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "homeland_id" uuid;--> statement-breakpoint
ALTER TABLE "homelands" ADD CONSTRAINT "homelands_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "homelands_normalized_name_uq" ON "homelands" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "homelands_name_idx" ON "homelands" USING btree ("name");--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_homeland_id_homelands_id_fk" FOREIGN KEY ("homeland_id") REFERENCES "public"."homelands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persons_homeland_id_idx" ON "persons" USING btree ("homeland_id");