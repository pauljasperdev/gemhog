"use client";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Session } from "@/server/better-auth/client";
import { trpc } from "@/trpc/client";

export default function Dashboard({ session: _session }: { session: Session }) {
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <Card className="border-muted bg-card">
      <CardHeader>
        <CardTitle>Private Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-secondary-foreground">
          API: {privateData.data?.message ?? "Loading..."}
        </p>
      </CardContent>
    </Card>
  );
}
