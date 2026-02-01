import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyAnalytics } from "./verify-analytics";
import { getVerifyStatus } from "./verify-status";

function SuccessContent() {
  return (
    <>
      <CardHeader>
        <CardTitle>You&apos;re confirmed!</CardTitle>
        <CardDescription>
          Thanks for subscribing to Gemhog. You&apos;ll start receiving expert
          investment insights soon.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
      </CardFooter>
    </>
  );
}

function ExpiredContent() {
  return (
    <>
      <CardHeader>
        <CardTitle>This link has expired</CardTitle>
        <CardDescription>
          Your verification link is no longer valid. Please return to the home
          page to request a new one.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
      </CardFooter>
    </>
  );
}

function InvalidContent() {
  return (
    <>
      <CardHeader>
        <CardTitle>This link is invalid</CardTitle>
        <CardDescription>
          The verification link you used is not valid. Please check your email
          for the correct link.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
      </CardFooter>
    </>
  );
}

function ErrorContent() {
  return (
    <>
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          We couldn&apos;t verify your email. Please try again later.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
      </CardFooter>
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <VerifyAnalytics status={status} />
      <Card className="w-full max-w-md text-center">
        {status === "success" && <SuccessContent />}
        {status === "expired" && <ExpiredContent />}
        {status === "invalid" && <InvalidContent />}
        {status === "error" && <ErrorContent />}
      </Card>
    </div>
  );
}
