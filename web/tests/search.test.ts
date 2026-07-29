import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchText } from "../lib/search";

test("Türkçe karakterleri arama için normalize eder", () => {
  assert.equal(normalizeSearchText("  ÂSIM b. Şeyh  "), "asim b. seyh");
  assert.equal(normalizeSearchText("Kûfî"), "kufi");
  assert.equal(normalizeSearchText("İbnü'l-Cezerî"), "ibnu'l-cezeri");
});

