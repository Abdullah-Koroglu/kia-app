import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PERSON_REVIEW_VIEW);
  if (auth.response) return auth.response;
  const { id } = await route.params;
  const items = await sql`
    select pr.id, pr.action, pr.comment, pr.person_version as "personVersion",
      pr.created_at as "createdAt", pr.reviewer_user_id as "reviewerUserId",
      coalesce(u.display_name, u.username) as "reviewerName"
    from person_reviews pr
    join users u on u.id = pr.reviewer_user_id
    where pr.person_id = ${id}
    order by pr.created_at desc
  `;
  return Response.json({ items });
}
