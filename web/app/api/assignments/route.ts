import { sql } from "@/db";
import { requireApiPermission, requireApiUser } from "@/lib/api-auth";
import { assignmentTotal, lockAndFindScopeConflict } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { hasPermission, PERMISSIONS, ROLE_CODES } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, assignmentInputSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const canViewAll = hasPermission(auth.user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_ALL);
  const canViewOwn = hasPermission(auth.user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_OWN);
  if (!canViewAll && !canViewOwn) {
    return Response.json({ error: "Görevleri görme yetkiniz bulunmuyor." }, { status: 403 });
  }
  const items = await sql`
    select a.id, a.researcher_user_id as "researcherUserId",
      coalesce(u.display_name, u.username) as "researcherName",
      a.title, a.description, a.starts_at as "startsAt",
      a.deadline_at as "deadlineAt", a.status,
      (a.status = 'ACTIVE' and a.deadline_at < now()) as "isOverdue",
      coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'startExtSourceId', s.start_ext_source_id,
        'endExtSourceId', s.end_ext_source_id
      ) order by s.start_ext_source_id) filter (where s.id is not null), '[]'::jsonb) as scopes,
      coalesce(sum(s.end_ext_source_id - s.start_ext_source_id + 1), 0)::int as "assignedCount",
      (
        select count(distinct p.ext_source_id)::int
        from persons p where exists (
          select 1 from research_assignment_scopes ps
          where ps.assignment_id = a.id
            and p.ext_source_id between ps.start_ext_source_id and ps.end_ext_source_id
        )
      ) as "createdCount"
    from research_assignments a
    join users u on u.id = a.researcher_user_id
    left join research_assignment_scopes s on s.assignment_id = a.id
    where ${canViewAll ? sql`true` : sql`a.researcher_user_id = ${auth.user.id}`}
    group by a.id, u.id
    order by case a.status when 'ACTIVE' then 0 else 1 end,
      a.deadline_at asc, a.created_at desc
  `;
  return Response.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(PERMISSIONS.ASSIGNMENT_CREATE);
  if (auth.response || !auth.user) return auth.response;
  try {
    const input = assignmentInputSchema.parse(await request.json());
    const context = requestContext(request);
    const assignment = await sql.begin(async (transaction) => {
      const researcher = await transaction`
        select u.id
        from users u
        join user_roles ur on ur.user_id = u.id
        join roles r on r.id = ur.role_id
        where u.id = ${input.researcherUserId} and u.is_active
          and r.code = ${ROLE_CODES.RESEARCHER} and r.is_active
        limit 1
      `;
      if (!researcher[0]) {
        throw new Error("Aktif araştırmacı rolüne sahip kullanıcı bulunamadı.");
      }
      const conflict = await lockAndFindScopeConflict(
        transaction as unknown as typeof sql,
        input.scopes,
      );
      if (conflict) {
        const error = new Error(
          `${conflict.startId}-${conflict.endId} aralığı ${conflict.researcherName} kullanıcısının “${conflict.title}” göreviyle çakışıyor.`,
        );
        Object.assign(error, { code: "ASSIGNMENT_CONFLICT" });
        throw error;
      }
      const rows = await transaction`
        insert into research_assignments (
          researcher_user_id, title, description, starts_at, deadline_at,
          assigned_by_user_id
        ) values (
          ${input.researcherUserId}, ${input.title}, ${input.description},
          ${input.startsAt}::timestamptz, ${input.deadlineAt}::timestamptz,
          ${auth.user.id}
        ) returning id, researcher_user_id as "researcherUserId", title,
          description, starts_at as "startsAt", deadline_at as "deadlineAt", status
      `;
      const created = rows[0] as Record<string, unknown>;
      for (const scope of input.scopes) {
        await transaction`
          insert into research_assignment_scopes (
            assignment_id, start_ext_source_id, end_ext_source_id
          ) values (
            ${String(created.id)}, ${scope.startExtSourceId}, ${scope.endExtSourceId}
          )
        `;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "CREATE",
        entityType: "ResearchAssignment",
        entityId: String(created.id),
        after: { ...created, scopes: input.scopes, assignedCount: assignmentTotal(input.scopes) },
        context,
      });
      return created;
    });
    return Response.json(assignment, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ASSIGNMENT_CONFLICT") {
      return Response.json({ error: error instanceof Error ? error.message : "Görev kapsamı çakışıyor." }, { status: 409 });
    }
    return apiError(error);
  }
}
