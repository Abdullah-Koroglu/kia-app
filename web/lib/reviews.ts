import "server-only";
import type postgres from "postgres";

type Queryable = ReturnType<typeof postgres>;

export async function invalidatePersonApprovals(
  database: Queryable,
  personIds: readonly string[],
) {
  if (!personIds.length) return;
  await database`
    update persons set
      content_version = content_version + 1,
      review_status = case
        when review_status = 'CHANGES_REQUESTED' then 'CHANGES_REQUESTED'::person_review_status
        else 'NOT_READY'::person_review_status
      end,
      approved_version = null,
      approved_at = null,
      approved_by_user_id = null,
      updated_at = now()
    where id = any(${[...new Set(personIds)]})
  `;
}
