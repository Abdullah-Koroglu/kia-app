import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, placeInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PLACE_UPDATE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = placeInputSchema.parse(await request.json());
    const updated = await sql.begin(async (transaction) => {
      const before = await transaction`select id, name from places where id = ${id} for update`;
      if (!before[0]) return null;
      const after = await transaction`
        update places set name = ${input.name}, updated_at = now()
        where id = ${id} returning id, name
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "UPDATE", entityType: "Place", entityId: id,
        before: before[0] as Record<string, unknown>,
        after: after[0] as Record<string, unknown>, context: requestContext(request),
      });
      return after[0];
    });
    if (!updated) return Response.json({ error: "Mekân bulunamadı." }, { status: 404 });
    return Response.json(updated);
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.PLACE_DELETE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const deleted = await sql.begin(async (transaction) => {
      const before = await transaction`select id, name from places where id = ${id} for update`;
      if (!before[0]) return false;
      await transaction`delete from places where id = ${id}`;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user, action: "DELETE", entityType: "Place", entityId: id,
        before: before[0] as Record<string, unknown>, context: requestContext(request),
      });
      return true;
    });
    if (!deleted) return Response.json({ error: "Mekân bulunamadı." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
