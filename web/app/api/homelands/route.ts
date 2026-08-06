import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { requestContext } from "@/lib/request-context";
import { normalizeSearchText } from "@/lib/search";
import { apiError, homelandInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const normalized = normalizeSearchText(query);
  const items = await sql`
    select id, name from homelands
    where ${query ? sql`normalized_name like '%' || ${normalized} || '%'` : sql`true`}
    order by name
    limit 100
  `;
  return Response.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  try {
    const input = homelandInputSchema.parse(await request.json());
    const normalizedName = normalizeSearchText(input.name);
    const rows = await sql`
      insert into homelands (name, normalized_name, created_by_user_id)
      values (${input.name}, ${normalizedName}, ${auth.user.id})
      returning id, name
    `;
    const created = rows[0] as Record<string, unknown>;
    await writeAudit(sql, {
      actor: auth.user,
      action: "CREATE",
      entityType: "Homeland",
      entityId: String(created.id),
      after: created,
      context: requestContext(request),
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
