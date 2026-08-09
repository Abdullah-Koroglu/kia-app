import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { findWritableAssignment } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { hasPermission, PERMISSIONS, ROLE_CODES } from "@/lib/permissions";
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
      homeland_id as "homelandId",
      (select pl.name from places pl where pl.id = persons.homeland_id) as "homelandName",
      review_status as "reviewStatus", content_version as "contentVersion",
      approved_version as "approvedVersion", approved_at as "approvedAt",
      (select coalesce(u.display_name, u.username) from users u where u.id = persons.approved_by_user_id) as "approvedByName",
      submitted_for_review_at as "submittedForReviewAt",
      created_at as "createdAt", updated_at as "updatedAt"
    from persons where id = ${id}
  `;
  return rows[0] as Record<string, unknown> | undefined;
}

export async function GET(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_VIEW);
  if (auth.response || !auth.user) return auth.response;
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

  const extSourceId = Number(person.extSourceId);
  const isManager = auth.user.roles.includes(ROLE_CODES.MANAGER);
  const writableAssignmentId = hasPermission(
    auth.user.permissions,
    PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT,
  )
    ? await findWritableAssignment(sql, auth.user.id, extSourceId)
    : null;
  return Response.json({
    person,
    teachers,
    students,
    capabilities: {
      canEdit:
        isManager ||
        (Boolean(writableAssignmentId) && person.reviewStatus !== "APPROVED"),
      canDelete: hasPermission(auth.user.permissions, PERMISSIONS.PERSON_DELETE),
      canChangeExternalId: hasPermission(
        auth.user.permissions,
        PERMISSIONS.PERSON_CHANGE_EXTERNAL_ID,
      ),
      canManageRelations:
        isManager ||
        (Boolean(writableAssignmentId) && person.reviewStatus !== "APPROVED"),
      canSubmitReview:
        Boolean(writableAssignmentId) &&
        (person.reviewStatus === "NOT_READY" ||
          person.reviewStatus === "CHANGES_REQUESTED"),
      canApprove: hasPermission(auth.user.permissions, PERMISSIONS.PERSON_APPROVE),
      canRequestChanges: hasPermission(
        auth.user.permissions,
        PERMISSIONS.PERSON_REQUEST_CHANGES,
      ),
      canRevokeApproval: hasPermission(
        auth.user.permissions,
        PERMISSIONS.PERSON_APPROVAL_REVOKE,
      ),
    },
  });
}

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_VIEW);
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
          ,homeland_id as "homelandId"
          ,review_status as "reviewStatus"
          ,content_version as "contentVersion"
        from persons where id = ${id} for update
      `;
      if (!beforeRows[0]) return null;

      const before = beforeRows[0] as Record<string, unknown>;
      const isManager = auth.user.roles.includes(ROLE_CODES.MANAGER);
      const externalIdChanged = Number(before.extSourceId) !== input.extSourceId;
      const canUpdateInScope =
        isManager ||
        (hasPermission(
          auth.user.permissions,
          PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT,
        ) &&
        before.reviewStatus !== "APPROVED" && Boolean(
          await findWritableAssignment(
            transaction as unknown as typeof sql,
            auth.user.id,
            Number(before.extSourceId),
          ),
        ));
      const canChangeExternalId = hasPermission(
        auth.user.permissions,
        PERMISSIONS.PERSON_CHANGE_EXTERNAL_ID,
      );
      if (!canUpdateInScope && !canChangeExternalId) {
        const error = new Error("Bu âlim aktif görev kapsamınızda bulunmuyor.");
        Object.assign(error, { code: "OUT_OF_ASSIGNMENT_SCOPE" });
        throw error;
      }
      if (externalIdChanged && !canChangeExternalId) {
        const error = new Error("Dış kaynak ID yalnızca yönetici tarafından değiştirilebilir.");
        Object.assign(error, { code: "OUT_OF_ASSIGNMENT_SCOPE" });
        throw error;
      }
      if (!canUpdateInScope && canChangeExternalId) {
        const unchangedFields = [
          "name",
          "nameDescription",
          "birthYearHijri",
          "birthYearGregorian",
          "deathYearHijri",
          "deathYearGregorian",
          "detailNote",
          "homelandId",
        ].every((field) => (before[field] ?? null) === (input[field as keyof typeof input] ?? null));
        if (!externalIdChanged || !unchangedFields) {
          const error = new Error("Yönetici rolüyle yalnızca dış kaynak ID değiştirilebilir.");
          Object.assign(error, { code: "OUT_OF_ASSIGNMENT_SCOPE" });
          throw error;
        }
      }

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
          homeland_id = ${input.homelandId},
          updated_by_user_id = ${auth.user.id},
          content_version = content_version + 1,
          review_status = case
            when review_status = 'CHANGES_REQUESTED' then 'CHANGES_REQUESTED'::person_review_status
            else 'NOT_READY'::person_review_status
          end,
          approved_version = null,
          approved_at = null,
          approved_by_user_id = null,
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
          ,homeland_id as "homelandId"
          ,review_status as "reviewStatus"
          ,content_version as "contentVersion"
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
    if (typeof error === "object" && error && "code" in error && error.code === "OUT_OF_ASSIGNMENT_SCOPE") {
      return Response.json({ error: error instanceof Error ? error.message : "Yetkiniz bulunmuyor." }, { status: 403 });
    }
    return apiError(error);
  }
}

export async function DELETE(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_DELETE);
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
          ,homeland_id as "homelandId"
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
