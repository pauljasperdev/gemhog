import {
  SubscriberLayers,
  SubscriberRepository,
  SubscriberService,
  verifyToken,
} from "@gemhog/subscriber";
import * as Effect from "effect";

export type UnsubscribeStatus = "success" | "invalid" | "error";

export async function getUnsubscribeStatus(
  token: string,
): Promise<UnsubscribeStatus> {
  const program = Effect.Effect.gen(function* () {
    const subscriberRepository = yield* SubscriberRepository;
    const subscriberService = yield* SubscriberService;
    const payload = yield* verifyToken(token);
    const sub = yield* subscriberRepository.readSubscriberByEmail(
      payload.email,
    );
    if (!sub) return "error" as UnsubscribeStatus;
    yield* subscriberService.unsubscribe(sub.id);
    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.Effect.catchTag("InvalidTokenError", () =>
      Effect.Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.Effect.catchAll(() =>
      Effect.Effect.succeed("error" as UnsubscribeStatus),
    ),
  );

  return Effect.Effect.runPromise(
    program.pipe(Effect.Effect.provide(SubscriberLayers)),
  );
}
