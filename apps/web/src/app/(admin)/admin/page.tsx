import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/server/better-auth/server";
import { SignOutButton } from "./sign-out-button";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 font-bold font-heading text-2xl text-foreground uppercase tracking-tight">
        Gemhog<span className="text-primary">.</span>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary">Admin Dashboard</CardTitle>
          <CardDescription>
            Welcome, {session?.user.name || session?.user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
