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

export async function findWritableAssignment(
  database: Queryable,
  userId: string,
  extSourceId: number,
) {
  const rows = await database<{ id: string }[]>`
    select a.id
    from research_assignments a
    join research_assignment_scopes s on s.assignment_id = a.id
    where a.researcher_user_id = ${userId}
      and a.status = 'ACTIVE'
      and a.starts_at <= now()
      and ${extSourceId} between s.start_ext_source_id and s.end_ext_source_id
    order by a.starts_at desc
    limit 1
  `;
  return rows[0]?.id ?? null;
}

export async function getWritableRanges(database: Queryable, userId: string) {
  return database<{ startExtSourceId: number; endExtSourceId: number }[]>`
    select s.start_ext_source_id as "startExtSourceId",
      s.end_ext_source_id as "endExtSourceId"
    from research_assignments a
    join research_assignment_scopes s on s.assignment_id = a.id
    where a.researcher_user_id = ${userId}
      and a.status = 'ACTIVE' and a.starts_at <= now()
    order by s.start_ext_source_id
  `;
}

export function isExtSourceIdInRanges(
  extSourceId: number,
  ranges: readonly AssignmentScopeInput[],
) {
  return ranges.some(
    (range) =>
      extSourceId >= range.startExtSourceId &&
      extSourceId <= range.endExtSourceId,
  );
}

export async function canWriteAnyPerson(
  database: Queryable,
  userId: string,
  personIds: readonly string[],
) {
  if (!personIds.length) return false;
  const rows = await database`
    select 1
    from persons p
    join research_assignment_scopes s
      on p.ext_source_id between s.start_ext_source_id and s.end_ext_source_id
    join research_assignments a on a.id = s.assignment_id
    where p.id = any(${personIds})
      and a.researcher_user_id = ${userId}
      and a.status = 'ACTIVE' and a.starts_at <= now()
    limit 1
  `;
  return Boolean(rows[0]);
}
