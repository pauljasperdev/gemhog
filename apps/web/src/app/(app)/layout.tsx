import crypto from "node:crypto";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatwootWidget } from "@/components/chatwoot-widget";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSession } from "@/server/better-auth/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/" as Route);

  const identityToken = process.env.CHATWOOT_IDENTITY_TOKEN;
  const identityHash =
    session.user.email && identityToken && identityToken !== "unknown"
      ? crypto
          .createHmac("sha256", identityToken)
          .update(session.user.email)
          .digest("hex")
      : undefined;

  return (
    <>
      <SidebarProvider>
        <AppSidebar session={session} />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
      <ChatwootWidget
        user={{
          email: session.user.email ?? null,
          name: session.user.name ?? null,
        }}
        identityHash={identityHash}
      />
    </>
  );
}
