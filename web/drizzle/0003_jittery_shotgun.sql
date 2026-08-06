ALTER TABLE "persons" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "created_under_assignment_id" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "updated_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_under_assignment_id_research_assignments_id_fk" FOREIGN KEY ("created_under_assignment_id") REFERENCES "public"."research_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persons_created_under_assignment_idx" ON "persons" USING btree ("created_under_assignment_id");