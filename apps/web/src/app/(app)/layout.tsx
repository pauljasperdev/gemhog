import { redirect } from "next/navigation";

import Header from "@/components/header";
import { getSession } from "@/server/better-auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }
  return (
    <div className="grid h-svh grid-rows-[auto_1fr] bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
