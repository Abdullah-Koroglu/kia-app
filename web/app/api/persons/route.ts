import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { findWritableAssignment, getWritableRanges, isExtSourceIdInRanges } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { normalizeSearchText } from "@/lib/search";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { apiError, personInputSchema } from "@/lib/validation";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_VIEW);
  if (auth.response || !auth.user) return auth.response;

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const normalizedQuery = normalizeSearchText(q);
  const teacherId = params.get("teacherId");
  const studentId = params.get("studentId");
  const birthYear = Number(params.get("birthYear")) || null;
  const deathYear = Number(params.get("deathYear")) || null;
  const compact = params.get("compact") === "true";
  const requestedPage = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = compact ? 20 : PAGE_SIZE;
  const offset = (requestedPage - 1) * pageSize;
  const numericQuery = /^-?\d+$/.test(q) ? Number(q) : null;

  const searchCondition = q
    ? sql`
        and (
          ${numericQuery !== null ? sql`p.ext_source_id = ${numericQuery} or` : sql``}
          translate(unaccent(lower(p.name)), 'ı', 'i') like '%' || ${normalizedQuery} || '%'
          or translate(unaccent(lower(coalesce(p.name_description, ''))), 'ı', 'i') like '%' || ${normalizedQuery} || '%'
          or similarity(translate(unaccent(lower(p.name)), 'ı', 'i'), ${normalizedQuery}) >= 0.2
          or similarity(translate(unaccent(lower(coalesce(p.name_description, ''))), 'ı', 'i'), ${normalizedQuery}) >= 0.2
        )
      `
    : sql``;
  const exactOrder =
    numericQuery !== null
      ? sql`case when p.ext_source_id = ${numericQuery} then 0 else 1 end`
      : sql`1`;
  const teacherCondition = teacherId
    ? sql`and exists (
        select 1 from relations r
        where r.teacher_id = ${teacherId} and r.student_id = p.id
      )`
    : sql``;
  const studentCondition = studentId
    ? sql`and exists (
        select 1 from relations r
        where r.student_id = ${studentId} and r.teacher_id = p.id
      )`
    : sql``;
  const birthCondition = birthYear
    ? sql`and (p.birth_year_hijri = ${birthYear} or p.birth_year_gregorian = ${birthYear})`
    : sql``;
  const deathCondition = deathYear
    ? sql`and (p.death_year_hijri = ${deathYear} or p.death_year_gregorian = ${deathYear})`
    : sql``;

  const where = sql`
    where true
    ${searchCondition}
    ${teacherCondition}
    ${studentCondition}
    ${birthCondition}
    ${deathCondition}
  `;

  const [rawItems, countRows, writableRanges] = await Promise.all([
    sql`
      select
        p.id,
        p.ext_source_id as "extSourceId",
        p.name,
        p.name_description as "nameDescription",
        p.birth_year_hijri as "birthYearHijri",
        p.birth_year_gregorian as "birthYearGregorian",
        p.death_year_hijri as "deathYearHijri",
        p.death_year_gregorian as "deathYearGregorian",
        p.detail_note as "detailNote"
        ,p.homeland_id as "homelandId"
        ,(select h.name from homelands h where h.id = p.homeland_id) as "homelandName"
        ,p.review_status as "reviewStatus"
        ,p.content_version as "contentVersion"
        ,p.approved_version as "approvedVersion"
        ,p.approved_at as "approvedAt"
        ,(select coalesce(u.display_name, u.username) from users u where u.id = p.approved_by_user_id) as "approvedByName"
      from persons p
      ${where}
      order by
        ${exactOrder},
        case when ${q} <> '' then greatest(
          similarity(translate(unaccent(lower(p.name)), 'ı', 'i'), ${normalizedQuery}),
          similarity(translate(unaccent(lower(coalesce(p.name_description, ''))), 'ı', 'i'), ${normalizedQuery})
        ) else 0 end desc,
        p.ext_source_id asc
      limit ${pageSize} offset ${offset}
    `,
    sql<{ count: number }[]>`
      select count(*)::int as count from persons p ${where}
    `,
    hasPermission(auth.user.permissions, PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT)
      ? getWritableRanges(sql, auth.user.id)
      : Promise.resolve([]),
  ]);

  const items = (rawItems as unknown as { extSourceId: number }[]).map((item) => ({
    ...item,
    capabilities: {
      canEdit:
        hasPermission(
          auth.user!.permissions,
          PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT,
        ) && isExtSourceIdInRanges(item.extSourceId, writableRanges),
      canDelete: hasPermission(auth.user!.permissions, PERMISSIONS.PERSON_DELETE),
      canChangeExternalId: hasPermission(
        auth.user!.permissions,
        PERMISSIONS.PERSON_CHANGE_EXTERNAL_ID,
      ),
    },
  }));

  const total = countRows[0]?.count ?? 0;
  return Response.json({
    items,
    total,
    page: requestedPage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    capabilities: {
      canCreate:
        hasPermission(
          auth.user.permissions,
          PERMISSIONS.PERSON_CREATE_IN_ASSIGNMENT,
        ) && writableRanges.length > 0,
      writableRanges,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(
    PERMISSIONS.PERSON_CREATE_IN_ASSIGNMENT,
  );
  if (auth.response || !auth.user) return auth.response;

  try {
    const input = personInputSchema.parse(await request.json());
    const context = requestContext(request);
    const person = await sql.begin(async (transaction) => {
      const assignmentId = await findWritableAssignment(
        transaction as unknown as typeof sql,
        auth.user.id,
        input.extSourceId,
      );
      if (!assignmentId) {
        const error = new Error(
          "Bu dış kaynak ID aktif görev kapsamınızda bulunmuyor.",
        );
        Object.assign(error, { code: "OUT_OF_ASSIGNMENT_SCOPE" });
        throw error;
      }
      const rows = await transaction`
        insert into persons (
          ext_source_id, name, name_description,
          birth_year_hijri, birth_year_gregorian,
          death_year_hijri, death_year_gregorian, detail_note, homeland_id,
          created_by_user_id, created_under_assignment_id, updated_by_user_id
        ) values (
          ${input.extSourceId}, ${input.name}, ${input.nameDescription},
          ${input.birthYearHijri}, ${input.birthYearGregorian},
          ${input.deathYearHijri}, ${input.deathYearGregorian}, ${input.detailNote},
          ${input.homelandId},
          ${auth.user.id}, ${assignmentId}, ${auth.user.id}
        )
        returning
          id, ext_source_id as "extSourceId", name,
          name_description as "nameDescription",
          birth_year_hijri as "birthYearHijri",
          birth_year_gregorian as "birthYearGregorian",
          death_year_hijri as "deathYearHijri",
          death_year_gregorian as "deathYearGregorian",
          detail_note as "detailNote"
          ,homeland_id as "homelandId"
      `;
      const created = rows[0] as Record<string, unknown>;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "CREATE",
        entityType: "Person",
        entityId: String(created.id),
        after: created,
        context,
      });
      return created;
    });

    return Response.json(person, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "OUT_OF_ASSIGNMENT_SCOPE"
    ) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Görev kapsamı dışında." },
        { status: 403 },
      );
    }
    return apiError(error);
  }
}
