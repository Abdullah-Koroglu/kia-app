import { sql } from "@/db";
import { requireApiUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const [methods, scopes, certainties, places] = await Promise.all([
    sql`select id, name, description from methods order by id`,
    sql`select id, name, description from scopes order by id`,
    sql`select id, name, description from certainties order by id`,
    sql`select id, name from places order by name`,
  ]);

  return Response.json({ methods, scopes, certainties, places });
}

