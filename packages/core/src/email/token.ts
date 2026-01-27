import { createHmac, timingSafeEqual } from "node:crypto";

interface TokenPayload {
  email: string;
  action: "verify" | "unsubscribe";
  expiresAt: number;
}

export function createToken(payload: TokenPayload, secret: string): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

export function verifyToken(
  token: string,
  secret: string,
): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return null;

    const data = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);

    const expected = createHmac("sha256", secret).update(data).digest("hex");

    if (signature.length !== expected.length) return null;

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(data);
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}
