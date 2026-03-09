import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard" as Route);
  }

  return <SignInForm />;
}
