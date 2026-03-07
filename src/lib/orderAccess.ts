import { createHmac, timingSafeEqual } from "crypto";

type Payload = {
  orderId: string;
  exp: number;
};

function base64UrlEncode(input: string | Buffer) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET/NEXTAUTH_SECRET");
  return secret;
}

export function createOrderAccessToken(orderId: string, opts?: { ttlSeconds?: number }) {
  const ttlSeconds = opts?.ttlSeconds ?? 60 * 60 * 24 * 30;
  const payload: Payload = {
    orderId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadJson);

  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(sig);

  return `${payloadB64}.${sigB64}`;
}

export function verifyOrderAccessToken(token: string, expectedOrderId: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false as const, error: "Invalid token" };

  const [payloadB64, sigB64] = parts;
  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();

  const actualSig = Buffer.from(
    sigB64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (sigB64.length % 4)) % 4),
    "base64",
  );

  if (actualSig.length !== expectedSig.length || !timingSafeEqual(actualSig, expectedSig)) {
    return { ok: false as const, error: "Invalid token" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64)) as Payload;
  } catch {
    return { ok: false as const, error: "Invalid token" };
  }

  if (!payload?.orderId || !payload?.exp) return { ok: false as const, error: "Invalid token" };
  if (payload.orderId !== expectedOrderId) return { ok: false as const, error: "Invalid token" };
  if (payload.exp < Math.floor(Date.now() / 1000)) return { ok: false as const, error: "Expired token" };

  return { ok: true as const };
}
