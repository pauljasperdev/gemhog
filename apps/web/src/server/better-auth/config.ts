import { auth } from "@gemhog/core/auth";

export { auth };

export type Session = typeof auth.$Infer.Session;
