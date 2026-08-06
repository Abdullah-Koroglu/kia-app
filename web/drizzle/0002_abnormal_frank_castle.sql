CREATE TYPE "public"."assignment_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "research_assignment_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"start_ext_source_id" integer NOT NULL,
	"end_ext_source_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_assignment_scopes_valid_range_ck" CHECK ("research_assignment_scopes"."start_ext_source_id" > 0 and "research_assignment_scopes"."end_ext_source_id" >= "research_assignment_scopes"."start_ext_source_id")
);
--> statement-breakpoint
CREATE TABLE "research_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"researcher_user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"status" "assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_user_id" uuid,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_assignment_scopes" ADD CONSTRAINT "research_assignment_scopes_assignment_id_research_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."research_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_assignments" ADD CONSTRAINT "research_assignments_researcher_user_id_users_id_fk" FOREIGN KEY ("researcher_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_assignments" ADD CONSTRAINT "research_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_assignments" ADD CONSTRAINT "research_assignments_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_assignments" ADD CONSTRAINT "research_assignments_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_assignment_scopes_assignment_idx" ON "research_assignment_scopes" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "research_assignment_scopes_range_idx" ON "research_assignment_scopes" USING btree ("start_ext_source_id","end_ext_source_id");--> statement-breakpoint
CREATE INDEX "research_assignments_researcher_idx" ON "research_assignments" USING btree ("researcher_user_id");--> statement-breakpoint
CREATE INDEX "research_assignments_status_deadline_idx" ON "research_assignments" USING btree ("status","deadline_at");