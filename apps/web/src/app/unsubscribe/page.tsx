import { SubscriberServiceTag, verifyToken } from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";
import Link from "next/link";

import { EmailLayers } from "@/lib/email-layers";

type UnsubscribeStatus = "success" | "invalid" | "error";

async function getUnsubscribeStatus(token: string): Promise<UnsubscribeStatus> {
  const program = Effect.gen(function* () {
    const subscriberService = yield* SubscriberServiceTag;
    const payload = yield* verifyToken(token, env.BETTER_AUTH_SECRET);
    yield* subscriberService.unsubscribe(payload.email);
    return "success" as UnsubscribeStatus;
  }).pipe(
    Effect.catchTag("InvalidTokenError", () =>
      Effect.succeed("invalid" as UnsubscribeStatus),
    ),
    Effect.catchAll(() => Effect.succeed("error" as UnsubscribeStatus)),
  );

  return Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));
}

function SuccessContent() {
  return (
    <>
      <h1 className="font-bold text-2xl text-gray-900">
        You&apos;ve been unsubscribed
      </h1>
      <p className="mt-4 text-gray-600">
        Sorry to see you go! You will no longer receive emails from Gemhog.
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
      <h1 className="font-bold text-2xl text-gray-900">
        This unsubscribe link is invalid or has expired
      </h1>
      <p className="mt-4 text-gray-600">
        The link you used is no longer valid. Please check your email for a more
        recent unsubscribe link.
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
        We couldn&apos;t process your unsubscribe request. Please try again
        later.
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

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const status = token ? await getUnsubscribeStatus(token) : "invalid";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "success" && <SuccessContent />}
        {status === "invalid" && <InvalidContent />}
        {status === "error" && <ErrorContent />}
        {!status && <ErrorContent />}
      </div>
    </div>
  );
}
