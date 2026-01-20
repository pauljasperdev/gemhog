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

// Create Polar client (deferred to avoid env validation at import time)
// This is called when the layer is used, not at module load
const createPolarClient = () => {
  // Dynamic require to defer env validation until runtime
  const { env } =
    require("@gemhog/env/server") as typeof import("@gemhog/env/server");
  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: "sandbox",
  });
};

// Implementation layer
export const PaymentLive = Layer.sync(PaymentService, () => {
  const client = createPolarClient();
  return {
    getClient: () => client,
  };
});

// Lazy getter for Polar client - backward compatibility
// Used by auth domain for better-auth polar plugin
// Returns the same client instance on subsequent calls
let _polarClient: Polar | null = null;
export const getPolarClient = (): Polar => {
  if (!_polarClient) {
    _polarClient = createPolarClient();
  }
  return _polarClient;
};

// For backward compatibility with existing imports
// Note: This will trigger env validation when accessed
export const polarClient = new Proxy({} as Polar, {
  get(_target, prop) {
    return (getPolarClient() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});
