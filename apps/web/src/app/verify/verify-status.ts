import {
  SubscriberLayers,
  SubscriberService,
  verifyToken,
} from "@gemhog/core/subscriber";
import { Effect } from "effect";

export type VerifyStatus = "success" | "expired" | "invalid" | "error";

export async function getVerifyStatus(token: string): Promise<VerifyStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberService;
    const payload = yield* verifyToken(token);
    const sub = yield* subscriberService.readSubscriberByEmail(payload.email);
    if (!sub) return "error" as VerifyStatus;
    yield* subscriberService.verify(sub.id);
    return "success" as VerifyStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", (error) =>
      Effect.succeed(
        (error.reason === "expired" ? "expired" : "invalid") as VerifyStatus,
      ),
    ),
    Effect.catchAll(() => Effect.succeed("error" as VerifyStatus)),
  );

  return Effect.runPromise(program.pipe(Effect.provide(SubscriberLayers)));
}
