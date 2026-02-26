import { auth } from "@gemhog/auth";

export { auth };

export type Session = typeof auth.$Infer.Session;
