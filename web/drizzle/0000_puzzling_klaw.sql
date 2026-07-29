CREATE TYPE "public"."audit_actor_type" AS ENUM('USER', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'SEED');--> statement-breakpoint
CREATE TYPE "public"."audit_source" AS ENUM('WEB', 'SEED', 'MIGRATION', 'DATABASE_ADMIN');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_username" varchar(180) NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(80),
	"entity_id" varchar(120),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"request_id" uuid,
	"source" "audit_source" NOT NULL,
	"route" text,
	"http_method" varchar(12),
	"ip_address" varchar(80),
	"user_agent" text,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "audit_field_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_event_id" uuid NOT NULL,
	"field_name" varchar(160) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "certainties" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "certainties_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ext_source_id" integer NOT NULL,
	"name" varchar(180) NOT NULL,
	"name_description" text,
	"birth_year_hijri" integer,
	"birth_year_gregorian" integer,
	"death_year_hijri" integer,
	"death_year_gregorian" integer,
	"detail_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "persons_hijri_year_order_ck" CHECK ("persons"."birth_year_hijri" is null or "persons"."death_year_hijri" is null or "persons"."death_year_hijri" >= "persons"."birth_year_hijri"),
	CONSTRAINT "persons_gregorian_year_order_ck" CHECK ("persons"."birth_year_gregorian" is null or "persons"."death_year_gregorian" is null or "persons"."death_year_gregorian" >= "persons"."birth_year_gregorian")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "places_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"method_id" integer NOT NULL,
	"scope_id" integer NOT NULL,
	"certainty_id" integer NOT NULL,
	"place_id" integer,
	"detail_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relations_not_self_ck" CHECK ("relations"."teacher_id" <> "relations"."student_id")
);
--> statement-breakpoint
CREATE TABLE "scopes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scopes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_field_changes" ADD CONSTRAINT "audit_field_changes_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_teacher_id_persons_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_student_id_persons_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_scope_id_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."scopes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_certainty_id_certainties_id_fk" FOREIGN KEY ("certainty_id") REFERENCES "public"."certainties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_events_request_id_idx" ON "audit_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "audit_field_changes_event_idx" ON "audit_field_changes" USING btree ("audit_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certainties_name_uq" ON "certainties" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "methods_name_uq" ON "methods" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "persons_ext_source_id_uq" ON "persons" USING btree ("ext_source_id");--> statement-breakpoint
CREATE INDEX "persons_name_idx" ON "persons" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "places_name_uq" ON "places" USING btree ("name");--> statement-breakpoint
CREATE INDEX "relations_teacher_id_idx" ON "relations" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "relations_student_id_idx" ON "relations" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "relations_natural_key_uq" ON "relations" USING btree ("teacher_id","student_id","method_id","scope_id","certainty_id",coalesce("place_id", 0));--> statement-breakpoint
CREATE UNIQUE INDEX "scopes_name_uq" ON "scopes" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_uq" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uq" ON "users" USING btree ("username");