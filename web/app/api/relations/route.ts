import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { apiError, relationInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;

  try {
    const input = relationInputSchema.parse(await request.json());
    const context = requestContext(request);
    const relation = await sql.begin(async (transaction) => {
      const rows = await transaction`
        insert into relations (
          teacher_id, student_id, method_id, scope_id,
          certainty_id, place_id, detail_note
        ) values (
          ${input.teacherId}, ${input.studentId}, ${input.methodId},
          ${input.scopeId}, ${input.certaintyId}, ${input.placeId},
          ${input.detailNote}
        )
        returning
          id, teacher_id as "teacherId", student_id as "studentId",
          method_id as "methodId", scope_id as "scopeId",
          certainty_id as "certaintyId", place_id as "placeId",
          detail_note as "detailNote"
      `;
      const created = rows[0] as Record<string, unknown>;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "CREATE",
        entityType: "Relation",
        entityId: String(created.id),
        after: created,
        context,
      });
      return created;
    });
    return Response.json(relation, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

