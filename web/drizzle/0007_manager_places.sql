INSERT INTO "permissions" ("code", "name") VALUES
  ('PLACE_VIEW', 'Mekânları görme'),
  ('PLACE_CREATE', 'Mekân oluşturma'),
  ('PLACE_UPDATE', 'Mekân güncelleme'),
  ('PLACE_DELETE', 'Mekân silme')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "roles"
SET "description" = 'Kontrol kararları hariç bütün sistemi yönetir.',
    "updated_at" = now()
WHERE "code" = 'MANAGER';
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.code = 'MANAGER'
  AND p.code IN (
    'ASSIGNMENT_VIEW_OWN',
    'PERSON_CREATE_IN_ASSIGNMENT',
    'PERSON_UPDATE_IN_ASSIGNMENT',
    'RELATION_CREATE_IN_ASSIGNMENT',
    'RELATION_UPDATE_IN_ASSIGNMENT',
    'RELATION_DELETE_IN_ASSIGNMENT',
    'PLACE_VIEW',
    'PLACE_CREATE',
    'PLACE_UPDATE',
    'PLACE_DELETE'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
