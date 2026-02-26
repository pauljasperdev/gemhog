import * as Tracer from "@effect/opentelemetry/Tracer";
import { SubscriberLayers, SubscriberService } from "@gemhog/subscriber";
import * as Effect from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { getSpanContext } from "../telemetry";

export const subscriberRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const program = Effect.Effect.gen(function* () {
        const service = yield* SubscriberService;
        return yield* service.subscribe(input.email);
      });

      const spanContext = getSpanContext(ctx.headers);
      const programWithParent = spanContext
        ? Tracer.withSpanContext(program, spanContext)
        : program;

      const effect = programWithParent.pipe(
        Effect.Effect.provide(SubscriberLayers),
        Effect.Effect.tapErrorCause((cause) =>
          Effect.Console.error(
            `[subscriber.subscribe] failed for ${input.email}: ${String(cause)}`,
          ),
        ),
      );

      return Effect.Effect.runPromise(effect);
    }),
});
