import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission, PERMISSIONS } from "../lib/permissions";

test("hasPermission yalnızca verilen permission için true döner", () => {
  const permissions = [PERMISSIONS.PERSON_VIEW, PERMISSIONS.PLACE_CREATE];
  assert.equal(hasPermission(permissions, PERMISSIONS.PERSON_VIEW), true);
  assert.equal(hasPermission(permissions, PERMISSIONS.PERSON_DELETE), false);
});

test("boş permission listesi yetki sağlamaz", () => {
  assert.equal(hasPermission([], PERMISSIONS.USER_VIEW), false);
});

test("tam âlim görüntüleme yetkisi ayrı olarak verilir", () => {
  const permissions = [PERMISSIONS.PERSON_VIEW, PERMISSIONS.PERSON_VIEW_ALL];
  assert.equal(hasPermission(permissions, PERMISSIONS.PERSON_VIEW_ALL), true);
  assert.equal(hasPermission([PERMISSIONS.PERSON_VIEW], PERMISSIONS.PERSON_VIEW_ALL), false);
});
