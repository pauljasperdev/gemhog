import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";
import Link from "next/link";

import { EmailLayers } from "@/lib/email-layers";

type VerifyStatus = "success" | "expired" | "invalid" | "error";

async function getVerifyStatus(token: string): Promise<VerifyStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, env.BETTER_AUTH_SECRET);
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

  return Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
}

function SuccessContent() {
  return (
    <>
      <h1 className="font-bold text-2xl text-gray-900">
        You&apos;re confirmed!
      </h1>
      <p className="mt-4 text-gray-600">
        Thanks for subscribing to Gemhog. You&apos;ll start receiving expert
        investment insights soon.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-sm text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </>
  );
}

function ExpiredContent() {
  return (
    <>
      <h1 className="font-bold text-2xl text-gray-900">
        This link has expired
      </h1>
      <p className="mt-4 text-gray-600">
        Your verification link is no longer valid. Please return to the home
        page to request a new one.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-sm text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </>
  );
}

function InvalidContent() {
  return (
    <>
      <h1 className="font-bold text-2xl text-gray-900">This link is invalid</h1>
      <p className="mt-4 text-gray-600">
        The verification link you used is not valid. Please check your email for
        the correct link.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-sm text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </>
  );
}

function ErrorContent() {
  return (
    <>
      <h1 className="font-bold text-2xl text-gray-900">Something went wrong</h1>
      <p className="mt-4 text-gray-600">
        We couldn&apos;t verify your email. Please try again later.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-sm text-white hover:bg-blue-700"
      >
        Back to home
      </Link>
    </>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const status = token ? await getVerifyStatus(token) : "invalid";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "success" && <SuccessContent />}
        {status === "expired" && <ExpiredContent />}
        {status === "invalid" && <InvalidContent />}
        {status === "error" && <ErrorContent />}
      </div>
    </div>
  );
}
