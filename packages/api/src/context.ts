import { auth } from "@gemhog/core/auth";

export type CreateContextOptions = {
  headers: Headers;
};

export async function createContext({ headers }: CreateContextOptions) {
  const session = await auth.api.getSession({ headers });
  return {
    session,
    headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
