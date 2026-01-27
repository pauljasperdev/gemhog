import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";

import { EmailLayers } from "@/lib/email-layers";

const DEV_SECRET = "dev-secret-not-for-production-use-replace";

type VerifyStatus = "success" | "expired" | "invalid" | "error";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const secret = process.env.SUBSCRIBER_TOKEN_SECRET ?? DEV_SECRET;
  const appUrl = process.env.APP_URL ?? "http://localhost:3001";

  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, secret);

    yield* subscriberService.verify(payload.email);

    return "success" as VerifyStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", (error) =>
      Effect.succeed(
        (error.reason === "expired" ? "expired" : "invalid") as VerifyStatus,
      ),
    ),
    Effect.catchAll(() => Effect.succeed("error" as VerifyStatus)),
  );

  const status = await Effect.runPromise(
    program.pipe(Effect.provide(EmailLayers)),
  );

  return NextResponse.redirect(new URL(`/verify?status=${status}`, appUrl));
}
