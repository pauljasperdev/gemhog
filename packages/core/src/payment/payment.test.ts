import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { PaymentServiceTest } from "./payment.mock";
import { PaymentService } from "./payment.service";

describe("PaymentService", () => {
  it("provides access to Polar client via mock", async () => {
    const program = Effect.gen(function* () {
      const paymentService = yield* PaymentService;
      const client = paymentService.getClient();
      return client;
    }).pipe(Effect.provide(PaymentServiceTest));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });
});
