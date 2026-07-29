import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { apiError, personInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function getPerson(id: string) {
  const rows = await sql`
    select
      id, ext_source_id as "extSourceId", name,
      name_description as "nameDescription",
      birth_year_hijri as "birthYearHijri",
      birth_year_gregorian as "birthYearGregorian",
      death_year_hijri as "deathYearHijri",
      death_year_gregorian as "deathYearGregorian",
      detail_note as "detailNote",
      created_at as "createdAt", updated_at as "updatedAt"
    from persons where id = ${id}
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

export async function GET(request: Request, route: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await route.params;
  const params = new URL(request.url).searchParams;
  const methodId = Number(params.get("methodId")) || null;
  const scopeId = Number(params.get("scopeId")) || null;
  const certaintyId = Number(params.get("certaintyId")) || null;
  const placeId = Number(params.get("placeId")) || null;

  const person = await getPerson(id);
  if (!person) {
    return Response.json({ error: "Kişi bulunamadı." }, { status: 404 });
  }

  const filter = sql`
    ${methodId ? sql`and r.method_id = ${methodId}` : sql``}
    ${scopeId ? sql`and r.scope_id = ${scopeId}` : sql``}
    ${certaintyId ? sql`and r.certainty_id = ${certaintyId}` : sql``}
    ${placeId ? sql`and r.place_id = ${placeId}` : sql``}
  `;

  const relationSelect = sql`
    r.id,
    r.teacher_id as "teacherId",
    r.student_id as "studentId",
    r.method_id as "methodId",
    r.scope_id as "scopeId",
    r.certainty_id as "certaintyId",
    r.place_id as "placeId",
    r.detail_note as "detailNote",
    m.name as "methodName",
    sc.name as "scopeName",
    c.name as "certaintyName",
    pl.name as "placeName"
  `;

  const [teachers, students] = await Promise.all([
    sql`
      select ${relationSelect},
        p.id as "counterpartId", p.ext_source_id as "counterpartExtSourceId",
        p.name as "counterpartName", p.name_description as "counterpartDescription"
      from relations r
      join persons p on p.id = r.teacher_id
      join methods m on m.id = r.method_id
      join scopes sc on sc.id = r.scope_id
      join certainties c on c.id = r.certainty_id
      left join places pl on pl.id = r.place_id
      where r.student_id = ${id} ${filter}
      order by p.ext_source_id
    `,
    sql`
      select ${relationSelect},
        p.id as "counterpartId", p.ext_source_id as "counterpartExtSourceId",
        p.name as "counterpartName", p.name_description as "counterpartDescription"
      from relations r
      join persons p on p.id = r.student_id
      join methods m on m.id = r.method_id
      join scopes sc on sc.id = r.scope_id
      join certainties c on c.id = r.certainty_id
      left join places pl on pl.id = r.place_id
      where r.teacher_id = ${id} ${filter}
      order by p.ext_source_id
    `,
  ]);

  return Response.json({ person, teachers, students });
}

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;

  try {
    const input = personInputSchema.parse(await request.json());
    const context = requestContext(request);
    const updated = await sql.begin(async (transaction) => {
      const beforeRows = await transaction`
        select
          id, ext_source_id as "extSourceId", name,
          name_description as "nameDescription",
          birth_year_hijri as "birthYearHijri",
          birth_year_gregorian as "birthYearGregorian",
          death_year_hijri as "deathYearHijri",
          death_year_gregorian as "deathYearGregorian",
          detail_note as "detailNote"
        from persons where id = ${id} for update
      `;
      if (!beforeRows[0]) return null;

      const afterRows = await transaction`
        update persons set
          ext_source_id = ${input.extSourceId},
          name = ${input.name},
          name_description = ${input.nameDescription},
          birth_year_hijri = ${input.birthYearHijri},
          birth_year_gregorian = ${input.birthYearGregorian},
          death_year_hijri = ${input.deathYearHijri},
          death_year_gregorian = ${input.deathYearGregorian},
          detail_note = ${input.detailNote},
          updated_at = now()
        where id = ${id}
        returning
          id, ext_source_id as "extSourceId", name,
          name_description as "nameDescription",
          birth_year_hijri as "birthYearHijri",
          birth_year_gregorian as "birthYearGregorian",
          death_year_hijri as "deathYearHijri",
          death_year_gregorian as "deathYearGregorian",
          detail_note as "detailNote"
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "UPDATE",
        entityType: "Person",
        entityId: id,
        before: beforeRows[0] as Record<string, unknown>,
        after: afterRows[0] as Record<string, unknown>,
        context,
      });
      return afterRows[0];
    });

    if (!updated) {
      return Response.json({ error: "Kişi bulunamadı." }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, route: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;

  try {
    const deleted = await sql.begin(async (transaction) => {
      const rows = await transaction`
        select
          id, ext_source_id as "extSourceId", name,
          name_description as "nameDescription",
          birth_year_hijri as "birthYearHijri",
          birth_year_gregorian as "birthYearGregorian",
          death_year_hijri as "deathYearHijri",
          death_year_gregorian as "deathYearGregorian",
          detail_note as "detailNote"
        from persons where id = ${id} for update
      `;
      if (!rows[0]) return false;
      await transaction`delete from persons where id = ${id}`;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "DELETE",
        entityType: "Person",
        entityId: id,
        before: rows[0] as Record<string, unknown>,
        context: requestContext(request),
      });
      return true;
    });

    if (!deleted) {
      return Response.json({ error: "Kişi bulunamadı." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}

