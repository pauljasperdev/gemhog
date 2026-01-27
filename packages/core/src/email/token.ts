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
  Effect.gen(function* () {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) {
      return yield* Effect.fail(new InvalidTokenError({ reason: "malformed" }));
    }

    const data = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);

    const expected = createHmac("sha256", secret).update(data).digest("hex");

    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return yield* Effect.fail(
        new InvalidTokenError({ reason: "invalid_signature" }),
      );
    }

    const payload: TokenPayload = yield* Effect.try({
      try: () => JSON.parse(data) as TokenPayload,
      catch: () => new InvalidTokenError({ reason: "malformed" }),
    });

    if (Date.now() > payload.expiresAt) {
      return yield* Effect.fail(new InvalidTokenError({ reason: "expired" }));
    }

    return payload;
  });
