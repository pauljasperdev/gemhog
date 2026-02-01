import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>
      <Dashboard session={session} />
    </div>
  );
}
