import * as Effect from "effect";
import { EmailServiceConsole } from "./console";
import { EmailServiceLive } from "./resend";

export const EmailServiceLayer = Effect.Layer.suspend(() => {
  const isLocal = process.env.LOCAL_ENV === "1";
  return isLocal ? EmailServiceConsole : EmailServiceLive;
});
