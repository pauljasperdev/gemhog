import { adminClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [adminClient(), emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
