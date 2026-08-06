import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, changeRequestSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_REQUEST_CHANGES);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = changeRequestSchema.parse(await request.json());
    const result = await sql.begin(async (transaction) => {
      const rows = await transaction<{
        reviewStatus: string;
        contentVersion: number;
        extSourceId: number;
        createdByUserId: string | null;
      }[]>`
        select review_status as "reviewStatus", content_version as "contentVersion",
          ext_source_id as "extSourceId", created_by_user_id as "createdByUserId"
        from persons where id = ${id} for update
      `;
      const person = rows[0];
      if (!person) return { error: "Âlim bulunamadı.", status: 404 };
      if (!['READY_FOR_REVIEW', 'APPROVED'].includes(person.reviewStatus)) return { error: "Bu âlim için düzeltme istenemez.", status: 409 };
      const ownScope = await transaction`
        select 1 from research_assignments a
        join research_assignment_scopes s on s.assignment_id = a.id
        where a.researcher_user_id = ${auth.user.id} and a.status = 'ACTIVE'
          and ${person.extSourceId} between s.start_ext_source_id and s.end_ext_source_id
        limit 1
      `;
      if (person.createdByUserId === auth.user.id || ownScope[0]) {
        return { error: "Kendi oluşturduğunuz veya sorumluluğunuzdaki âlim için kontrol kararı veremezsiniz.", status: 403 };
      }
      await transaction`
        insert into person_reviews (person_id, reviewer_user_id, action, comment, person_version)
        values (${id}, ${auth.user.id}, 'CHANGES_REQUESTED', ${input.comment}, ${person.contentVersion})
      `;
      await transaction`
        update persons set review_status = 'CHANGES_REQUESTED', approved_version = null,
          approved_at = null, approved_by_user_id = null, updated_at = now()
        where id = ${id}
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "UPDATE", entityType: "PersonReview", entityId: id,
        after: { reviewStatus: "CHANGES_REQUESTED", comment: input.comment },
        context: requestContext(request),
      });
      return { ok: true, status: 200 };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true, reviewStatus: "CHANGES_REQUESTED" });
  } catch (error) { return apiError(error); }
}
