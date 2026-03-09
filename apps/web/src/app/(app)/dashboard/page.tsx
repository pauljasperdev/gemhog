import { getSession } from "@/server/better-auth/server";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="font-bold text-3xl">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {session?.user.name ?? session?.user.email}
      </p>
    </div>
  );
}
