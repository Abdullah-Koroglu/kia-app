import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await requireApiPermission(PERMISSIONS.REVIEW_QUEUE_VIEW);
  if (auth.response) return auth.response;
  const status = new URL(request.url).searchParams.get("status") ?? "READY_FOR_REVIEW";
  const allowed = ["READY_FOR_REVIEW", "CHANGES_REQUESTED", "APPROVED"];
  const selected = allowed.includes(status) ? status : "READY_FOR_REVIEW";
  const items = await sql`
    select p.id, p.ext_source_id as "extSourceId", p.name,
      p.review_status as "reviewStatus", p.content_version as "contentVersion",
      p.submitted_for_review_at as "submittedForReviewAt",
      coalesce(creator.display_name, creator.username) as "researcherName",
      a.title as "assignmentTitle", a.deadline_at as "deadlineAt",
      (a.status = 'ACTIVE' and a.deadline_at < now()) as "isOverdue"
    from persons p
    left join users creator on creator.id = p.created_by_user_id
    left join research_assignments a on a.id = p.created_under_assignment_id
    where p.review_status = ${selected}
    order by p.submitted_for_review_at asc nulls last, p.ext_source_id
  `;
  return Response.json({ items });
}
