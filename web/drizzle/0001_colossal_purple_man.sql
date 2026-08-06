CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" varchar(160);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_code_uq" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_uq" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_uq" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_uq" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_uq" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_disabled_by_user_id_users_id_fk" FOREIGN KEY ("disabled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "roles" ("code", "name", "description", "is_system") VALUES
  ('MANAGER', 'Yönetici', 'Kullanıcı ve görev yönetimini yürütür.', true),
  ('CONTROLLER', 'Kontrolcü', 'Âlim kayıtlarını inceler ve onaylar.', true),
  ('RESEARCHER', 'Araştırmacı', 'Atanan kapsamdaki âlimleri girer.', true)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "permissions" ("code", "name") VALUES
  ('USER_VIEW', 'Kullanıcıları görme'),
  ('USER_CREATE', 'Kullanıcı oluşturma'),
  ('USER_UPDATE', 'Kullanıcı güncelleme'),
  ('USER_DISABLE', 'Kullanıcı devre dışı bırakma'),
  ('USER_ASSIGN_ROLE', 'Kullanıcı rolü atama'),
  ('USER_RESET_PASSWORD', 'Kullanıcı şifresi sıfırlama'),
  ('ROLE_VIEW', 'Rolleri görme'),
  ('ROLE_MANAGE', 'Rolleri yönetme'),
  ('ASSIGNMENT_VIEW_ALL', 'Tüm görevleri görme'),
  ('ASSIGNMENT_VIEW_OWN', 'Kendi görevlerini görme'),
  ('ASSIGNMENT_CREATE', 'Görev oluşturma'),
  ('ASSIGNMENT_UPDATE', 'Görev güncelleme'),
  ('ASSIGNMENT_CANCEL', 'Görev iptal etme'),
  ('ASSIGNMENT_COMPLETE', 'Görev tamamlama'),
  ('PERSON_VIEW', 'Âlimleri görme'),
  ('PERSON_CREATE_IN_ASSIGNMENT', 'Görev kapsamında âlim oluşturma'),
  ('PERSON_UPDATE_IN_ASSIGNMENT', 'Görev kapsamında âlim güncelleme'),
  ('PERSON_DELETE', 'Âlim silme'),
  ('PERSON_CHANGE_EXTERNAL_ID', 'Dış kaynak ID değiştirme'),
  ('RELATION_VIEW', 'İlişkileri görme'),
  ('RELATION_CREATE_IN_ASSIGNMENT', 'Görev kapsamında ilişki oluşturma'),
  ('RELATION_UPDATE_IN_ASSIGNMENT', 'Görev kapsamında ilişki güncelleme'),
  ('RELATION_DELETE_IN_ASSIGNMENT', 'Görev kapsamında ilişki silme'),
  ('HOMELAND_VIEW', 'Memleketleri görme'),
  ('HOMELAND_CREATE', 'Memleket oluşturma'),
  ('REVIEW_QUEUE_VIEW', 'Kontrol kuyruğunu görme'),
  ('PERSON_REVIEW_VIEW', 'Âlim kontrol geçmişini görme'),
  ('PERSON_APPROVE', 'Âlim onaylama'),
  ('PERSON_REQUEST_CHANGES', 'Âlim için düzeltme isteme'),
  ('PERSON_REVIEW_COMMENT', 'Kontrol yorumu ekleme'),
  ('PERSON_APPROVAL_REVOKE', 'Âlim onayını geri alma')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE
  (r.code = 'MANAGER' AND p.code IN (
    'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DISABLE',
    'USER_ASSIGN_ROLE', 'USER_RESET_PASSWORD', 'ROLE_VIEW', 'ROLE_MANAGE',
    'ASSIGNMENT_VIEW_ALL', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE',
    'ASSIGNMENT_CANCEL', 'ASSIGNMENT_COMPLETE', 'PERSON_VIEW',
    'PERSON_DELETE', 'PERSON_CHANGE_EXTERNAL_ID', 'RELATION_VIEW',
    'HOMELAND_VIEW', 'HOMELAND_CREATE'
  ))
  OR (r.code = 'CONTROLLER' AND p.code IN (
    'PERSON_VIEW', 'RELATION_VIEW', 'HOMELAND_VIEW', 'HOMELAND_CREATE',
    'REVIEW_QUEUE_VIEW', 'PERSON_REVIEW_VIEW', 'PERSON_APPROVE',
    'PERSON_REQUEST_CHANGES', 'PERSON_REVIEW_COMMENT',
    'PERSON_APPROVAL_REVOKE'
  ))
  OR (r.code = 'RESEARCHER' AND p.code IN (
    'ASSIGNMENT_VIEW_OWN', 'PERSON_VIEW', 'PERSON_CREATE_IN_ASSIGNMENT',
    'PERSON_UPDATE_IN_ASSIGNMENT', 'RELATION_VIEW',
    'RELATION_CREATE_IN_ASSIGNMENT', 'RELATION_UPDATE_IN_ASSIGNMENT',
    'RELATION_DELETE_IN_ASSIGNMENT', 'HOMELAND_VIEW', 'HOMELAND_CREATE'
  ))
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT u.id, r.id
FROM "users" u
CROSS JOIN "roles" r
WHERE r.code = 'MANAGER'
ON CONFLICT ("user_id", "role_id") DO NOTHING;
