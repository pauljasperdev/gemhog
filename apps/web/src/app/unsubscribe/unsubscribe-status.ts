import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";

import { EmailLayers } from "@/lib/email-layers";

export type UnsubscribeStatus = "success" | "invalid" | "error";

export async function getUnsubscribeStatus(
  token: string,
): Promise<UnsubscribeStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, env.BETTER_AUTH_SECRET);
    yield* subscriberService.unsubscribe(payload.email);
    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeStatus)),
  );

  return Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
}
