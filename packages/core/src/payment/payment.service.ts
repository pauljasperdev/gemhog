import { env } from "@gemhog/env/server";
import { Polar } from "@polar-sh/sdk";
import { Context, Layer } from "effect";

// Service interface - add methods as needed
interface PaymentServiceInterface {
  readonly getClient: () => Polar;
}

// Service tag
export class PaymentService extends Context.Tag("@gemhog/core/PaymentService")<
  PaymentService,
  PaymentServiceInterface
>() {}

// Create Polar client (internal)
const createPolarClient = () =>
  new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: "sandbox",
  });

// Implementation layer
export const PaymentLive = Layer.sync(PaymentService, () => {
  const client = createPolarClient();
  return {
    getClient: () => client,
  };
});

// Export the raw Polar client for backward compatibility
// Used by auth domain for better-auth polar plugin
export const polarClient = createPolarClient();
