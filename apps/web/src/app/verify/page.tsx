import Link from "next/link";

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
        Your verification link is no longer valid. Enter your email below to
        receive a new one.
      </p>
      <form action="/api/subscribe" method="POST" className="mt-6 flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-sm text-white hover:bg-blue-700"
        >
          Resend
        </button>
      </form>
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
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {status === "success" && <SuccessContent />}
        {status === "expired" && <ExpiredContent />}
        {status === "invalid" && <InvalidContent />}
        {status === "error" && <ErrorContent />}
        {!status && <ErrorContent />}
      </div>
    </div>
  );
}
