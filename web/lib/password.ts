import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function scrypt(
  password: string,
  salt: Buffer,
  length: number,
  options: { N: number; r: number; p: number },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  if (password.length < 10) {
    throw new Error("Şifre en az 10 karakter olmalıdır.");
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  });

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, costText, blockText, parallelText, saltText, hashText] =
    encoded.split("$");

  if (
    algorithm !== "scrypt" ||
    !costText ||
    !blockText ||
    !parallelText ||
    !saltText ||
    !hashText
  ) {
    return false;
  }

  const expected = Buffer.from(hashText, "base64url");
  const actual = await scrypt(
    password,
    Buffer.from(saltText, "base64url"),
    expected.length,
    {
      N: Number(costText),
      r: Number(blockText),
      p: Number(parallelText),
    },
  );

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
