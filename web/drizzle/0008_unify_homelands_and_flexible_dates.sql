ALTER TABLE "persons" ADD COLUMN "homeland_place_id" integer;--> statement-breakpoint

INSERT INTO "places" ("name", "created_at", "updated_at")
SELECT h."name", h."created_at", h."updated_at"
FROM "homelands" h
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint

UPDATE "persons" p
SET "homeland_place_id" = pl."id"
FROM "homelands" h
JOIN "places" pl ON pl."name" = h."name"
WHERE p."homeland_id" = h."id";--> statement-breakpoint

ALTER TABLE "persons" DROP CONSTRAINT "persons_hijri_year_order_ck";--> statement-breakpoint
ALTER TABLE "persons" DROP CONSTRAINT "persons_gregorian_year_order_ck";--> statement-breakpoint
ALTER TABLE "persons" DROP CONSTRAINT "persons_homeland_id_homelands_id_fk";--> statement-breakpoint
DROP INDEX "persons_homeland_id_idx";--> statement-breakpoint
ALTER TABLE "persons" DROP COLUMN "homeland_id";--> statement-breakpoint
ALTER TABLE "persons" RENAME COLUMN "homeland_place_id" TO "homeland_id";--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_homeland_id_places_id_fk"
  FOREIGN KEY ("homeland_id") REFERENCES "public"."places"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persons_homeland_id_idx" ON "persons" USING btree ("homeland_id");--> statement-breakpoint

ALTER TABLE "persons" ALTER COLUMN "birth_year_hijri" TYPE varchar(40)
  USING "birth_year_hijri"::text;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "birth_year_gregorian" TYPE varchar(40)
  USING "birth_year_gregorian"::text;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "death_year_hijri" TYPE varchar(40)
  USING "death_year_hijri"::text;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "death_year_gregorian" TYPE varchar(40)
  USING "death_year_gregorian"::text;--> statement-breakpoint

DELETE FROM "permissions"
WHERE "code" IN ('HOMELAND_VIEW', 'HOMELAND_CREATE');--> statement-breakpoint

DROP TABLE "homelands";
