// Admin access is granted by a long "magic link" token (`/admin?k=<token>`).
// SECURITY: the token itself is NEVER stored in this (public) repo — only its
// SHA-256 hash lives here, which cannot be reversed into the token. Validation
// hashes the incoming value and compares. Works in both the Edge middleware and
// Node server (crypto.subtle is global in both).

const ADMIN_KEY_HASH =
  "a0ca310f6dcd22a6a114db3f94c795f80b283eb4d67d9c1dc5c0023451283839";

export const ADMIN_COOKIE = "csn_ak";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True if the value is the magic-link token, the env key, or the legacy key. */
export async function isValidAdminKey(
  value: string | null | undefined
): Promise<boolean> {
  if (!value) return false;
  const envKey = process.env.CSN_ADMIN_KEY;
  if (envKey && value === envKey) return true;
  if (!envKey && value === "mitcan") return true; // legacy short key (compat)
  try {
    return (await sha256Hex(value)) === ADMIN_KEY_HASH;
  } catch {
    return false;
  }
}
