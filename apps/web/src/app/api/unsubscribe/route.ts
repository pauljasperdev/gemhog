import {
  SubscriberLayers,
  SubscriberRepository,
  SubscriberService,
  verifyToken,
} from "@gemhog/subscriber";
import * as Effect from "effect";
import { type NextRequest, NextResponse } from "next/server";

type UnsubscribeResult = "success" | "invalid" | "error";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const program = Effect.Effect.gen(function* () {
    const subscriberRepository = yield* SubscriberRepository;
    const subscriberService = yield* SubscriberService;
    const payload = yield* verifyToken(token);
    const sub = yield* subscriberRepository.readSubscriberByEmail(
      payload.email,
    );
    if (!sub) return "error" as UnsubscribeResult;
    yield* subscriberService.unsubscribe(sub.id);
    return "success" as UnsubscribeResult;
  }).pipe(
    Effect.Effect.catchTag("InvalidTokenError", () =>
      Effect.Effect.succeed("invalid" as UnsubscribeResult),
    ),
    Effect.Effect.catchAll(() =>
      Effect.Effect.succeed("error" as UnsubscribeResult),
    ),
  );

  const result = await Effect.Effect.runPromise(
    program.pipe(Effect.Effect.provide(SubscriberLayers)),
  );

  if (result === "success") {
    return NextResponse.json({ message: "Unsubscribed successfully" });
  }
  if (result === "invalid") {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 400 },
    );
  }
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
