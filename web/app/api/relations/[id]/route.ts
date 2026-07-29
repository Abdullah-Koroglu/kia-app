import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { apiError, relationInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

const relationSelect = sql`
  id, teacher_id as "teacherId", student_id as "studentId",
  method_id as "methodId", scope_id as "scopeId",
  certainty_id as "certaintyId", place_id as "placeId",
  detail_note as "detailNote"
`;

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;

  try {
    const input = relationInputSchema.parse(await request.json());
    const updated = await sql.begin(async (transaction) => {
      const beforeRows = await transaction`
        select ${relationSelect} from relations where id = ${id} for update
      `;
      if (!beforeRows[0]) return null;
      const afterRows = await transaction`
        update relations set
          teacher_id = ${input.teacherId},
          student_id = ${input.studentId},
          method_id = ${input.methodId},
          scope_id = ${input.scopeId},
          certainty_id = ${input.certaintyId},
          place_id = ${input.placeId},
          detail_note = ${input.detailNote},
          updated_at = now()
        where id = ${id}
        returning ${relationSelect}
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "UPDATE",
        entityType: "Relation",
        entityId: id,
        before: beforeRows[0] as Record<string, unknown>,
        after: afterRows[0] as Record<string, unknown>,
        context: requestContext(request),
      });
      return afterRows[0];
    });

    if (!updated) {
      return Response.json({ error: "İlişki bulunamadı." }, { status: 404 });
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
        select ${relationSelect} from relations where id = ${id} for update
      `;
      if (!rows[0]) return false;
      await transaction`delete from relations where id = ${id}`;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "DELETE",
        entityType: "Relation",
        entityId: id,
        before: rows[0] as Record<string, unknown>,
        context: requestContext(request),
      });
      return true;
    });
    if (!deleted) {
      return Response.json({ error: "İlişki bulunamadı." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}

