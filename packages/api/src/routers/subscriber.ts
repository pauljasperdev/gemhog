import { EmailLayers, SubscriberService } from "@gemhog/core/email";
import { Effect } from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";

export const subscriberRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const program = Effect.gen(function* () {
        const service = yield* SubscriberService;
        return yield* service.subscribe(input.email);
      });

      return Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
    }),
});
