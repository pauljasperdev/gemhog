import { Layer } from "effect";
import { makeEmailServiceLive } from "./email.service";
import { SubscriberServiceLive } from "./subscriber.service";

export function makeEmailLayers(
  apiKey: string,
  fromEmail: string,
  // biome-ignore lint/suspicious/noExplicitAny: DatabaseLive type varies by caller context
  databaseLive: Layer.Layer<any, any>,
) {
  return Layer.mergeAll(
    makeEmailServiceLive(apiKey, fromEmail),
    SubscriberServiceLive.pipe(Layer.provide(databaseLive)),
  );
}
