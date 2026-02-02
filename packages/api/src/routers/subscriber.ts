import { DatabaseLive } from "@gemhog/core/drizzle";
import { makeEmailLayers, SubscriberService } from "@gemhog/core/email";
import { serverEnv } from "@gemhog/env/server";
import { Effect } from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";

const EmailLayers = makeEmailLayers(
  serverEnv.RESEND_API_KEY,
  "Gemhog <hello@gemhog.com>",
  DatabaseLive,
  { secret: serverEnv.BETTER_AUTH_SECRET, appUrl: serverEnv.APP_URL },
);

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
