import * as Tracer from "@effect/opentelemetry/Tracer";
import { EmailLayers, SubscriberService } from "@gemhog/core/email";
import { Console, Effect } from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { getSpanContext } from "../telemetry";

export const subscriberRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const program = Effect.gen(function* () {
        const service = yield* SubscriberService;
        return yield* service.subscribe(input.email);
      });

      const spanContext = getSpanContext(ctx.headers);
      const programWithParent = spanContext
        ? Tracer.withSpanContext(program, spanContext)
        : program;

      const effect = programWithParent.pipe(
        Effect.provide(EmailLayers),
        Effect.tapErrorCause((cause) =>
          Console.error(
            `[subscriber.subscribe] failed for ${input.email}: ${String(cause)}`,
          ),
        ),
      );

      return Effect.runPromise(effect);
    }),
});
