import "server-only";
import type postgres from "postgres";

type Queryable = ReturnType<typeof postgres>;
export type AssignmentScopeInput = {
  startExtSourceId: number;
  endExtSourceId: number;
};

const ASSIGNMENT_LOCK_KEY = 7_241_903;

export function assignmentTotal(scopes: readonly AssignmentScopeInput[]) {
  return scopes.reduce(
    (total, scope) => total + scope.endExtSourceId - scope.startExtSourceId + 1,
    0,
  );
}

export async function lockAndFindScopeConflict(
  database: Queryable,
  scopes: readonly AssignmentScopeInput[],
  excludeAssignmentId?: string,
) {
  await database`select pg_advisory_xact_lock(${ASSIGNMENT_LOCK_KEY})`;
  for (const scope of scopes) {
    const rows = await database<
      { assignmentId: string; title: string; researcherName: string; startId: number; endId: number }[]
    >`
      select a.id as "assignmentId", a.title,
        coalesce(u.display_name, u.username) as "researcherName",
        s.start_ext_source_id as "startId", s.end_ext_source_id as "endId"
      from research_assignment_scopes s
      join research_assignments a on a.id = s.assignment_id
      join users u on u.id = a.researcher_user_id
      where a.status = 'ACTIVE'
        and s.start_ext_source_id <= ${scope.endExtSourceId}
        and s.end_ext_source_id >= ${scope.startExtSourceId}
        ${excludeAssignmentId ? database`and a.id <> ${excludeAssignmentId}` : database``}
      limit 1
    `;
    if (rows[0]) return rows[0];
  }
  return null;
}
