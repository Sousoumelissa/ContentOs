export const authCookieName = "content_os_session";
export const authSessionMaxAge = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.CONTENT_OS_AUTH_SECRET || process.env.CONTENT_OS_PASSWORD || "";
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string) {
  const secret = getSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return bytesToHex(new Uint8Array(signature));
}

export async function createSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt);

  return `${issuedAt}.${signature}`;
}

export async function isValidSessionToken(token?: string) {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const ageInSeconds = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(ageInSeconds) || ageInSeconds > authSessionMaxAge) return false;

  return signature === (await sign(issuedAt));
}
