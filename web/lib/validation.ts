import { z } from "zod";

const nullableYear = z
  .union([z.number().int(), z.null()])
  .optional()
  .transform((value) => value ?? null);

const nullableText = z
  .union([z.string().trim().max(10_000), z.null()])
  .optional()
  .transform((value) => value || null);

export const personInputSchema = z
  .object({
    extSourceId: z.number().int(),
    name: z.string().trim().min(1).max(180),
    nameDescription: nullableText,
    birthYearHijri: nullableYear,
    birthYearGregorian: nullableYear,
    deathYearHijri: nullableYear,
    deathYearGregorian: nullableYear,
    detailNote: nullableText,
  })
  .superRefine((data, context) => {
    if (
      data.birthYearHijri !== null &&
      data.deathYearHijri !== null &&
      data.deathYearHijri < data.birthYearHijri
    ) {
      context.addIssue({
        code: "custom",
        path: ["deathYearHijri"],
        message: "Hicrî vefat yılı doğum yılından küçük olamaz.",
      });
    }
    if (
      data.birthYearGregorian !== null &&
      data.deathYearGregorian !== null &&
      data.deathYearGregorian < data.birthYearGregorian
    ) {
      context.addIssue({
        code: "custom",
        path: ["deathYearGregorian"],
        message: "Miladî vefat yılı doğum yılından küçük olamaz.",
      });
    }
  });

export const relationInputSchema = z
  .object({
    teacherId: z.string().uuid(),
    studentId: z.string().uuid(),
    methodId: z.number().int().positive(),
    scopeId: z.number().int().positive(),
    certaintyId: z.number().int().positive(),
    placeId: z
      .union([z.number().int().positive(), z.null()])
      .optional()
      .transform((value) => value ?? null),
    detailNote: nullableText,
  })
  .refine((data) => data.teacherId !== data.studentId, {
    message: "Bir kişi kendisinin hocası veya talebesi olamaz.",
    path: ["studentId"],
  });

export function apiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: "Form alanlarını kontrol edin.",
        fields: z.flattenError(error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code === "23505") {
    return Response.json(
      { error: "Bu bilgilerle aynı kayıt zaten bulunuyor." },
      { status: 409 },
    );
  }
  if (code === "23503") {
    return Response.json(
      { error: "Bu kayıt ilişkili başka kayıtlar bulunduğu için silinemez." },
      { status: 409 },
    );
  }
  if (code === "23514") {
    return Response.json(
      { error: "Kayıt iş kurallarına uymuyor." },
      { status: 400 },
    );
  }

  console.error(error);
  return Response.json(
    { error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." },
    { status: 500 },
  );
}

