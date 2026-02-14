import {
  SubscriberLayers,
  SubscriberRepository,
  SubscriberService,
  verifyToken,
} from "@gemhog/core/subscriber";
import * as Effect from "effect";

export type VerifyStatus = "success" | "expired" | "invalid" | "error";

export async function getVerifyStatus(token: string): Promise<VerifyStatus> {
  const program = Effect.Effect.gen(function* () {
    const subscriberRepository = yield* SubscriberRepository;
    const subscriberService = yield* SubscriberService;
    const payload = yield* verifyToken(token);
    const sub = yield* subscriberRepository.readSubscriberByEmail(
      payload.email,
    );
    if (!sub) return "error" as VerifyStatus;
    yield* subscriberService.verify(sub.id);
    return "success" as VerifyStatus;
  }).pipe(
    Effect.Effect.catchTag("InvalidTokenError", (error) =>
      Effect.Effect.succeed(
        (error.reason === "expired" ? "expired" : "invalid") as VerifyStatus,
      ),
    ),
    Effect.Effect.catchAll(() =>
      Effect.Effect.succeed("error" as VerifyStatus),
    ),
  );

  return Effect.Effect.runPromise(
    program.pipe(Effect.Effect.provide(SubscriberLayers)),
  );
}
