import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { PERMISSIONS, ROLE_CODES } from "@/lib/permissions";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.ASSIGNMENT_VIEW_ALL);
  if (auth.response) return auth.response;
  const items = await sql`
    select u.id as "userId", coalesce(u.display_name, u.username) as "displayName",
      u.username, u.is_active as "isActive",
      (select count(*)::int from research_assignments a
        where a.researcher_user_id = u.id and a.status = 'ACTIVE') as "activeAssignmentCount",
      (select count(*)::int from research_assignments a
        where a.researcher_user_id = u.id and a.status = 'ACTIVE'
          and a.deadline_at < now()) as "overdueAssignmentCount",
      coalesce((select sum(s.end_ext_source_id - s.start_ext_source_id + 1)::int
        from research_assignments a join research_assignment_scopes s on s.assignment_id = a.id
        where a.researcher_user_id = u.id and a.status <> 'CANCELLED'), 0) as "assignedCount",
      coalesce((select count(distinct (a.id, p.ext_source_id))::int
        from research_assignments a
        join research_assignment_scopes s on s.assignment_id = a.id
        join persons p on p.ext_source_id between s.start_ext_source_id and s.end_ext_source_id
        where a.researcher_user_id = u.id and a.status <> 'CANCELLED'), 0) as "createdCount",
      coalesce((select count(distinct (a.id, p.ext_source_id))::int
        from research_assignments a
        join research_assignment_scopes s on s.assignment_id = a.id
        join persons p on p.ext_source_id between s.start_ext_source_id and s.end_ext_source_id
        where a.researcher_user_id = u.id and a.status <> 'CANCELLED'
          and p.review_status = 'APPROVED' and p.approved_version = p.content_version), 0) as "approvedCount",
      coalesce((select count(distinct p.id)::int from persons p
        where p.created_by_user_id = u.id and p.review_status = 'READY_FOR_REVIEW'), 0) as "reviewPendingCount",
      coalesce((select count(distinct p.id)::int from persons p
        where p.created_by_user_id = u.id and p.review_status = 'CHANGES_REQUESTED'), 0) as "changesRequestedCount",
      (select max(greatest(p.created_at, p.updated_at)) from persons p
        where p.created_by_user_id = u.id or p.updated_by_user_id = u.id) as "lastActivityAt",
      (select min(a.deadline_at) from research_assignments a
        where a.researcher_user_id = u.id and a.status = 'ACTIVE') as "nearestDeadlineAt"
    from users u
    where exists (
      select 1 from user_roles ur join roles r on r.id = ur.role_id
      where ur.user_id = u.id and r.code = ${ROLE_CODES.RESEARCHER}
    )
    order by u.is_active desc, coalesce(u.display_name, u.username)
  `;
  return Response.json({ items });
}
