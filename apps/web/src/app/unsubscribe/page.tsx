import Link from "next/link";

import { getUnsubscribeStatus } from "./unsubscribe-status";

function SuccessContent() {
  return (
    <>
      <h1 className="font-bold font-heading text-2xl text-foreground uppercase tracking-tight">
        You&apos;ve been unsubscribed
      </h1>
      <p className="mt-4 text-muted-foreground">
        Sorry to see you go! You will no longer receive emails from Gemhog.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm hover:bg-primary/90"
      >
        Back to home
      </Link>
    </>
  );
}

function InvalidContent() {
  return (
    <>
      <h1 className="font-bold font-heading text-2xl text-foreground uppercase tracking-tight">
        This unsubscribe link is invalid or has expired
      </h1>
      <p className="mt-4 text-muted-foreground">
        The link you used is no longer valid. Please check your email for a more
        recent unsubscribe link.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm hover:bg-primary/90"
      >
        Back to home
      </Link>
    </>
  );
}

function ErrorContent() {
  return (
    <>
      <h1 className="font-bold font-heading text-2xl text-foreground uppercase tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-4 text-muted-foreground">
        We couldn&apos;t process your unsubscribe request. Please try again
        later.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm hover:bg-primary/90"
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center shadow-sm">
        {status === "success" && <SuccessContent />}
        {status === "invalid" && <InvalidContent />}
        {status === "error" && <ErrorContent />}
        {!status && <ErrorContent />}
      </div>
    </div>
  );
}
