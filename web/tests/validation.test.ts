import assert from "node:assert/strict";
import test from "node:test";
import {
  personInputSchema,
  relationInputSchema,
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
