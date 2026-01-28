import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";

import { EmailLayers } from "@/lib/email-layers";

export type VerifyStatus = "success" | "expired" | "invalid" | "error";

export async function getVerifyStatus(token: string): Promise<VerifyStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, env.BETTER_AUTH_SECRET);
    yield* subscriberService.verify(payload.email);
    return "success" as VerifyStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", (error) =>
      Effect.succeed(
        (error.reason === "expired" ? "expired" : "invalid") as VerifyStatus,
      ),
    ),
    Effect.catchAll(() => Effect.succeed("error" as VerifyStatus)),
  );

  return Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
}
