import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";

import { EmailLayers } from "@/lib/email-layers";

type UnsubscribeResult = "success" | "invalid" | "error";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, env.BETTER_AUTH_SECRET);
    yield* subscriberService.unsubscribe(payload.email);
    return "success" as UnsubscribeResult;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeResult),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeResult)),
  );

  const result = await Effect.runPromise(
    program.pipe(Effect.provide(EmailLayers)),
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
