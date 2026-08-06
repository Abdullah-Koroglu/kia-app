import "dotenv/config";
import postgres from "postgres";
import { hashPassword } from "../lib/password";
import { writeAudit } from "../lib/audit";
import { PERMISSIONS, ROLE_CODES } from "../lib/permissions";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL tanımlı değil.");

const client = postgres(databaseUrl, { max: 1 });

const permissionSeeds = Object.values(PERMISSIONS).map((code) => [
  code,
  code
    .split("_")
    .map((part) => part[0] + part.slice(1).toLocaleLowerCase("tr-TR"))
    .join(" "),
] as const);

const roleSeeds = [
  [ROLE_CODES.MANAGER, "Yönetici", "Kullanıcı ve görev yönetimini yürütür."],
  [ROLE_CODES.CONTROLLER, "Kontrolcü", "Âlim kayıtlarını inceler ve onaylar."],
  [ROLE_CODES.RESEARCHER, "Araştırmacı", "Atanan kapsamdaki âlimleri girer."],
] as const;

const rolePermissionSeeds: Record<string, string[]> = {
  [ROLE_CODES.MANAGER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DISABLE,
    PERMISSIONS.USER_ASSIGN_ROLE,
    PERMISSIONS.USER_RESET_PASSWORD,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.ASSIGNMENT_VIEW_ALL,
    PERMISSIONS.ASSIGNMENT_CREATE,
    PERMISSIONS.ASSIGNMENT_UPDATE,
    PERMISSIONS.ASSIGNMENT_CANCEL,
    PERMISSIONS.ASSIGNMENT_COMPLETE,
    PERMISSIONS.PERSON_VIEW,
    PERMISSIONS.PERSON_DELETE,
    PERMISSIONS.PERSON_CHANGE_EXTERNAL_ID,
    PERMISSIONS.RELATION_VIEW,
    PERMISSIONS.HOMELAND_VIEW,
    PERMISSIONS.HOMELAND_CREATE,
  ],
  [ROLE_CODES.CONTROLLER]: [
    PERMISSIONS.PERSON_VIEW,
    PERMISSIONS.RELATION_VIEW,
    PERMISSIONS.HOMELAND_VIEW,
    PERMISSIONS.HOMELAND_CREATE,
    PERMISSIONS.REVIEW_QUEUE_VIEW,
    PERMISSIONS.PERSON_REVIEW_VIEW,
    PERMISSIONS.PERSON_APPROVE,
    PERMISSIONS.PERSON_REQUEST_CHANGES,
    PERMISSIONS.PERSON_REVIEW_COMMENT,
    PERMISSIONS.PERSON_APPROVAL_REVOKE,
  ],
  [ROLE_CODES.RESEARCHER]: [
    PERMISSIONS.ASSIGNMENT_VIEW_OWN,
    PERMISSIONS.PERSON_VIEW,
    PERMISSIONS.PERSON_CREATE_IN_ASSIGNMENT,
    PERMISSIONS.PERSON_UPDATE_IN_ASSIGNMENT,
    PERMISSIONS.RELATION_VIEW,
    PERMISSIONS.RELATION_CREATE_IN_ASSIGNMENT,
    PERMISSIONS.RELATION_UPDATE_IN_ASSIGNMENT,
    PERMISSIONS.RELATION_DELETE_IN_ASSIGNMENT,
    PERMISSIONS.HOMELAND_VIEW,
    PERMISSIONS.HOMELAND_CREATE,
  ],
};

async function seedAuthorization(database: typeof client) {
  for (const [code, name] of permissionSeeds) {
    await database`
      insert into permissions (code, name)
      values (${code}, ${name})
      on conflict (code) do update set name = excluded.name
    `;
  }
  for (const [code, name, description] of roleSeeds) {
    await database`
      insert into roles (code, name, description, is_system)
      values (${code}, ${name}, ${description}, true)
      on conflict (code) do update set
        name = excluded.name,
        description = excluded.description,
        is_system = true
    `;
  }
  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissionSeeds,
  )) {
    await database`
      insert into role_permissions (role_id, permission_id)
      select r.id, p.id
      from roles r
      cross join permissions p
      where r.code = ${roleCode}
        and p.code = any(${permissionCodes})
      on conflict (role_id, permission_id) do nothing
    `;
  }
}

const dictionarySeeds = {
  methods: [
    ["Arz", "Talebenin hocaya okuyarak aldığı kıraat."],
    ["Semâ", "Talebenin hocadan dinleyerek aldığı kıraat."],
    ["Arz ve Semâ", "Her iki yöntemin birlikte kullanıldığı aktarım."],
    [
      "Belirsiz Rivayet",
      "Aktarım biliniyor fakat arz/semâ ayrımı yapılamıyor.",
    ],
  ],
  scopes: [
    ["Tam Kur'an / Hatim", null],
    ["Kıraat", null],
    ["Harfler ve Vecihler", null],
    ["Belirtilmemiş", null],
  ],
  certainties: [
    ["Kesin", null],
    ["Sahih / Tercih Edilen", null],
    ["Muhtemel", null],
    ["Zayıf", "Görüşün kabul gücü düşüktür."],
    ["İhtilaflı", "Birden fazla farklı değerlendirme vardır."],
    ["Belirtilmemiş", null],
  ],
  places: [
    ["Mekke", null],
    ["Medine", null],
    ["Kûfe", null],
    ["Basra", null],
    ["Şam", null],
    ["Bağdat", null],
  ],
} as const;

async function seedDictionary(
  database: typeof client,
  table: keyof typeof dictionarySeeds,
  rows: readonly (readonly [string, string | null])[],
) {
  for (const [name, description] of rows) {
    const inserted =
      table === "places"
        ? await database<{ id: number; name: string }[]>`
            insert into places (name)
            values (${name})
            on conflict (name) do nothing
            returning id, name
          `
        : await database<{ id: number; name: string }[]>`
            insert into ${database(table)} (name, description)
            values (${name}, ${description})
            on conflict (name) do nothing
            returning id, name
          `;

    if (inserted[0]) {
      await writeAudit(database, {
        actorUsername: "system",
        actorType: "SYSTEM",
        action: "SEED",
        entityType: table,
        entityId: String(inserted[0].id),
        source: "SEED",
        after: inserted[0],
      });
    }
  }
}

try {
  await client.begin(async (transaction) => {
    const database = transaction as unknown as typeof client;
    await seedAuthorization(database);
    for (const [table, rows] of Object.entries(dictionarySeeds)) {
      await seedDictionary(
        database,
        table as keyof typeof dictionarySeeds,
        rows as readonly (readonly [string, string | null])[],
      );
    }
  });

  const username = process.env.SEED_USERNAME?.trim();
  const password = process.env.SEED_PASSWORD;
  if (username && password) {
    const passwordHash = await hashPassword(password);
    const inserted = await client<{ id: string; username: string }[]>`
      insert into users (username, password_hash, display_name)
      values (${username}, ${passwordHash}, ${username})
      on conflict (username) do update set is_active = true
      returning id, username
    `;
    if (inserted[0]) {
      await client`
        insert into user_roles (user_id, role_id)
        select ${inserted[0].id}, id from roles where code = ${ROLE_CODES.MANAGER}
        on conflict (user_id, role_id) do nothing
      `;
      await writeAudit(client, {
        actorUsername: "system",
        actorType: "SYSTEM",
        action: "SEED",
        entityType: "User",
        entityId: inserted[0].id,
        source: "SEED",
        after: inserted[0],
      });
    }
  }

  console.log("Seed tamamlandı.");
} finally {
  await client.end();
}
