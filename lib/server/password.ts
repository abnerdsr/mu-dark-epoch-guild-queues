import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Hash de senha com scrypt (nativo do Node, sem dependências).
// Formato salvo no banco: scrypt$N$r$p$<salt base64url>$<hash base64url>
const PREFIX = "scrypt";
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

function scryptAsync(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return [PREFIX, N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export function isLegacyHash(stored: string): boolean {
  return !stored.startsWith(`${PREFIX}$`);
}

/**
 * Hash antigo (lib/password-utils.ts original). Mantido SOMENTE para validar
 * senhas de usuários que ainda não logaram desde a migração; no primeiro login
 * a senha é regravada com scrypt.
 */
function legacyHash(password: string): string {
  let hash = 0;
  if (password.length === 0) return hash.toString();

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const salt = password.length * 7;
  hash = hash + salt;

  return Math.abs(hash).toString(16);
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (isLegacyHash(stored)) {
    return safeEqual(Buffer.from(legacyHash(password)), Buffer.from(stored));
  }

  const [, n, r, p, saltB64, hashB64] = stored.split("$");
  if (!n || !r || !p || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  return safeEqual(actual, expected);
}
