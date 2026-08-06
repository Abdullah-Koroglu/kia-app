import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, reviewCommentSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_APPROVE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = reviewCommentSchema.parse(await request.json());
    const result = await sql.begin(async (transaction) => {
      const rows = await transaction<
        { extSourceId: number; createdByUserId: string | null; reviewStatus: string; contentVersion: number }[]
      >`
        select ext_source_id as "extSourceId", created_by_user_id as "createdByUserId",
          review_status as "reviewStatus", content_version as "contentVersion"
        from persons where id = ${id} for update
      `;
      const person = rows[0];
      if (!person) return { error: "Âlim bulunamadı.", status: 404 };
      if (person.reviewStatus !== "READY_FOR_REVIEW") return { error: "Âlim kontrol beklemiyor.", status: 409 };
      const ownScope = await transaction`
        select 1 from research_assignments a
        join research_assignment_scopes s on s.assignment_id = a.id
        where a.researcher_user_id = ${auth.user.id} and a.status = 'ACTIVE'
          and ${person.extSourceId} between s.start_ext_source_id and s.end_ext_source_id
        limit 1
      `;
      if (person.createdByUserId === auth.user.id || ownScope[0]) {
        return { error: "Kendi oluşturduğunuz veya sorumluluğunuzdaki âlimi onaylayamazsınız.", status: 403 };
      }
      await transaction`
        insert into person_reviews (person_id, reviewer_user_id, action, comment, person_version)
        values (${id}, ${auth.user.id}, 'APPROVED', ${input.comment}, ${person.contentVersion})
      `;
      await transaction`
        update persons set review_status = 'APPROVED',
          approved_version = content_version, approved_at = now(),
          approved_by_user_id = ${auth.user.id}, updated_at = now()
        where id = ${id}
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "UPDATE", entityType: "PersonReview", entityId: id,
        after: { reviewStatus: "APPROVED", approvedVersion: person.contentVersion, comment: input.comment },
        context: requestContext(request),
      });
      return { ok: true, status: 200 };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true, reviewStatus: "APPROVED" });
  } catch (error) { return apiError(error); }
}
