import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { findWritableAssignment } from "@/lib/assignments";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  const result = await sql.begin(async (transaction) => {
    const rows = await transaction<
      { extSourceId: number; reviewStatus: string; contentVersion: number }[]
    >`
      select ext_source_id as "extSourceId", review_status as "reviewStatus",
        content_version as "contentVersion"
      from persons where id = ${id} for update
    `;
    const person = rows[0];
    if (!person) return { error: "Âlim bulunamadı.", status: 404 };
    if (!['NOT_READY', 'CHANGES_REQUESTED'].includes(person.reviewStatus)) {
      return { error: "Bu âlim mevcut durumda kontrole gönderilemez.", status: 409 };
    }
    if (!(await findWritableAssignment(transaction as unknown as typeof sql, auth.user.id, person.extSourceId))) {
      return { error: "Âlim aktif görev kapsamınızda bulunmuyor.", status: 403 };
    }
    const action = person.reviewStatus === "CHANGES_REQUESTED" ? "RESUBMITTED" : "SUBMITTED";
    await transaction`
      insert into person_reviews (person_id, reviewer_user_id, action, person_version)
      values (${id}, ${auth.user.id}, ${action}, ${person.contentVersion})
    `;
    await transaction`
      update persons set review_status = 'READY_FOR_REVIEW',
        submitted_for_review_at = now(), submitted_for_review_by_user_id = ${auth.user.id},
        updated_at = now() where id = ${id}
    `;
    await writeAudit(transaction as unknown as typeof sql, {
      actor: auth.user, action: "UPDATE", entityType: "PersonReview",
      entityId: id, after: { reviewStatus: "READY_FOR_REVIEW", action, personVersion: person.contentVersion },
      context: requestContext(request),
    });
    return { ok: true, status: 200 };
  });
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, reviewStatus: "READY_FOR_REVIEW" });
}
