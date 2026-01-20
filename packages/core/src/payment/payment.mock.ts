import type { Polar } from "@polar-sh/sdk";
import { Layer } from "effect";
import { PaymentService } from "./payment.service";

// Mock Polar client for testing (won't make real API calls)
const mockPolarClient = {
  // Add mock methods as needed for tests
} as unknown as Polar;

// Mock PaymentService for unit tests
export const PaymentServiceTest = Layer.succeed(PaymentService, {
  getClient: () => mockPolarClient,
});
