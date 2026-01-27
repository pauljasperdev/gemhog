import { createHmac, timingSafeEqual } from "node:crypto";
import { Effect } from "effect";
import { InvalidTokenError } from "./email.errors";

export interface TokenPayload {
  email: string;
  action: "verify" | "unsubscribe";
  expiresAt: number;
}

export const createToken = (
  payload: TokenPayload,
  secret: string,
): Effect.Effect<string> =>
  Effect.sync(() => {
    const data = JSON.stringify(payload);
    const signature = createHmac("sha256", secret).update(data).digest("hex");
    return Buffer.from(`${data}.${signature}`).toString("base64url");
  });

export const verifyToken = (
  token: string,
  secret: string,
): Effect.Effect<TokenPayload, InvalidTokenError> =>
  Effect.try({
    try: () => {
      const decoded = Buffer.from(token, "base64url").toString();
      const lastDot = decoded.lastIndexOf(".");
      if (lastDot === -1) throw new Error("malformed");

      const data = decoded.slice(0, lastDot);
      const signature = decoded.slice(lastDot + 1);

      const expected = createHmac("sha256", secret).update(data).digest("hex");

      if (signature.length !== expected.length) {
        throw new Error("invalid_signature");
      }

      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new Error("invalid_signature");
      }

      const payload: TokenPayload = JSON.parse(data);
      if (Date.now() > payload.expiresAt) throw new Error("expired");

      return payload;
    },
    catch: (error) =>
      new InvalidTokenError({
        reason:
          error instanceof Error &&
          (error.message === "expired" ||
            error.message === "invalid_signature" ||
            error.message === "malformed")
            ? error.message
            : "malformed",
      }),
  });
