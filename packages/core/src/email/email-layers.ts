import { Layer } from "effect";
import { EmailServiceConsole, makeEmailServiceLive } from "./email.service";
import { SubscriberServiceLive } from "./subscriber.service";

const DEV_PLACEHOLDER_KEY = "re_local_dev_placeholder";

export function makeEmailLayers(
  apiKey: string,
  fromEmail: string,
  // biome-ignore lint/suspicious/noExplicitAny: DatabaseLive type varies by caller context
  databaseLive: Layer.Layer<any, any>,
) {
  const emailLayer =
    apiKey === DEV_PLACEHOLDER_KEY
      ? EmailServiceConsole
      : makeEmailServiceLive(apiKey, fromEmail);

  return Layer.mergeAll(
    emailLayer,
    SubscriberServiceLive.pipe(Layer.provide(databaseLive)),
  );
}
