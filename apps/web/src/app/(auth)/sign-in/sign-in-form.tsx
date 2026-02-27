"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/server/better-auth/client";

export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: email.toLowerCase().trim(),
      type: "sign-in",
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Failed to send verification code.");
      return;
    }

    setStep("otp");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: apiError } = await authClient.signIn.emailOtp({
      email,
      otp,
    });

    setLoading(false);

    if (apiError) {
      setError(apiError.message || "Invalid or expired code.");
      return;
    }

    router.push("/admin" as Route);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          {step === "email"
            ? "Enter your email to receive a one-time passcode."
            : `We sent a 6-digit code to ${email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-4 border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <div className="flex size-6 shrink-0 items-center justify-center border border-destructive/40 bg-destructive/10">
              <span className="font-bold text-destructive text-xs">!</span>
            </div>
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-12 rounded-none border-foreground/20 bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/50"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-none font-heading text-sm tracking-wide"
            >
              {loading ? "Sending..." : "Send Code"}
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-12 w-full rounded-none font-heading text-sm tracking-wide"
            >
              <Link href="/">Go back</Link>
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="flex flex-col gap-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="h-12 w-full rounded-none font-heading text-sm tracking-wide"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError(null);
                }}
                disabled={loading}
                className="h-10 w-full rounded-none font-heading text-xs tracking-wide"
              >
                Use a different email
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
