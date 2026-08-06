CREATE TYPE "public"."person_review_action" AS ENUM('SUBMITTED', 'RESUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'APPROVAL_REVOKED');--> statement-breakpoint
CREATE TYPE "public"."person_review_status" AS ENUM('NOT_READY', 'READY_FOR_REVIEW', 'CHANGES_REQUESTED', 'APPROVED');--> statement-breakpoint
CREATE TABLE "person_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"action" "person_review_action" NOT NULL,
	"comment" text,
	"person_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "review_status" "person_review_status" DEFAULT 'NOT_READY' NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "content_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "approved_version" integer;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "approved_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "submitted_for_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "submitted_for_review_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "person_reviews" ADD CONSTRAINT "person_reviews_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_reviews" ADD CONSTRAINT "person_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "person_reviews_person_created_idx" ON "person_reviews" USING btree ("person_id","created_at");--> statement-breakpoint
CREATE INDEX "person_reviews_reviewer_idx" ON "person_reviews" USING btree ("reviewer_user_id");--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_submitted_for_review_by_user_id_users_id_fk" FOREIGN KEY ("submitted_for_review_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p
WHERE r.code IN ('MANAGER', 'RESEARCHER') AND p.code = 'PERSON_REVIEW_VIEW'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
