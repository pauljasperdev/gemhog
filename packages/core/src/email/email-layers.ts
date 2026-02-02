import { ServerEnvLive, ServerEnvService } from "@gemhog/env/server";
import { Effect, Layer } from "effect";
import { DatabaseLive } from "../drizzle/index";
import { EmailServiceConsole, EmailServiceLive } from "./email.service";
import { SubscriberServiceLive } from "./subscriber.service";

const DEV_PLACEHOLDER_KEY = "re_local_dev_placeholder";

const EmailServiceResolved = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { RESEND_API_KEY } = yield* ServerEnvService;
    return RESEND_API_KEY === DEV_PLACEHOLDER_KEY
      ? EmailServiceConsole
      : EmailServiceLive;
  }),
);

export const EmailLayers = Layer.mergeAll(
  EmailServiceResolved,
  SubscriberServiceLive.pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(EmailServiceResolved),
  ),
  ServerEnvLive,
).pipe(Layer.provide(ServerEnvLive));
