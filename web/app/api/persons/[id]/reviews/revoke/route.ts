import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, reviewCommentSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_APPROVAL_REVOKE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = reviewCommentSchema.parse(await request.json());
    const revoked = await sql.begin(async (transaction) => {
      const rows = await transaction<{ contentVersion: number }[]>`
        update persons set review_status = 'NOT_READY', approved_version = null,
          approved_at = null, approved_by_user_id = null, updated_at = now()
        where id = ${id} and review_status = 'APPROVED'
        returning content_version as "contentVersion"
      `;
      if (!rows[0]) return false;
      await transaction`
        insert into person_reviews (person_id, reviewer_user_id, action, comment, person_version)
        values (${id}, ${auth.user.id}, 'APPROVAL_REVOKED', ${input.comment}, ${rows[0].contentVersion})
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "UPDATE", entityType: "PersonReview", entityId: id,
        after: { reviewStatus: "NOT_READY", comment: input.comment },
        context: requestContext(request),
      });
      return true;
    });
    if (!revoked) return Response.json({ error: "Onaylı âlim bulunamadı." }, { status: 404 });
    return Response.json({ ok: true, reviewStatus: "NOT_READY" });
  } catch (error) { return apiError(error); }
}
