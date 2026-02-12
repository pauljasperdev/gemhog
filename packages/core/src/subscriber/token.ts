import { createHmac, timingSafeEqual } from "node:crypto";
import { Config, Effect } from "effect";
import type { ConfigError } from "effect/ConfigError";
import { InvalidTokenError } from "./errors";

export interface TokenPayload {
  email: string;
  action: "verify" | "unsubscribe";
  expiresAt: number;
}

export const createToken = (
  payload: TokenPayload,
): Effect.Effect<string, ConfigError> =>
  Effect.gen(function* () {
    const BETTER_AUTH_SECRET = yield* Config.string("BETTER_AUTH_SECRET");
    const data = JSON.stringify(payload);
    const signature = createHmac("sha256", BETTER_AUTH_SECRET)
      .update(data)
      .digest("hex");
    return Buffer.from(`${data}.${signature}`).toString("base64url");
  });

export const verifyToken = (
  token: string,
): Effect.Effect<TokenPayload, InvalidTokenError | ConfigError> =>
  Effect.gen(function* () {
    const BETTER_AUTH_SECRET = yield* Config.string("BETTER_AUTH_SECRET");
    const decoded = Buffer.from(token, "base64url").toString();
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) {
      return yield* Effect.fail(new InvalidTokenError({ reason: "malformed" }));
    }

    const data = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);

    const expected = createHmac("sha256", BETTER_AUTH_SECRET)
      .update(data)
      .digest("hex");

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
