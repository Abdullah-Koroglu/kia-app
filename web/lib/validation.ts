import { z } from "zod";

z.config(z.locales.tr());

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
    birthYearGregorianSecondary: nullableYear,
    deathYearHijri: nullableYear,
    deathYearGregorian: nullableYear,
    deathYearGregorianSecondary: nullableYear,
    detailNote: nullableText,
    homelandId: z
      .union([z.number().int().positive(), z.null()])
      .optional()
      .transform((value) => value ?? null),
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
        message: "Kesin Hicrî vefat yılı doğum yılından küçük olamaz.",
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
        message: "Kesin Miladî vefat yılı doğum yılından küçük olamaz.",
      });
    }
    for (const [primaryKey, secondaryKey] of [
      ["birthYearGregorian", "birthYearGregorianSecondary"],
      ["deathYearGregorian", "deathYearGregorianSecondary"],
    ] as const) {
      const primary = data[primaryKey];
      const secondary = data[secondaryKey];
      if (secondary !== null && (primary === null || secondary !== primary + 1)) {
        context.addIssue({
          code: "custom",
          path: [secondaryKey],
          message: "İkinci Miladî yıl ilk yıldan bir sonraki yıl olmalıdır.",
        });
      }
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
    message: "Bir âlim kendisinin hocası veya talebesi olamaz.",
    path: ["studentId"],
  });

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(80),
  displayName: z.string().trim().min(1).max(160),
  password: z.string().min(10).max(256),
  roleIds: z.array(z.string().uuid()).min(1),
  mustChangePassword: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(80),
  displayName: z.string().trim().min(1).max(160),
});

export const userRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const passwordResetSchema = z.object({
  password: z.string().min(10).max(256),
  mustChangePassword: z.boolean().optional().default(true),
});

export const roleCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().trim().min(2).max(120),
  description: nullableText,
  permissionIds: z.array(z.string().uuid()),
});

export const roleUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: nullableText,
  isActive: z.boolean(),
  permissionIds: z.array(z.string().uuid()),
});

const assignmentScopeSchema = z.object({
  startExtSourceId: z.number().int().positive(),
  endExtSourceId: z.number().int().positive(),
}).refine((scope) => scope.endExtSourceId >= scope.startExtSourceId, {
  message: "Bitiş ID başlangıç ID'den küçük olamaz.",
  path: ["endExtSourceId"],
});

export const assignmentInputSchema = z
  .object({
    researcherUserId: z.string().uuid(),
    title: z.string().trim().min(2).max(200),
    description: nullableText,
    startsAt: z.string().datetime(),
    deadlineAt: z.string().datetime(),
    scopes: z.array(assignmentScopeSchema).min(1).max(50),
  })
  .superRefine((data, context) => {
    if (new Date(data.deadlineAt) <= new Date(data.startsAt)) {
      context.addIssue({
        code: "custom",
        path: ["deadlineAt"],
        message: "Deadline başlangıçtan sonra olmalıdır.",
      });
    }
    const sorted = [...data.scopes].sort(
      (left, right) => left.startExtSourceId - right.startExtSourceId,
    );
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].startExtSourceId <= sorted[index - 1].endExtSourceId) {
        context.addIssue({
          code: "custom",
          path: ["scopes"],
          message: "Aynı görevdeki ID aralıkları çakışamaz.",
        });
        break;
      }
    }
  });

export const placeInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
});

export const reviewCommentSchema = z.object({
  comment: z.string().trim().max(10_000).optional().transform((value) => value || null),
});

export const changeRequestSchema = z.object({
  comment: z.string().trim().min(2).max(10_000),
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
