import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // The parent (app) layout already redirects unauthenticated users
  // This layout only adds the admin-role guard
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard" as Route);
  }
  return <>{children}</>;
}
