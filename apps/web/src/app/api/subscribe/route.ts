import {
  createToken,
  EmailServiceTag,
  SubscriberServiceTag,
  verificationEmail,
} from "@gemhog/core/email";
import { Effect } from "effect";
import { NextResponse } from "next/server";
import z from "zod";

import { EmailLayers } from "@/lib/email-layers";

const bodySchema = z.object({ email: z.string().email() });

const DEV_SECRET = "dev-secret-not-for-production-use-replace";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const secret = process.env.SUBSCRIBER_TOKEN_SECRET ?? DEV_SECRET;
  const appUrl = process.env.APP_URL ?? "http://localhost:3001";

  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const emailService = yield* EmailServiceTag;

    const result = yield* subscriberService.subscribe(email);

    const shouldSendVerification = result.isNew;

    // Also send verification if subscriber is pending (re-signup)
    const subscriber = yield* subscriberService.findByEmail(email);
    const isPending = subscriber?.status === "pending";

    if (shouldSendVerification || isPending) {
      const token = yield* createToken(
        {
          email,
          action: "verify",
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
        secret,
      );

      const unsubscribeToken = yield* createToken(
        {
          email,
          action: "unsubscribe",
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        },
        secret,
      );

      const verifyUrl = `${appUrl}/api/verify?token=${token}`;
      const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
      const { subject, html } = verificationEmail({ verifyUrl });

      yield* emailService.send({
        to: email,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
    }
  });

  try {
    await Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
    return NextResponse.json({
      message: "Check your email to confirm your subscription",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
