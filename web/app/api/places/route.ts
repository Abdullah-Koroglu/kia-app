import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { apiError, placeInputSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const items = await sql`
    select
      p.id,
      p.name,
      (
        (select count(*) from relations r where r.place_id = p.id) +
        (select count(*) from persons pe where pe.homeland_id = p.id)
      )::int as "usageCount"
    from places p
    order by p.name
  `;
  return Response.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  try {
    const input = placeInputSchema.parse(await request.json());
    const rows = await sql`
      insert into places (name) values (${input.name})
      returning id, name
    `;
    const created = rows[0] as Record<string, unknown>;
    await writeAudit(sql, {
      actor: auth.user, action: "CREATE", entityType: "Place",
      entityId: String(created.id), after: created,
      context: requestContext(request),
    });
    return Response.json(created, { status: 201 });
  } catch (error) { return apiError(error); }
}
