import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in" as Route);
  if (session.user.role !== "admin") redirect("/" as Route);
  return <>{children}</>;
}
