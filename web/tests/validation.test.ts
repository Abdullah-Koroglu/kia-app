import assert from "node:assert/strict";
import test from "node:test";
import {
  personInputSchema,
  assignmentInputSchema,
  relationInputSchema,
  roleCreateSchema,
  userCreateSchema,
} from "../lib/validation";

test("geçerli kişi kaydını kabul eder", () => {
  const result = personInputSchema.safeParse({
    extSourceId: 125,
    name: "Âsım",
    birthYearHijri: 120,
    deathYearHijri: 190,
  });
  assert.equal(result.success, true);
});

test("vefat yılı doğumdan küçük olamaz", () => {
  const result = personInputSchema.safeParse({
    extSourceId: 125,
    name: "Âsım",
    birthYearHijri: 190,
    deathYearHijri: 120,
  });
  assert.equal(result.success, false);
});

test("kişi kendisiyle ilişkilendirilemez", () => {
  const id = "8a8ec0aa-f92b-49eb-876a-9c18fa70bf4c";
  const result = relationInputSchema.safeParse({
    teacherId: id,
    studentId: id,
    methodId: 1,
    scopeId: 1,
    certaintyId: 1,
  });
  assert.equal(result.success, false);
});

test("kullanıcı en az bir rol ve güçlü şifreyle oluşturulur", () => {
  const result = userCreateSchema.safeParse({
    username: "arastirmaci",
    displayName: "Araştırmacı",
    password: "guclu-sifre-123",
    roleIds: ["00000000-0000-4000-8000-000000000001"],
  });
  assert.equal(result.success, true);
});

test("özel rol kodu teknik formata uymalıdır", () => {
  const result = roleCreateSchema.safeParse({
    code: "özel rol",
    name: "Özel Rol",
    description: null,
    permissionIds: [],
  });
  assert.equal(result.success, false);
});

test("görev içindeki ID aralıkları çakışamaz", () => {
  const result = assignmentInputSchema.safeParse({
    researcherUserId: "00000000-0000-4000-8000-000000000001",
    title: "Test görevi",
    startsAt: "2026-08-01T00:00:00.000Z",
    deadlineAt: "2026-08-31T00:00:00.000Z",
    scopes: [
      { startExtSourceId: 1, endExtSourceId: 20 },
      { startExtSourceId: 15, endExtSourceId: 30 },
    ],
  });
  assert.equal(result.success, false);
});

test("deadline başlangıçtan sonra olmalıdır", () => {
  const result = assignmentInputSchema.safeParse({
    researcherUserId: "00000000-0000-4000-8000-000000000001",
    title: "Test görevi",
    startsAt: "2026-08-31T00:00:00.000Z",
    deadlineAt: "2026-08-01T00:00:00.000Z",
    scopes: [{ startExtSourceId: 1, endExtSourceId: 20 }],
  });
  assert.equal(result.success, false);
});
