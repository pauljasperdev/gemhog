"use client";
import { useQuery } from "@tanstack/react-query";

import type { Session } from "@/server/better-auth/client";
import { trpc } from "@/trpc/client";

export default function Dashboard({ session: _session }: { session: Session }) {
  const privateData = useQuery(trpc.privateData.queryOptions());

  return <p>API: {privateData.data?.message}</p>;
}
