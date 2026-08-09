DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "persons"
    WHERE
      (nullif(btrim("birth_year_hijri"), '') IS NOT NULL AND btrim("birth_year_hijri") !~ '^[0-9]+$') OR
      (nullif(btrim("death_year_hijri"), '') IS NOT NULL AND btrim("death_year_hijri") !~ '^[0-9]+$') OR
      (nullif(btrim("birth_year_gregorian"), '') IS NOT NULL AND btrim("birth_year_gregorian") !~ '^[0-9]+([[:space:]]*-[[:space:]]*[0-9]+)?$') OR
      (nullif(btrim("death_year_gregorian"), '') IS NOT NULL AND btrim("death_year_gregorian") !~ '^[0-9]+([[:space:]]*-[[:space:]]*[0-9]+)?$')
  ) THEN
    RAISE EXCEPTION 'Tarih migrationı durduruldu: Hicrî alanlar sayı, Miladî alanlar sayı veya 856-857 biçiminde olmalıdır.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "persons"
    WHERE
      ("birth_year_gregorian" LIKE '%-%' AND
        split_part(regexp_replace("birth_year_gregorian", '[[:space:]]', '', 'g'), '-', 2)::integer <>
        split_part(regexp_replace("birth_year_gregorian", '[[:space:]]', '', 'g'), '-', 1)::integer + 1) OR
      ("death_year_gregorian" LIKE '%-%' AND
        split_part(regexp_replace("death_year_gregorian", '[[:space:]]', '', 'g'), '-', 2)::integer <>
        split_part(regexp_replace("death_year_gregorian", '[[:space:]]', '', 'g'), '-', 1)::integer + 1)
  ) THEN
    RAISE EXCEPTION 'Tarih migrationı durduruldu: ikinci Miladî yıl ilk yıldan bir sonraki yıl olmalıdır.';
  END IF;
END $migration$;--> statement-breakpoint

ALTER TABLE "persons" ADD COLUMN "birth_year_gregorian_secondary" integer;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "death_year_gregorian_secondary" integer;--> statement-breakpoint

UPDATE "persons" SET
  "birth_year_gregorian_secondary" = CASE
    WHEN "birth_year_gregorian" LIKE '%-%' THEN split_part(regexp_replace("birth_year_gregorian", '[[:space:]]', '', 'g'), '-', 2)::integer
    ELSE NULL
  END,
  "death_year_gregorian_secondary" = CASE
    WHEN "death_year_gregorian" LIKE '%-%' THEN split_part(regexp_replace("death_year_gregorian", '[[:space:]]', '', 'g'), '-', 2)::integer
    ELSE NULL
  END;--> statement-breakpoint

ALTER TABLE "persons" ALTER COLUMN "birth_year_hijri" SET DATA TYPE integer
  USING nullif(btrim("birth_year_hijri"), '')::integer;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "birth_year_gregorian" SET DATA TYPE integer
  USING nullif(split_part(regexp_replace("birth_year_gregorian", '[[:space:]]', '', 'g'), '-', 1), '')::integer;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "death_year_hijri" SET DATA TYPE integer
  USING nullif(btrim("death_year_hijri"), '')::integer;--> statement-breakpoint
ALTER TABLE "persons" ALTER COLUMN "death_year_gregorian" SET DATA TYPE integer
  USING nullif(split_part(regexp_replace("death_year_gregorian", '[[:space:]]', '', 'g'), '-', 1), '')::integer;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_birth_gregorian_secondary_ck" CHECK ("persons"."birth_year_gregorian_secondary" is null or ("persons"."birth_year_gregorian" is not null and "persons"."birth_year_gregorian_secondary" = "persons"."birth_year_gregorian" + 1));--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_death_gregorian_secondary_ck" CHECK ("persons"."death_year_gregorian_secondary" is null or ("persons"."death_year_gregorian" is not null and "persons"."death_year_gregorian_secondary" = "persons"."death_year_gregorian" + 1));--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_hijri_year_order_ck" CHECK ("persons"."birth_year_hijri" is null or "persons"."death_year_hijri" is null or "persons"."death_year_hijri" >= "persons"."birth_year_hijri");--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_gregorian_year_order_ck" CHECK ("persons"."birth_year_gregorian" is null or "persons"."death_year_gregorian" is null or "persons"."death_year_gregorian" >= "persons"."birth_year_gregorian");
