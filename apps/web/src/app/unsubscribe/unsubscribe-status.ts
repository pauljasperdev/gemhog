import {
  SubscriberLayers,
  SubscriberService,
  verifyToken,
} from "@gemhog/core/subscriber";
import { Effect } from "effect";

export type UnsubscribeStatus = "success" | "invalid" | "error";

export async function getUnsubscribeStatus(
  token: string,
): Promise<UnsubscribeStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberService;
    const payload = yield* verifyToken(token);
    const sub = yield* subscriberService.readSubscriberByEmail(payload.email);
    if (!sub) return "error" as UnsubscribeStatus;
    yield* subscriberService.unsubscribe(sub.id);
    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeStatus)),
  );

  return Effect.runPromise(program.pipe(Effect.provide(SubscriberLayers)));
}
