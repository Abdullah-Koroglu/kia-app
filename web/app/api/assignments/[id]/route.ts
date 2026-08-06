import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { assignmentTotal, lockAndFindScopeConflict } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS, ROLE_CODES } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, assignmentInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.ASSIGNMENT_UPDATE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = assignmentInputSchema.parse(await request.json());
    const updated = await sql.begin(async (transaction) => {
      const beforeRows = await transaction`
        select id, researcher_user_id as "researcherUserId", title, description,
          starts_at as "startsAt", deadline_at as "deadlineAt", status
        from research_assignments where id = ${id} for update
      `;
      if (!beforeRows[0]) return null;
      if (beforeRows[0].status !== "ACTIVE") {
        throw new Error("Yalnızca aktif görevler düzenlenebilir.");
      }
      const researcher = await transaction`
        select 1 from users u
        join user_roles ur on ur.user_id = u.id
        join roles r on r.id = ur.role_id
        where u.id = ${input.researcherUserId} and u.is_active
          and r.code = ${ROLE_CODES.RESEARCHER} and r.is_active limit 1
      `;
      if (!researcher[0]) throw new Error("Aktif araştırmacı bulunamadı.");
      const conflict = await lockAndFindScopeConflict(
        transaction as unknown as typeof sql,
        input.scopes,
        id,
      );
      if (conflict) {
        const error = new Error(`${conflict.startId}-${conflict.endId} aralığı “${conflict.title}” göreviyle çakışıyor.`);
        Object.assign(error, { code: "ASSIGNMENT_CONFLICT" }); throw error;
      }
      const afterRows = await transaction`
        update research_assignments set researcher_user_id = ${input.researcherUserId},
          title = ${input.title}, description = ${input.description},
          starts_at = ${input.startsAt}::timestamptz,
          deadline_at = ${input.deadlineAt}::timestamptz, updated_at = now()
        where id = ${id}
        returning id, researcher_user_id as "researcherUserId", title, description,
          starts_at as "startsAt", deadline_at as "deadlineAt", status
      `;
      await transaction`delete from research_assignment_scopes where assignment_id = ${id}`;
      for (const scope of input.scopes) {
        await transaction`insert into research_assignment_scopes
          (assignment_id, start_ext_source_id, end_ext_source_id)
          values (${id}, ${scope.startExtSourceId}, ${scope.endExtSourceId})`;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "UPDATE", entityType: "ResearchAssignment",
        entityId: id, before: beforeRows[0] as Record<string, unknown>,
        after: { ...(afterRows[0] as Record<string, unknown>), scopes: input.scopes, assignedCount: assignmentTotal(input.scopes) },
        context: requestContext(request),
      });
      return afterRows[0];
    });
    if (!updated) return Response.json({ error: "Görev bulunamadı." }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ASSIGNMENT_CONFLICT") {
      return Response.json({ error: error instanceof Error ? error.message : "Görev kapsamı çakışıyor." }, { status: 409 });
    }
    return apiError(error);
  }
}
