import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";

import { EmailLayers } from "@/lib/email-layers";

const DEV_SECRET = "dev-secret-not-for-production-use-replace";

type UnsubscribeStatus = "success" | "invalid" | "error";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const secret = process.env.SUBSCRIBER_TOKEN_SECRET ?? DEV_SECRET;

  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, secret);

    yield* subscriberService.unsubscribe(payload.email);

    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeStatus)),
  );

  const status = await Effect.runPromise(
    program.pipe(Effect.provide(EmailLayers)),
  );

  if (status === "success") {
    return NextResponse.json({ message: "Unsubscribed successfully" });
  }
  if (status === "invalid") {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 400 },
    );
  }
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL(
        "/unsubscribe?status=invalid",
        process.env.APP_URL ?? "http://localhost:3001",
      ),
    );
  }

  const secret = process.env.SUBSCRIBER_TOKEN_SECRET ?? DEV_SECRET;
  const appUrl = process.env.APP_URL ?? "http://localhost:3001";

  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, secret);

    yield* subscriberService.unsubscribe(payload.email);

    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeStatus)),
  );

  const status = await Effect.runPromise(
    program.pipe(Effect.provide(EmailLayers)),
  );

  return NextResponse.redirect(
    new URL(`/unsubscribe?status=${status}`, appUrl),
  );
}
