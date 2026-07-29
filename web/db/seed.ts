import "dotenv/config";
import postgres from "postgres";
import { hashPassword } from "../lib/password";
import { writeAudit } from "../lib/audit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL tanımlı değil.");

const client = postgres(databaseUrl, { max: 1 });

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
      insert into users (username, password_hash)
      values (${username}, ${passwordHash})
      on conflict (username) do nothing
      returning id, username
    `;
    if (inserted[0]) {
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
