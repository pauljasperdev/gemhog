import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/server/better-auth/server";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <div className="flex flex-col gap-4 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary">Admin Dashboard</CardTitle>
          <CardDescription>
            Welcome, {session?.user.name || session?.user.email}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
