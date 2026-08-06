import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { canWriteAnyPerson } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { PERMISSIONS } from "@/lib/permissions";
import { invalidatePersonApprovals } from "@/lib/reviews";
import { apiError, relationInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiPermission(
    PERMISSIONS.RELATION_CREATE_IN_ASSIGNMENT,
  );
  if (auth.response || !auth.user) return auth.response;

  try {
    const input = relationInputSchema.parse(await request.json());
    const context = requestContext(request);
    const relation = await sql.begin(async (transaction) => {
      const inScope = await canWriteAnyPerson(
        transaction as unknown as typeof sql,
        auth.user.id,
        [input.teacherId, input.studentId],
      );
      if (!inScope) {
        const error = new Error("İlişkinin en az bir âlimi aktif görev kapsamınızda olmalıdır.");
        Object.assign(error, { code: "OUT_OF_ASSIGNMENT_SCOPE" });
        throw error;
      }
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
      await invalidatePersonApprovals(
        transaction as unknown as typeof sql,
        [input.teacherId, input.studentId],
      );
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
    if (typeof error === "object" && error && "code" in error && error.code === "OUT_OF_ASSIGNMENT_SCOPE") {
      return Response.json({ error: error instanceof Error ? error.message : "Görev kapsamı dışında." }, { status: 403 });
    }
    return apiError(error);
  }
}
