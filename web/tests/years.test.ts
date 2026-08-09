import assert from "node:assert/strict";
import test from "node:test";
import {
  formatGregorianYearInput,
  parseGregorianYearInput,
} from "../lib/years";

test("tek Miladî yılı ana kolona ayırır", () => {
  assert.deepEqual(parseGregorianYearInput("856"), {
    primary: 856,
    secondary: null,
  });
});

test("tireli Miladî yılı iki ardışık kolona ayırır", () => {
  assert.deepEqual(parseGregorianYearInput("856-857"), {
    primary: 856,
    secondary: 857,
  });
  assert.equal(formatGregorianYearInput(856, 857), "856-857");
});

test("ardışık olmayan veya metinsel Miladî tarih reddedilir", () => {
  assert.throws(() => parseGregorianYearInput("856-858"));
  assert.throws(() => parseGregorianYearInput("yaklaşık 856"));
});
